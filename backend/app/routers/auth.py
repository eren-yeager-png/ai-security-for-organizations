import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import AUTH_COOKIE_NAME, COOKIE_SAMESITE, COOKIE_SECURE, ENVIRONMENT, REFRESH_TOKEN_EXPIRE_DAYS
from app.db.database import get_db
from app.db.models import PasswordResetToken, RefreshToken, Role, User
from app.deps import get_current_user
from app.schemas import ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, TokenResponse, UserResponse
from app.security import create_access_token, generate_refresh_token, hash_password, hash_token, normalize_email, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(AUTH_COOKIE_NAME, token, httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE, max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400, path="/api/v1/auth")


def issue_refresh_token(db: Session, user: User, response: Response) -> None:
    raw_token = generate_refresh_token()
    db.add(RefreshToken(token_hash=hash_token(raw_token), user_id=user.id, expires_at=utc_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)))
    set_refresh_cookie(response, raw_token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))))
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        logger.warning("authentication_failed")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    user.last_login_at = utc_now()
    issue_refresh_token(db, user, response)
    db.commit()
    logger.info("authentication_succeeded user_id=%s", user.id)
    return TokenResponse(access_token=create_access_token(user.id, user.role.name))


@router.post("/refresh", response_model=TokenResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(AUTH_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_token)))
    now = utc_now()
    if stored is None or stored.revoked_at is not None or stored.expires_at <= now:
        if stored and stored.revoked_at is not None:
            db.query(RefreshToken).filter(RefreshToken.user_id == stored.user_id, RefreshToken.revoked_at.is_(None)).update({RefreshToken.revoked_at: now})
            db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user = db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    stored.revoked_at = now
    new_raw = generate_refresh_token()
    replacement = RefreshToken(token_hash=hash_token(new_raw), user_id=user.id, expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    db.add(replacement)
    db.flush()
    stored.replaced_by_id = replacement.id
    set_refresh_cookie(response, new_raw)
    db.commit()
    logger.info("token_refreshed user_id=%s", user.id)
    return TokenResponse(access_token=create_access_token(user.id, user.role.name))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_token = request.cookies.get(AUTH_COOKIE_NAME)
    if raw_token:
        stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_token)))
        if stored and stored.revoked_at is None:
            stored.revoked_at = utc_now()
            db.commit()
    response.delete_cookie(AUTH_COOKIE_NAME, path="/api/v1/auth")
    logger.info("logout")


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "role": user.role.name, "is_active": user.is_active, "created_at": user.created_at, "last_login_at": user.last_login_at}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    response = {"detail": "If the account exists, reset instructions have been sent"}
    user = db.scalar(select(User).where(User.email == normalize_email(str(payload.email))))
    if user:
        raw_token = secrets.token_urlsafe(32)
        db.add(PasswordResetToken(token_hash=hash_token(raw_token), user_id=user.id, expires_at=utc_now() + timedelta(hours=1)))
        db.commit()
        logger.info("password_reset_requested user_id=%s reset_token_available_in_development_log=false", user.id)
        if ENVIRONMENT == "development":
            response["reset_token"] = raw_token
    return response


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_token(payload.token)))
    if token is None or token.used_at is not None or token.expires_at <= utc_now():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
    user = db.get(User, token.user_id)
    user.password_hash = hash_password(payload.password)
    token.used_at = utc_now()
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)).update({RefreshToken.revoked_at: utc_now()})
    db.commit()
    return {"detail": "Password reset successfully"}