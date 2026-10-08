
from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)

from app.processing.pii import PiiPolicy
from app.processing.url_fetcher import validate_url_syntax
from app.security import (
    normalize_email,
    validate_password,
)


# ============================================================
# AUTH SCHEMAS
# ============================================================

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


# ============================================================
# USER SCHEMAS
# ============================================================

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


# ============================================================
# DOCUMENT CLASSIFICATION
# ============================================================

class DocumentClassification(str, Enum):
    PUBLIC = "Public"
    INTERNAL = "Internal"
    CONFIDENTIAL = "Confidential"


# ============================================================
# DOCUMENT SCHEMAS
# ============================================================

class DocumentCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(default=None, max_length=2000)

    classification: DocumentClassification

    source_type: Literal["file", "url"]

    source_url: str | None = None

    file_name: str | None = Field(default=None, max_length=255)

    @field_validator("source_url")
    @classmethod
    def check_source_url(cls, value: str | None) -> str | None:
        return validate_url_syntax(value) if value else value


class DocumentURLCreate(BaseModel):
    url: str

    classification: DocumentClassification

    # Optional; defaults to PII_DEFAULT_POLICY (MASK) when omitted.
    pii_policy: PiiPolicy | None = None

    @field_validator("url")
    @classmethod
    def check_url(cls, value: str) -> str:
        # Rejects non-http(s) schemes, credentials, odd ports, localhost and
        # private/loopback IP literals (SSRF guard, part 1 of 2).
        return validate_url_syntax(value)


class DocumentUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: str | None = Field(default=None, max_length=2000)

    classification: DocumentClassification | None = None

    source_type: Literal["file", "url"] | None = None

    source_url: str | None = None

    file_name: str | None = Field(default=None, max_length=255)

    pii_policy: PiiPolicy | None = None

    @field_validator("source_url")
    @classmethod
    def check_source_url(cls, value: str | None) -> str | None:
        return validate_url_syntax(value) if value else value


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    title: str

    description: str | None

    classification: str

    source_type: str

    source_url: str | None

    file_name: str | None

    status: str

    pii_policy: str

    # Counts of detected sensitive entities by type (never the values).
    pii_summary: dict[str, int] | None = None

    processing_error: str | None = None

    processed_at: datetime | None = None

    chunk_count: int | None = None

    indexed_at: datetime | None = None

    created_by: int

    created_at: datetime

    updated_at: datetime


class DocumentPageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page_number: int

    content: str


class DocumentContentResponse(BaseModel):
    """Processed, policy-safe text of a document."""

    document_id: int

    title: str

    classification: str

    status: str

    pii_policy: str

    pii_summary: dict[str, int] | None

    pages: list[DocumentPageResponse]


# ============================================================
# DOCUMENT PERMISSIONS
# ============================================================

class DocumentPermission(str, Enum):
    READ = "read"


class PermissionCreate(BaseModel):
    document_id: int

    user_id: int

    permission: DocumentPermission = DocumentPermission.READ


class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    document_id: int

    user_id: int

    permission: DocumentPermission


# ============================================================
# SECURE RAG (Sprint 5)
# ============================================================

class RagQueryRequest(BaseModel):
    # Unknown fields (e.g. "role", "classification", "document_ids") are rejected:
    # access is decided only from the authenticated user on the server.
    model_config = ConfigDict(extra="forbid")

    query: str = Field(min_length=1, max_length=2000)

    top_k: int | None = Field(default=None, ge=1, le=20)

    @field_validator("query")
    @classmethod
    def strip_query(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Query must not be empty")
        return value


class RagSource(BaseModel):
    """A chunk that was actually given to the answer generator (never fabricated)."""

    document_id: int

    title: str

    classification: str

    source_type: str

    source_url: str | None

    file_name: str | None

    page_number: int | None

    chunk_index: int

    snippet: str

    similarity: float


class RagQueryResponse(BaseModel):
    answer: str

    # "llm" | "extractive" | "extractive_fallback" | "no_results"
    mode: str

    sources: list[RagSource]

    # Safe, user-facing notes (e.g. passages withheld as possible prompt injection).
    notices: list[str] = []


class RagReindexRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # Omit (or null) to re-index every completed document.
    document_ids: list[int] | None = Field(default=None, max_length=1000)


class RagReindexResponse(BaseModel):
    queued_documents: int
