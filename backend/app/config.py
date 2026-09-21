import os

from dotenv import load_dotenv

load_dotenv()


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-only-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
AUTH_COOKIE_NAME = "refresh_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT.lower() == "production" and (not JWT_SECRET_KEY or JWT_SECRET_KEY in {"development-only-change-me", "replace-with-a-long-random-production-secret"} or len(JWT_SECRET_KEY) < 32):
    raise RuntimeError("JWT_SECRET_KEY must be a random value of at least 32 characters in production")


def allowed_origins() -> list[str]:
    return [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", FRONTEND_URL).split(",") if origin.strip()]