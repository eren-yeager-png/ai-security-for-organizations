import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import HTTPException

from app.audit import audit_event
from app.config import RAG_RATE_LIMIT_PER_MINUTE, RAG_TOP_K
from app.rate_limit import SlidingWindowLimiter
from app.db.database import SessionLocal, get_db
from app.db.models import Document, User
from app.deps import get_current_user, require_roles
from app.rag import indexing
from app.rag.service import answer_query
from app.schemas import RagQueryRequest, RagQueryResponse, RagReindexRequest, RagReindexResponse

router = APIRouter(
    prefix="/api/v1/rag",
    tags=["rag"],
)
logger = logging.getLogger(__name__)

# Per-user budget: each question costs an embedding, a vector search and possibly an LLM call.
rag_limiter = SlidingWindowLimiter(RAG_RATE_LIMIT_PER_MINUTE, 60)


@router.post("/query", response_model=RagQueryResponse)
def rag_query(
    payload: RagQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Answer a question using ONLY documents the current user may read."""
    if not rag_limiter.hit(f"user:{current_user.id}"):
        audit_event("RAG_RATE_LIMITED", current_user, result="DENIED", resource_type="rag")
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many questions. Please wait a minute and try again.", headers={"Retry-After": "60"})
    return answer_query(db, current_user, payload.query, payload.top_k or RAG_TOP_K)


def reindex_completed_documents(document_ids: list[int]) -> None:
    """Rebuild vector-store chunks from the stored safe pages (no re-extraction)."""
    db = SessionLocal()
    try:
        for document_id in document_ids:
            document = db.get(Document, document_id)
            if document is None or document.status != "completed":
                continue
            try:
                document.chunk_count = indexing.index_document(document, [(page.page_number, page.content) for page in document.pages])
                document.indexed_at = datetime.now(timezone.utc)
            except Exception:
                logger.exception("document_reindex_failed document_id=%s", document_id)
                # Readable but not searchable until a successful re-index.
                document.chunk_count = None
                document.indexed_at = None
            db.commit()
    finally:
        db.close()


@router.post("/reindex", response_model=RagReindexResponse, status_code=status.HTTP_202_ACCEPTED)
def rag_reindex(
    background_tasks: BackgroundTasks,
    payload: RagReindexRequest | None = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    """Admin: (re)build the vector index for every completed document.

    Use after first enabling Sprint 5 (documents processed earlier are not
    indexed yet) or after changing the embedding model / chunk settings.
    """
    query = select(Document.id).where(Document.status == "completed").order_by(Document.id)
    if payload is not None and payload.document_ids is not None:
        query = query.where(Document.id.in_(payload.document_ids))
    document_ids = list(db.scalars(query).all())
    background_tasks.add_task(reindex_completed_documents, document_ids)
    logger.info("rag_reindex_queued admin_id=%s documents=%s", admin.id, len(document_ids))
    return {"queued_documents": len(document_ids)}
