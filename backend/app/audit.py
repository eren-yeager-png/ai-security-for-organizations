from sqlalchemy.orm import Session

from app.db.models import AuthAuditEvent


def record_auth_event(db: Session, event: str, user_id: int | None = None, success: bool = True) -> None:
    db.add(AuthAuditEvent(event=event, user_id=user_id, success=success))