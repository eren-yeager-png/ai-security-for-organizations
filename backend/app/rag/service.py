"""Permission-aware RAG query flow.

    user (from JWT)                               PostgreSQL
        |                                              |
        +-- searchable_document_ids(user) <------------+  classification + grants
        |        (allow-list)                             + status=completed + indexed
        v
    embed query -> vector search WHERE document_id IN allow-list   (ChromaDB)
        |
        v
    re-verify every chunk against PostgreSQL (defense in depth)
        |
        v
    authorized chunks only -> LLM / extractive answer -> answer + sources

Unauthorized documents are never searched, never sent to the LLM, and never
appear in sources. "No access" and "nothing relevant" give the same answer,
so the response does not reveal whether restricted documents exist.
"""

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit import audit_event
from app.authorization import can_read_document, searchable_document_ids
from app.config import RAG_MIN_SIMILARITY, RAG_TOP_K
from app.db.models import Document, User
from app.processing.pii import detect_pii, mask_text
from app.rag import vector_store
from app.rag.embeddings import get_embedder
from app.rag.generation import NO_RESULTS_ANSWER, generate_answer
from app.rag.prompt_safety import detect_prompt_injection
from app.rag.vector_store import RetrievedChunk

logger = logging.getLogger(__name__)

SNIPPET_CHARS = 300


def retrieve_authorized_chunks(db: Session, user: User, question: str, top_k: int = RAG_TOP_K) -> tuple[list[RetrievedChunk], dict[int, Document]]:
    allowed_ids = searchable_document_ids(db, user)
    if not allowed_ids:
        return [], {}

    embedder = get_embedder()
    query_embedding = embedder.embed([question])[0]
    candidates = vector_store.query(embedder.name, query_embedding, allowed_ids, top_k)
    candidates = [chunk for chunk in candidates if chunk.similarity >= RAG_MIN_SIMILARITY]

    # Defense in depth: re-check each chunk's document in PostgreSQL right now.
    documents = {
        document.id: document
        for document in db.scalars(select(Document).where(Document.id.in_({chunk.document_id for chunk in candidates}))).all()
    }
    authorized: list[RetrievedChunk] = []
    for chunk in candidates:
        document = documents.get(chunk.document_id)
        if (
            document is None
            or document.status != "completed"
            or chunk.classification != document.classification  # stale index metadata: fail closed
            or not can_read_document(db, user, document)
        ):
            logger.warning("rag_chunk_rejected_after_retrieval chunk_id=%s user_id=%s", chunk.chunk_id, user.id)
            audit_event("RAG_CHUNK_REJECTED", user, result="DENIED", resource_type="document", resource_id=chunk.document_id,
                        detail={"reason": "failed_post_retrieval_authorization"})
            continue
        authorized.append(chunk)
    authorized_documents = {chunk.document_id: documents[chunk.document_id] for chunk in authorized}
    return authorized, authorized_documents


INJECTION_NOTICE = "Some passages were withheld because they contained instruction-like text (possible prompt injection)."


def _screen_chunks(user: User, chunks: list[RetrievedChunk]) -> tuple[list[RetrievedChunk], int]:
    """Drop duplicate passages and passages that look like prompt injection.

    Runs AFTER authorization, so it only ever narrows what the user may see.
    """
    kept: list[RetrievedChunk] = []
    seen_texts: set[str] = set()
    withheld = 0
    for chunk in chunks:
        normalized = " ".join(chunk.text.lower().split())
        if normalized in seen_texts:
            continue  # same passage indexed twice (e.g. the same file uploaded again)
        seen_texts.add(normalized)
        rules = detect_prompt_injection(chunk.text)
        if rules:
            withheld += 1
            audit_event("PROMPT_INJECTION_DETECTED", user, result="DENIED", resource_type="document", resource_id=chunk.document_id,
                        detail={"chunk_index": chunk.chunk_index, "rules": rules})
            continue
        kept.append(chunk)
    return kept, withheld


def answer_query(db: Session, user: User, question: str, top_k: int = RAG_TOP_K) -> dict:
    authorized, documents = retrieve_authorized_chunks(db, user, question, top_k)
    chunks, withheld = _screen_chunks(user, authorized)
    documents = {chunk.document_id: documents[chunk.document_id] for chunk in chunks}
    titles = {document_id: document.title for document_id, document in documents.items()}

    # The question itself may contain personal data; mask it before it can reach an external LLM.
    safe_question = mask_text(question, detect_pii(question))
    answer, mode = generate_answer(safe_question, chunks, titles)

    sources = [
        {
            "document_id": chunk.document_id,
            "title": documents[chunk.document_id].title,
            "classification": documents[chunk.document_id].classification,
            "source_type": documents[chunk.document_id].source_type,
            "source_url": documents[chunk.document_id].source_url,
            "file_name": documents[chunk.document_id].file_name,
            "page_number": chunk.page_number,
            "chunk_index": chunk.chunk_index,
            "snippet": chunk.text[:SNIPPET_CHARS],
            "similarity": chunk.similarity,
        }
        for chunk in chunks
    ]
    notices = [INJECTION_NOTICE] if withheld else []

    # Audit/log IDs and counts only — never the question or document text.
    audit_event(
        "RAG_QUERY",
        user,
        result="SUCCESS" if chunks else "FAILURE",
        resource_type="rag",
        detail={
            "mode": mode,
            "chunks": len(chunks),
            "document_ids": sorted({chunk.document_id for chunk in chunks}),
            "withheld_injection": withheld,
            "query_length": len(question),
            "query_injection_suspected": bool(detect_prompt_injection(question)),
        },
    )
    logger.info("rag_query user_id=%s role=%s chunks=%s documents=%s mode=%s withheld=%s", user.id, user.role.name, len(chunks), sorted({c.document_id for c in chunks}), mode, withheld)
    return {"answer": answer if chunks else NO_RESULTS_ANSWER, "mode": mode, "sources": sources, "notices": notices}
