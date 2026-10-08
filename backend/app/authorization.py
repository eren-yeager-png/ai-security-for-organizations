"""Document authorization policy — the single source of truth.

Every endpoint that returns document data (metadata, content, files, and the
Sprint 5 RAG retriever) must use the helpers in this module instead of writing
its own role checks.

Baseline policy (classification decides access):

    Public        -> admin, manager, employee
    Internal      -> admin, manager
    Confidential  -> admin only

Explicit per-user grants (the `permissions` table) are an exception mechanism
for need-to-know access, and they are deliberately limited: a grant is only
honoured for Internal documents. A grant can never open a Confidential
document to a non-admin, even if such a row exists in the database (for
example because the document was reclassified after the grant was made).
"""

import logging

from fastapi import HTTPException, status
from sqlalchemy import Select, and_, exists, or_, select
from sqlalchemy.orm import Session

from app.audit import audit_event
from app.db.models import Document, Permission, User

logger = logging.getLogger(__name__)

CLASSIFICATION_ACCESS: dict[str, frozenset[str]] = {
    "Public": frozenset({"admin", "manager", "employee"}),
    "Internal": frozenset({"admin", "manager"}),
    "Confidential": frozenset({"admin"}),
}

# Classifications for which an explicit per-user "read" grant is honoured.
GRANTABLE_CLASSIFICATIONS: frozenset[str] = frozenset({"Internal"})


def role_can_read_classification(role: str, classification: str) -> bool:
    # Unknown classifications fall through to "deny" (fail closed).
    return role in CLASSIFICATION_ACCESS.get(classification, frozenset())


def readable_classifications(role: str) -> list[str]:
    return [name for name, roles in CLASSIFICATION_ACCESS.items() if role in roles]


def _has_explicit_grant(db: Session, user: User, document: Document) -> bool:
    if document.classification not in GRANTABLE_CLASSIFICATIONS:
        return False
    return db.scalar(
        select(Permission.id).where(
            Permission.document_id == document.id,
            Permission.user_id == user.id,
            Permission.permission == "read",
        )
    ) is not None


def can_read_document(db: Session, user: User, document: Document) -> bool:
    if not user.is_active:
        return False
    if role_can_read_classification(user.role.name, document.classification):
        return True
    return _has_explicit_grant(db, user, document)


def readable_documents_query(user: User) -> Select[tuple[Document]]:
    """SELECT for every document this user may read.

    Use this for listings and (in Sprint 5) for restricting RAG retrieval, so
    that list/search results can never include documents the user could not
    open directly.
    """
    query = select(Document)
    if user.role.name == "admin":
        return query
    grant_exists = exists().where(
        Permission.document_id == Document.id,
        Permission.user_id == user.id,
        Permission.permission == "read",
    )
    return query.where(
        or_(
            Document.classification.in_(readable_classifications(user.role.name)),
            and_(Document.classification.in_(GRANTABLE_CLASSIFICATIONS), grant_exists),
        )
    )


def get_readable_document(db: Session, user: User, document_id: int) -> Document:
    """Load a document and enforce read access, or raise 404/403."""
    document = db.get(Document, document_id)
    if document is None:
        audit_event("DOCUMENT_NOT_FOUND", user, result="FAILURE", resource_type="document", resource_id=document_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not can_read_document(db, user, document):
        audit_event("DOCUMENT_ACCESS_DENIED", user, result="DENIED", resource_type="document", resource_id=document.id, detail={"classification": document.classification})
        logger.warning(
            "document_access_denied user_id=%s role=%s document_id=%s classification=%s",
            user.id, user.role.name, document.id, document.classification,
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this document")
    return document


def searchable_document_ids(db: Session, user: User) -> set[int]:
    """IDs of documents this user may read AND that are fully processed + indexed.

    This is the allow-list handed to the vector search (Sprint 5 RAG). It is
    computed fresh from PostgreSQL on every query, so reclassification, grants,
    deactivation and deletion take effect immediately.
    """
    if not user.is_active:
        return set()
    query = readable_documents_query(user).where(
        Document.status == "completed",
        Document.indexed_at.is_not(None),
    )
    return set(db.scalars(query.with_only_columns(Document.id)).all())
