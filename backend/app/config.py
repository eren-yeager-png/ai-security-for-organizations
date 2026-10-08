import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://app_user:app_password@localhost:5433/secure_data"
)


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-only-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
AUTH_COOKIE_NAME = "refresh_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Document processing (Sprint 4)
# Absolute path so the upload location does not depend on the current directory.
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(Path(__file__).resolve().parents[1] / "uploads"))).resolve()
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "20")) * 1024 * 1024
URL_FETCH_TIMEOUT_SECONDS = float(os.getenv("URL_FETCH_TIMEOUT_SECONDS", "10"))
URL_FETCH_MAX_BYTES = int(os.getenv("URL_FETCH_MAX_MB", "5")) * 1024 * 1024
PII_DEFAULT_POLICY = os.getenv("PII_DEFAULT_POLICY", "MASK").upper()

if ENVIRONMENT.lower() == "production" and (not JWT_SECRET_KEY or JWT_SECRET_KEY in {"development-only-change-me", "replace-with-a-long-random-production-secret"} or len(JWT_SECRET_KEY) < 32):
    raise RuntimeError("JWT_SECRET_KEY must be a random value of at least 32 characters in production")


def allowed_origins() -> list[str]:
    default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
    configured = os.getenv("CORS_ALLOWED_ORIGINS", ",".join(default_origins))
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    return list(dict.fromkeys(origins or default_origins))
# Secure RAG (Sprint 5)
CHROMA_DIR = Path(os.getenv("CHROMA_DIR", str(Path(__file__).resolve().parents[1] / "chroma_data"))).resolve()
# all-MiniLM-L6-v2 truncates input at 256 word-pieces (~1000 chars of English);
# 800-char chunks stay safely inside that so no chunk text is silently ignored.
CHUNK_SIZE_CHARS = int(os.getenv("CHUNK_SIZE_CHARS", "800"))
CHUNK_OVERLAP_CHARS = int(os.getenv("CHUNK_OVERLAP_CHARS", "120"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
RAG_MIN_SIMILARITY = float(os.getenv("RAG_MIN_SIMILARITY", "0.3"))
# LLM_PROVIDER: "none" -> extractive answers (no LLM call);
# "openai_compatible" -> any /v1/chat/completions API (OpenAI, Gemini's
# OpenAI-compatible endpoint, Ollama, LM Studio, vLLM ...).
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "none").lower()
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "").rstrip("/")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "")
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "60"))

# Abuse protection (Sprint 6): RAG questions per user per minute.
RAG_RATE_LIMIT_PER_MINUTE = int(os.getenv("RAG_RATE_LIMIT_PER_MINUTE", "30"))
