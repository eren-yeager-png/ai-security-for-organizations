from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.security import normalize_email, validate_password


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: EmailStr) -> str:
        return normalize_email(str(value))


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "employee"

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: EmailStr) -> str:
        return normalize_email(str(value))

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        validate_password(value)
        return value


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    password: str | None = None
    role: str | None = None
    is_active: bool | None = None

    @field_validator("email")
    @classmethod
    def clean_email(cls, value: EmailStr | None) -> str | None:
        return normalize_email(str(value)) if value else None

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str | None) -> str | None:
        if value:
            validate_password(value)
        return value


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20)
    password: str

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        validate_password(value)
        return value