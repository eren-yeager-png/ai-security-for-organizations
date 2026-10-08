"""Security audit trail (table: auth_audit_events).

Two entry points:
  * record_auth_event(db, ...) — adds the row to the CALLER's session, so it
    is committed (or rolled back) together with the caller's own changes.
    Used by the existing auth/user flows.
  * audit_event(...) — writes in its OWN session and commits immediately, so
    the row survives even when the request ends in an error (e.g. a 403).

Request context (request id, client IP, user agent) is attached automatically
from the middleware in app.main.

NEVER pass passwords, tokens, raw PII, document text, file paths or prompts:
`detail` only accepts short scalar values and is sanitized below.
"""

import logging
from contextvars import ContextVar
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.db.models import AuthAuditEvent, User

logger = logging.getLogger(__name__)

MAX_DETAIL_KEYS = 20
MAX_DETAIL_STRING = 200


@dataclass(frozen=True)
class RequestContext:
    request_id: str | None = None
    ip_address: str | None = None
    user_agent: str | None = None


request_context: ContextVar[RequestContext] = ContextVar("request_context", default=RequestContext())


def _clean_detail(detail: dict | None) -> dict | None:
    if not detail:
        return None
    clean: dict = {}
    for key, value in list(detail.items())[:MAX_DETAIL_KEYS]:
        if isinstance(value, (bool, int, float)) or value is None:
            clean[str(key)[:64]] = value
        elif isinstance(value, str):
            clean[str(key)[:64]] = value[:MAX_DETAIL_STRING]
        elif isinstance(value, (list, tuple, set)):
            clean[str(key)[:64]] = [item if isinstance(item, (int, float, bool)) else str(item)[:MAX_DETAIL_STRING] for item in list(value)[:50]]
        elif isinstance(value, dict):
            clean[str(key)[:64]] = {str(k)[:64]: v for k, v in list(value.items())[:MAX_DETAIL_KEYS] if isinstance(v, (bool, int, float))}
    return clean


def _build(event: str, user_id: int | None, role: str | None, success: bool, result: str | None,
           resource_type: str | None, resource_id: object, detail: dict | None) -> AuthAuditEvent:
    context = request_context.get()
    return AuthAuditEvent(
        event=event[:64],
        user_id=user_id,
        role=role,
        success=success,
        result=result or ("SUCCESS" if success else "FAILURE"),
        resource_type=resource_type,
        resource_id=str(resource_id)[:64] if resource_id is not None else None,
        detail=_clean_detail(detail),
        ip_address=context.ip_address,
        user_agent=context.user_agent,
        request_id=context.request_id,
    )


def record_auth_event(db: Session, event: str, user_id: int | None = None, success: bool = True, role: str | None = None) -> None:
    db.add(_build(event, user_id, role, success, None, None, None, None))


def audit_event(
    event: str,
    user: User | None = None,
    *,
    result: str = "SUCCESS",
    resource_type: str | None = None,
    resource_id: object = None,
    detail: dict | None = None,
    user_id: int | None = None,
    role: str | None = None,
) -> None:
    """Persist an audit row independently of the caller's transaction. Never raises."""
    from app.db.database import SessionLocal  # local import avoids a cycle at startup

    if user is not None:
        user_id = user.id
        role = user.role.name if user.role else role
    db = SessionLocal()
    try:
        db.add(_build(event, user_id, role, result == "SUCCESS", result, resource_type, resource_id, detail))
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("audit_write_failed event=%s", event)
    finally:
        db.close()
