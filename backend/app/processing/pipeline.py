"""Document processing pipeline.

    pending -> processing -> extract text -> scan for PII -> apply policy
                                  |                               |
                                  v                     blocked <-+-> chunk + embed + index (Sprint 5)
                                failed                                    |            |
                                                                      completed      failed

A document is only "completed" (and therefore RAG-searchable) after its safe
text has been stored AND indexed in the vector store.

Runs as a FastAPI background task right after upload / URL registration, and
can be re-run by an admin via POST /api/v1/documents/{id}/process.
The database row is the source of truth for status.

Only policy-safe text is ever written to `document_pages`:
  DETECT -> original text (findings are recorded in pii_summary)
  MASK   -> text with each finding replaced by [TYPE_REDACTED]
  BLOCK  -> nothing is stored when PII is found; status becomes "blocked",
            so the document can never reach the Sprint 5 RAG/LLM pipeline.

The vector index is built from exactly the same safe pages, never raw text.
"""

import logging
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path

from sqlalchemy import delete

from app.audit import audit_event
from app.config import UPLOAD_DIR
from app.db.database import SessionLocal
from app.db.models import Document, DocumentPage
from app.processing.extractors import ExtractionError, PageText, extract_csv, extract_pdf
from app.processing.pii import PiiPolicy, detect_pii, mask_text, summarize
from app.processing.url_fetcher import extract_url
from app.rag import indexing

logger = logging.getLogger(__name__)


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"


def stored_file_path(stored_file_name: str) -> Path:
    """Resolve a stored file name inside UPLOAD_DIR, refusing anything that escapes it."""
    if not stored_file_name or Path(stored_file_name).name != stored_file_name:
        raise ExtractionError("Stored file reference is invalid")
    path = (UPLOAD_DIR / stored_file_name).resolve()
    if path.parent != UPLOAD_DIR:
        raise ExtractionError("Stored file reference is invalid")
    return path


def _extract(document: Document) -> list[PageText]:
    if document.source_type == "url":
        if not document.source_url:
            raise ExtractionError("Document has no source URL")
        return extract_url(document.source_url)
    if document.source_type == "file":
        if not document.stored_file_name:
            raise ExtractionError("No uploaded file is associated with this document")
        path = stored_file_path(document.stored_file_name)
        if not path.is_file():
            raise ExtractionError("Uploaded file is missing from storage")
        data = path.read_bytes()
        if path.suffix.lower() == ".csv":
            return extract_csv(data)
        return extract_pdf(data)
    raise ExtractionError(f"Unsupported source type: {document.source_type[:20]}")


def _apply_policy(pages: list[PageText], policy: str) -> tuple[list[PageText] | None, dict[str, int]]:
    """Returns (safe pages or None if blocked, findings summary)."""
    findings_by_page = [(page, detect_pii(page.text)) for page in pages]
    summary: dict[str, int] = {}
    for _, findings in findings_by_page:
        for entity_type, count in summarize(findings).items():
            summary[entity_type] = summary.get(entity_type, 0) + count

    if policy == PiiPolicy.BLOCK.value and summary:
        return None, summary
    if policy == PiiPolicy.DETECT.value:
        return pages, summary
    # MASK (also the fail-safe default for any unexpected policy value)
    return [PageText(page.page_number, mask_text(page.text, findings)) for page, findings in findings_by_page], summary


def process_document(document_id: int) -> None:
    """Process one document in its own DB session. Never raises."""
    db = SessionLocal()
    try:
        document = db.get(Document, document_id)
        if document is None:
            return
        document.status = DocumentStatus.PROCESSING.value
        document.processing_error = None
        db.commit()
        _remove_from_index(document_id)

        try:
            pages = _extract(document)
            safe_pages, summary = _apply_policy(pages, document.pii_policy)
        except ExtractionError as exc:
            _finish(db, document, DocumentStatus.FAILED, error=str(exc))
            logger.info("document_processing_failed document_id=%s reason=%s", document_id, exc)
            return
        except Exception:
            logger.exception("document_processing_crashed document_id=%s", document_id)
            db.rollback()
            _finish(db, document, DocumentStatus.FAILED, error="Unexpected processing error")
            return

        document.pii_summary = summary
        if safe_pages is None:
            types = ", ".join(sorted(summary))
            _finish(db, document, DocumentStatus.BLOCKED, error=f"Blocked by PII policy: sensitive data detected ({types})")
            logger.info("document_processing_blocked document_id=%s pii_types=%s", document_id, types)
            return
        try:
            chunk_count = indexing.index_document(document, [(page.page_number, page.text) for page in safe_pages])
        except Exception:
            logger.exception("document_indexing_failed document_id=%s", document_id)
            _remove_from_index(document_id)
            _finish(db, document, DocumentStatus.FAILED, error="Search indexing failed; reprocess the document to retry")
            return
        document.chunk_count = chunk_count
        document.indexed_at = datetime.now(timezone.utc)
        _finish(db, document, DocumentStatus.COMPLETED, pages=safe_pages)
        logger.info("document_processing_completed document_id=%s pages=%s chunks=%s pii_types=%s", document_id, len(safe_pages), chunk_count, sorted(summary))
    except Exception:
        # Last resort (e.g. database error while saving): never leave it "processing".
        logger.exception("document_processing_status_update_failed document_id=%s", document_id)
        db.rollback()
        try:
            document = db.get(Document, document_id)
            if document is not None:
                _finish(db, document, DocumentStatus.FAILED, error="Unexpected processing error")
        except Exception:
            logger.exception("document_processing_could_not_mark_failed document_id=%s", document_id)
    finally:
        db.close()


def _finish(db, document: Document, status: DocumentStatus, error: str | None = None, pages: list[PageText] | None = None) -> None:
    # Old pages are replaced on every run; failed/blocked runs leave no content behind.
    db.execute(delete(DocumentPage).where(DocumentPage.document_id == document.id))
    for page in pages or []:
        db.add(DocumentPage(document_id=document.id, page_number=page.page_number, content=page.text))
    if status is DocumentStatus.FAILED:
        document.pii_summary = None
    if status is not DocumentStatus.COMPLETED:
        document.chunk_count = None
        document.indexed_at = None
    document.status = status.value
    document.processing_error = error[:1000] if error else None
    document.processed_at = datetime.now(timezone.utc)
    db.commit()
    audit_event(
        "DOCUMENT_PROCESSED",
        result="SUCCESS" if status is DocumentStatus.COMPLETED else ("DENIED" if status is DocumentStatus.BLOCKED else "FAILURE"),
        resource_type="document",
        resource_id=document.id,
        detail={"status": status.value, "chunks": document.chunk_count, "pii_types": sorted(document.pii_summary or {}), "error": error},
    )


def _remove_from_index(document_id: int) -> None:
    # Not fatal: retrieval only searches documents whose status is "completed"
    # in PostgreSQL, so leftover chunks of a non-completed document are unreachable.
    try:
        indexing.remove_document(document_id)
    except Exception:
        logger.warning("document_index_removal_failed document_id=%s", document_id)
