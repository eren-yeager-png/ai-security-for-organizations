from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.config import JWT_ALGORITHM, JWT_SECRET_KEY
from app.db.database import SessionLocal
from app.db.models import PasswordResetToken, Role, User
from app.main import app
from app.routers.auth import utc_now
from app.security import hash_password, hash_token


client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def auth_users():
    db = SessionLocal()
    roles = {role.name: role for role in db.scalars(select(Role)).all()}
    for email, password, role_name in (
        ("test-admin@example.com", "AdminPass1", "admin"),
        ("test-manager@example.com", "ManagerPass1", "manager"),
        ("test-employee@example.com", "EmployeePass1", "employee"),
    ):
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(email=email, password_hash=hash_password(password), role=roles[role_name], is_active=True)
            db.add(user)
        else:
            user.password_hash = hash_password(password)
            user.role = roles[role_name]
            user.is_active = True
    db.commit()
    db.close()


def login(email: str, password: str):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return response, {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_login_rejects_wrong_password_generically():
    response = client.post("/api/v1/auth/login", json={"email": "test-admin@example.com", "password": "WrongPass1"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}


def test_login_rejects_unknown_and_inactive_users():
    unknown = client.post("/api/v1/auth/login", json={"email": "unknown@example.com", "password": "ValidPass1"})
    assert unknown.status_code == 401
    db = SessionLocal()
    inactive = db.scalar(select(User).where(User.email == "test-employee@example.com"))
    inactive.is_active = False
    db.commit()
    db.close()
    try:
        response = client.post("/api/v1/auth/login", json={"email": "test-employee@example.com", "password": "EmployeePass1"})
        assert response.status_code == 401
    finally:
        db = SessionLocal()
        db.scalar(select(User).where(User.email == "test-employee@example.com")).is_active = True
        db.commit()
        db.close()


def test_anonymous_and_role_boundaries():
    assert client.get("/api/v1/auth/me").status_code == 401
    _, employee_headers = login("test-employee@example.com", "EmployeePass1")
    _, manager_headers = login("test-manager@example.com", "ManagerPass1")
    assert client.get("/api/v1/users", headers=employee_headers).status_code == 403
    assert client.get("/api/v1/users", headers=manager_headers).status_code == 403


def test_database_role_wins_over_claimed_role():
    employee = SessionLocal().scalar(select(User).where(User.email == "test-employee@example.com"))
    token = jwt.encode({"sub": str(employee.id), "role": "admin", "type": "access", "iat": datetime.now(timezone.utc), "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "jti": "forged"}, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    response = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_refresh_rotates_and_rejects_reuse():
    response, _ = login("test-admin@example.com", "AdminPass1")
    old_cookie = response.cookies.get("refresh_token")
    refreshed = client.post("/api/v1/auth/refresh", cookies={"refresh_token": old_cookie})
    assert refreshed.status_code == 200
    new_cookie = refreshed.cookies.get("refresh_token")
    assert new_cookie and new_cookie != old_cookie
    reused = client.post("/api/v1/auth/refresh", cookies={"refresh_token": old_cookie})
    assert reused.status_code == 401


def test_logout_revokes_refresh_token():
    response, _ = login("test-admin@example.com", "AdminPass1")
    refresh_cookie = response.cookies.get("refresh_token")
    assert client.post("/api/v1/auth/logout", cookies={"refresh_token": refresh_cookie}).status_code == 204
    assert client.post("/api/v1/auth/refresh", cookies={"refresh_token": refresh_cookie}).status_code == 401


def test_registration_endpoint_does_not_exist():
    assert client.post("/api/v1/auth/register", json={}).status_code == 404


def test_last_active_admin_cannot_lose_admin_role():
    db = SessionLocal()
    admin = db.scalar(select(User).where(User.email == "test-admin@example.com"))
    other_admins = db.scalars(select(User).join(Role).where(Role.name == "admin", User.id != admin.id, User.is_active.is_(True))).all()
    for other_admin in other_admins:
        other_admin.is_active = False
    db.commit()
    try:
        response = client.patch(f"/api/v1/users/{admin.id}", headers=login("test-admin@example.com", "AdminPass1")[1], json={"role": "employee"})
        assert response.status_code == 400
    finally:
        for other_admin in other_admins:
            other_admin.is_active = True
        db.commit()
        db.close()


def test_password_reset_token_is_single_use_and_expiry_is_enforced():
    try:
        requested = client.post("/api/v1/auth/forgot-password", json={"email": "test-employee@example.com"})
        assert requested.status_code == 200
        reset_token = requested.json()["reset_token"]
        reset = client.post("/api/v1/auth/reset-password", json={"token": reset_token, "password": "NewEmployee1"})
        assert reset.status_code == 200
        reused = client.post("/api/v1/auth/reset-password", json={"token": reset_token, "password": "EmployeePass1"})
        assert reused.status_code == 400

        db = SessionLocal()
        expired_raw = f"expired-reset-token-value-{utc_now().timestamp()}"
        user = db.scalar(select(User).where(User.email == "test-employee@example.com"))
        db.add(PasswordResetToken(token_hash=hash_token(expired_raw), user_id=user.id, expires_at=utc_now() - timedelta(minutes=1)))
        db.commit()
        db.close()
        expired = client.post("/api/v1/auth/reset-password", json={"token": expired_raw, "password": "EmployeePass1"})
        assert expired.status_code == 400
    finally:
        db = SessionLocal()
        db.scalar(select(User).where(User.email == "test-employee@example.com")).password_hash = hash_password("EmployeePass1")
        db.commit()
        db.close()


def test_login_rate_limit_returns_429_after_repeated_failures():
    for _ in range(5):
        response = client.post("/api/v1/auth/login", json={"email": "rate-limit@example.com", "password": "WrongPass1"})
        assert response.status_code == 401
    limited = client.post("/api/v1/auth/login", json={"email": "rate-limit@example.com", "password": "WrongPass1"})
    assert limited.status_code == 429