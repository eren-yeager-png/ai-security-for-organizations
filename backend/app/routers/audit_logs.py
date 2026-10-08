from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AuthAuditEvent, User
from app.deps import require_roles

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit"])


class AuditLogResponse(BaseModel):
    id: int
    created_at: datetime
    event: str
    result: str | None
    user_id: int | None
    user_email: str | None
    role: str | None
    resource_type: str | None
    resource_id: str | None
    detail: dict | None
    ip_address: str | None
    user_agent: str | None
    request_id: str | None


@router.get("", response_model=list[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0, le=1_000_000),
    event: str | None = Query(None, max_length=64),
    result: str | None = Query(None, pattern="^(SUCCESS|FAILURE|DENIED)$"),
    user_id: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Admin only: newest audit events first (all filters are bound parameters)."""
    query = (
        select(AuthAuditEvent, User.email)
        .outerjoin(User, User.id == AuthAuditEvent.user_id)
        .order_by(AuthAuditEvent.id.desc())
        .limit(limit)
        .offset(offset)
    )
    if event:
        query = query.where(AuthAuditEvent.event == event.upper())
    if result:
        query = query.where(AuthAuditEvent.result == result)
    if user_id:
        query = query.where(AuthAuditEvent.user_id == user_id)
    return [
        {
            "id": row.id, "created_at": row.created_at, "event": row.event, "result": row.result,
            "user_id": row.user_id, "user_email": email, "role": row.role,
            "resource_type": row.resource_type, "resource_id": row.resource_id, "detail": row.detail,
            "ip_address": row.ip_address, "user_agent": row.user_agent, "request_id": row.request_id,
        }
        for row, email in db.execute(query).all()
    ]
