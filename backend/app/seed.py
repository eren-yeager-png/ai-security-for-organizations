import os

from sqlalchemy import select

from app.db.database import SessionLocal
from app.db.models import Role, User
from app.security import hash_password, normalize_email, validate_password


def seed_admin() -> None:
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        raise RuntimeError("ADMIN_EMAIL and ADMIN_PASSWORD are required")
    validate_password(password)
    db = SessionLocal()
    try:
        role = db.scalar(select(Role).where(Role.name == "admin"))
        if role is None:
            raise RuntimeError("Run database migrations before seeding the admin")
        user = db.scalar(select(User).where(User.email == normalize_email(email)))
        if user is None:
            db.add(User(email=normalize_email(email), password_hash=hash_password(password), role=role, is_active=True))
        else:
            user.role = role
            user.is_active = True
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()