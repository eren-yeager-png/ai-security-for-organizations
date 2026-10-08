import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.audit import audit_event
from app.authorization import get_readable_document, readable_documents_query
from app.config import MAX_UPLOAD_BYTES, PII_DEFAULT_POLICY, UPLOAD_DIR
from app.db.database import get_db
from app.db.models import Document, User
from app.deps import get_current_user, require_roles
from app.processing.extractors import ExtractionError
from app.processing.pii import PiiPolicy
from app.processing.pipeline import DocumentStatus, process_document, stored_file_path
from app.rag import indexing
from app.schemas import (
    DocumentClassification,
    DocumentContentResponse,
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
    DocumentURLCreate,
)

router = APIRouter(
    prefix="/api/v1/documents",
    tags=["documents"],
)
logger = logging.getLogger(__name__)

ALLOWED_UPLOAD_EXTENSIONS = {".pdf": "application/pdf", ".csv": "text/csv"}
UPLOAD_CHUNK_BYTES = 1024 * 1024
# Magic numbers of executables/archives/documents that must never pass as CSV text.
BINARY_SIGNATURES = (b"MZ", b"\x7fELF", b"PK\x03\x04", b"%PDF-", b"\xca\xfe\xba\xbe", b"\xcf\xfa\xed\xfe", b"#!")
STALE_PROCESSING_AFTER = timedelta(minutes=10)


def default_pii_policy(requested: PiiPolicy | None) -> str:
    if requested is not None:
        return requested.value
    return PII_DEFAULT_POLICY if PII_DEFAULT_POLICY in PiiPolicy.__members__ else PiiPolicy.MASK.value


def get_document_or_404(db: Session, document_id: int) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


def safe_display_name(filename: str | None) -> str:
    # Keep only the last path component and printable characters. This name is
    # shown in the UI only; it is never used to build a filesystem path.
    name = (filename or "").replace("\\", "/").split("/")[-1]
    name = "".join(ch for ch in name if ch.isprintable()).strip()
    return name[:255] or "upload"


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_document(
    payload: DocumentCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    document = Document(
        title=payload.title,
        description=payload.description,
        classification=payload.classification,
        source_type=payload.source_type,
        source_url=payload.source_url,
        file_name=payload.file_name,
        status=DocumentStatus.PENDING.value,
        pii_policy=default_pii_policy(None),
        created_by=admin.id,
    )

    db.add(document)
    db.commit()
    db.refresh(document)
    audit_event("DOCUMENT_CREATED", admin, resource_type="document", resource_id=document.id, detail={"classification": document.classification})

    return document


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    classification: DocumentClassification = Form(...),
    pii_policy: PiiPolicy | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    display_name = safe_display_name(file.filename)
    extension = Path(display_name).suffix.lower()
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        audit_event("UPLOAD_REJECTED", admin, result="FAILURE", detail={"reason": "unsupported_extension"})
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF and CSV files are supported")

    # Random server-side name: no path traversal, no overwriting other uploads.
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{extension}"
    path = UPLOAD_DIR / stored_name
    try:
        size = 0
        with path.open("xb") as buffer:
            while chunk := file.file.read(UPLOAD_CHUNK_BYTES):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB upload limit")
                buffer.write(chunk)
        if size == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
        with path.open("rb") as stored:
            head = stored.read(8192)
        if extension == ".pdf" and not head.startswith(b"%PDF-"):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="File content is not a valid PDF")
        if extension == ".csv" and (b"\x00" in head or head.startswith(BINARY_SIGNATURES)):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="File content is not a valid CSV text file")
    except BaseException as exc:
        path.unlink(missing_ok=True)
        if isinstance(exc, HTTPException):
            audit_event("UPLOAD_REJECTED", admin, result="FAILURE", detail={"reason": exc.detail, "status": exc.status_code})
        raise

    document = Document(
        title=display_name,
        description=None,
        classification=classification,
        source_type="file",
        source_url=None,
        file_name=display_name,
        stored_file_name=stored_name,
        status=DocumentStatus.PENDING.value,
        pii_policy=default_pii_policy(pii_policy),
        created_by=admin.id,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    audit_event("DOCUMENT_UPLOADED", admin, resource_type="document", resource_id=document.id, detail={"classification": document.classification, "size_bytes": size, "pii_policy": document.pii_policy})
    # Runs after the response is sent; the client polls GET /{id} for status.
    background_tasks.add_task(process_document, document.id)
    return document


@router.post(
    "/url",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_url(
    payload: DocumentURLCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    document = Document(
        title=payload.url[:255],
        description=None,
        classification=payload.classification,
        source_type="url",
        source_url=payload.url,
        file_name=None,
        status=DocumentStatus.PENDING.value,
        pii_policy=default_pii_policy(payload.pii_policy),
        created_by=admin.id,
    )

    db.add(document)
    db.commit()
    db.refresh(document)
    audit_event("DOCUMENT_URL_REGISTERED", admin, resource_type="document", resource_id=document.id, detail={"classification": document.classification, "pii_policy": document.pii_policy})

    background_tasks.add_task(process_document, document.id)
    return document


@router.get(
    "",
    response_model=list[DocumentResponse],
)
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Classification policy (+ honoured explicit grants) is applied in SQL.
    return db.scalars(readable_documents_query(current_user).order_by(Document.id)).all()


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_readable_document(db, current_user, document_id)


@router.get(
    "/{document_id}/content",
    response_model=DocumentContentResponse,
)
def get_document_content(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Authorization first, so unauthorized users learn nothing about status.
    document = get_readable_document(db, current_user, document_id)
    if document.status != DocumentStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Document content is not available (status: {document.status})",
        )
    logger.info("document_content_read user_id=%s document_id=%s", current_user.id, document.id)
    audit_event("DOCUMENT_CONTENT_READ", current_user, resource_type="document", resource_id=document.id, detail={"classification": document.classification})
    return DocumentContentResponse(
        document_id=document.id,
        title=document.title,
        classification=document.classification,
        status=document.status,
        pii_policy=document.pii_policy,
        pii_summary=document.pii_summary,
        pages=document.pages,
    )


def original_file_response(document: Document, user: User) -> FileResponse:
    """Stream the stored upload. The storage path never leaves the server."""
    if document.source_type != "file" or not document.stored_file_name:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No uploaded file for this document")
    try:
        path = stored_file_path(document.stored_file_name)  # refuses anything outside UPLOAD_DIR
    except ExtractionError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No uploaded file for this document")
    if not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded file is missing from storage")
    logger.info("document_downloaded variant=original user_id=%s document_id=%s", user.id, document.id)
    audit_event("DOCUMENT_DOWNLOADED", user, resource_type="document", resource_id=document.id, detail={"variant": "original", "classification": document.classification})
    return FileResponse(
        path,
        media_type=ALLOWED_UPLOAD_EXTENSIONS.get(path.suffix.lower(), "application/octet-stream"),
        filename=document.file_name or path.name,
        content_disposition_type="attachment",
        headers={"X-Document-Variant": "original"},
    )


def processed_text_response(document: Document, user: User) -> Response:
    """Download the processed (PII-policy-applied) text as a .txt file."""
    if document.status != DocumentStatus.COMPLETED.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Document is not available for download (status: {document.status})")
    if len(document.pages) > 1:
        body = "\n\n".join(f"--- Page {page.page_number} ---\n{page.content}" for page in document.pages)
    else:
        body = "\n\n".join(page.content for page in document.pages)
    stem = Path(document.file_name or "").stem or f"document-{document.id}"
    filename = f"{stem}.redacted.txt" if document.pii_summary else f"{stem}.txt"
    ascii_name = filename.encode("ascii", "ignore").decode() or f"document-{document.id}.txt"
    ascii_name = ascii_name.replace('"', "").replace("\\", "")
    logger.info("document_downloaded variant=processed_text user_id=%s document_id=%s", user.id, document.id)
    audit_event("DOCUMENT_DOWNLOADED", user, resource_type="document", resource_id=document.id, detail={"variant": "processed_text", "classification": document.classification})
    return Response(
        content=body,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f"attachment; filename=\"{ascii_name}\"; filename*=utf-8''{quote(filename)}",
            "X-Document-Variant": "processed_text",
        },
    )


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download a document the user is allowed to read.

    Authorization is the SAME check used for reading (classification + honoured
    grants) -> 404 / 403 before anything else happens. Then:
      * admin                                   -> original uploaded file
      * others, file processed without PII
        (or pii_policy DETECT)                  -> original uploaded file
      * others, file where PII was masked       -> redacted text (.txt), so a
                                                   download never reveals more
                                                   than /content does
      * URL documents                           -> processed text (.txt)
      * not processed yet / blocked             -> 409
    """
    document = get_readable_document(db, current_user, document_id)
    is_file = document.source_type == "file" and bool(document.stored_file_name)
    if is_file and current_user.role.name == "admin":
        return original_file_response(document, current_user)
    if document.status != DocumentStatus.COMPLETED.value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Document is not available for download (status: {document.status})")
    if is_file and (document.pii_policy == PiiPolicy.DETECT.value or not document.pii_summary):
        return original_file_response(document, current_user)
    return processed_text_response(document, current_user)


@router.get("/{document_id}/file")
def download_original_file(
    document_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    # Kept for compatibility: admin-only original file. New clients use /download.
    return original_file_response(get_document_or_404(db, document_id), admin)


@router.post(
    "/{document_id}/process",
    response_model=DocumentResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    """Re-run processing, e.g. after a failure or after changing pii_policy."""
    document = get_document_or_404(db, document_id)
    if document.status == DocumentStatus.PROCESSING.value:
        started = document.updated_at
        if started.tzinfo is None:
            started = started.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) - started < STALE_PROCESSING_AFTER:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Document is already being processed")
    document.status = DocumentStatus.PENDING.value
    document.processing_error = None
    db.commit()
    db.refresh(document)
    audit_event("DOCUMENT_REPROCESS_REQUESTED", admin, resource_type="document", resource_id=document.id)
    background_tasks.add_task(process_document, document.id)
    return document


@router.put(
    "/{document_id}",
    response_model=DocumentResponse,
)
def update_document(
    document_id: int,
    payload: DocumentUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    document = get_document_or_404(db, document_id)

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)
    audit_event("DOCUMENT_UPDATED", admin, resource_type="document", resource_id=document.id, detail={"fields": sorted(update_data), "classification": document.classification})

    # Keep chunk metadata (classification, title) in sync with PostgreSQL. If this
    # fails, retrieval drops chunks whose classification no longer matches (fail closed).
    if document.indexed_at is not None and {"classification", "title", "file_name", "source_url"} & update_data.keys():
        try:
            indexing.sync_document_metadata(document)
        except Exception:
            logger.warning("document_index_metadata_sync_failed document_id=%s", document.id)

    return document


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    document = get_document_or_404(db, document_id)
    stored_name = document.stored_file_name

    classification = document.classification
    db.delete(document)
    db.commit()
    audit_event("DOCUMENT_DELETED", admin, resource_type="document", resource_id=document_id, detail={"classification": classification})

    # Remove its chunks from the vector store. (Even if this fails, retrieval
    # only searches documents that still exist in PostgreSQL.)
    try:
        indexing.remove_document(document_id)
    except Exception:
        logger.warning("document_index_removal_failed document_id=%s", document_id)

    # Remove the stored file unless another document still references it
    # (possible for rows created before stored_file_name existed).
    if stored_name and not db.scalar(select(func.count(Document.id)).where(Document.stored_file_name == stored_name)):
        try:
            stored_file_path(stored_name).unlink(missing_ok=True)
        except (ExtractionError, OSError):
            logger.warning("document_file_cleanup_failed document_id=%s", document_id)

    return None
