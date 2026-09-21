import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Role, User
from app.deps import require_roles
from app.schemas import UserCreate, UserResponse, UserUpdate
from app.security import hash_password, normalize_email

router = APIRouter(prefix="/api/v1/users", tags=["users"])
logger = logging.getLogger(__name__)
VALID_ROLES = {"admin", "manager", "employee"}


def serialize_user(user: User) -> dict:
    return {"id": user.id, "email": user.email, "role": user.role.name, "is_active": user.is_active, "created_at": user.created_at, "last_login_at": user.last_login_at}


def get_role(db: Session, name: str) -> Role:
    if name not in VALID_ROLES:
        raise HTTPException(status_code=422, detail="Invalid role")
    role = db.scalar(select(Role).where(Role.name == name))
    if role is None:
        raise HTTPException(status_code=500, detail="Role configuration is unavailable")
    return role


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_roles("admin"))):
    email = normalize_email(str(payload.email))
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="A user with that email already exists")
    user = User(email=email, password_hash=hash_password(payload.password), role=get_role(db, payload.role), is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("user_created user_id=%s role=%s", user.id, user.role.name)
    return serialize_user(user)


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_roles("admin"))):
    return [serialize_user(user) for user in db.scalars(select(User).order_by(User.id)).all()]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_roles("admin"))):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_user(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(require_roles("admin"))):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    changes = payload.model_dump(exclude_unset=True)
    if "email" in changes:
        existing = db.scalar(select(User).where(User.email == normalize_email(str(changes["email"])), User.id != user_id))
        if existing:
            raise HTTPException(status_code=409, detail="A user with that email already exists")
        user.email = normalize_email(str(changes["email"]))
    if "password" in changes:
        user.password_hash = hash_password(changes["password"])
    if "role" in changes:
        new_role = get_role(db, changes["role"])
        active_admins = db.scalar(select(func.count(User.id)).join(Role).where(Role.name == "admin", User.is_active.is_(True)))
        if user.role.name == "admin" and new_role.name != "admin" and user.is_active and active_admins <= 1:
            raise HTTPException(status_code=400, detail="The last active admin cannot lose admin role")
        user.role = new_role
    if "is_active" in changes and not changes["is_active"] and user.is_active:
        active_admins = db.scalar(select(func.count(User.id)).join(Role).where(Role.name == "admin", User.is_active.is_(True)))
        if user.role.name == "admin" and active_admins <= 1:
            raise HTTPException(status_code=400, detail="The last active admin cannot be deactivated")
        user.is_active = False
    elif "is_active" in changes:
        user.is_active = changes["is_active"]
    db.commit()
    db.refresh(user)
    logger.info("user_updated user_id=%s admin_id=%s", user.id, admin.id)
    return serialize_user(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_roles("admin"))):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role.name == "admin" and user.is_active:
        active_admins = db.scalar(select(func.count(User.id)).join(Role).where(Role.name == "admin", User.is_active.is_(True)))
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="The last active admin cannot be deleted")
    user.is_active = False
    db.commit()