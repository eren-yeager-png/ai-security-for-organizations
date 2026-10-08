import logging
import re
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware

from app.audit import RequestContext, audit_event, request_context
from app.config import ENVIRONMENT, MAX_UPLOAD_BYTES, allowed_origins
from app.db.database import engine
from app.routers import audit_logs, auth, documents, permissions, rag, users

logger = logging.getLogger(__name__)

IS_PRODUCTION = ENVIRONMENT.lower() == "production"

# Interactive API docs are a reconnaissance aid: only expose them outside production.
app = FastAPI(
    title="Secure AI Assistant API",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(permissions.router)
app.include_router(rag.router)
app.include_router(audit_logs.router)

# Request bodies larger than this are refused before they are parsed or spooled to disk.
MAX_JSON_BODY_BYTES = 1024 * 1024
MAX_UPLOAD_BODY_BYTES = MAX_UPLOAD_BYTES + 1024 * 1024
REQUEST_ID_PATTERN = re.compile(r"[A-Za-z0-9-]{8,64}")
DOCS_PATHS = ("/docs", "/redoc", "/openapi.json")


def _security_headers(response, request: Request, request_id: str):
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if not request.url.path.startswith(DOCS_PATHS):
        # The API only returns JSON/files: nothing in a response may run as a page.
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if request.url.path.startswith("/api/"):
        # API responses may contain tokens or document content: never cache them.
        response.headers["Cache-Control"] = "no-store"
    return response


async def request_guard(request: Request, call_next):
    incoming = request.headers.get("x-request-id", "")
    request_id = incoming if REQUEST_ID_PATTERN.fullmatch(incoming) else uuid.uuid4().hex
    request_context.set(RequestContext(
        request_id=request_id,
        ip_address=request.client.host if request.client else None,
        user_agent=(request.headers.get("user-agent") or "")[:256] or None,
    ))

    content_length = request.headers.get("content-length")
    if content_length is not None:
        limit = MAX_UPLOAD_BODY_BYTES if request.url.path.endswith("/upload") else MAX_JSON_BODY_BYTES
        if not content_length.isdigit():
            return _security_headers(JSONResponse(status_code=400, content={"detail": "Invalid Content-Length"}), request, request_id)
        if int(content_length) > limit:
            return _security_headers(JSONResponse(status_code=413, content={"detail": "Request body too large"}), request, request_id)

    try:
        response = await call_next(request)
    except Exception:
        # Never leak tracebacks, SQL, paths or secrets: log server-side, return a generic error.
        logger.exception("unhandled_error request_id=%s path=%s", request_id, request.url.path)
        audit_event("SERVER_ERROR", result="FAILURE", resource_type="endpoint", resource_id=request.url.path[:64])
        response = JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": request_id})
    return _security_headers(response, request, request_id)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # FastAPI's default 422 echoes the submitted value ("input"), which can be a
    # password or personal data. Return only where and why validation failed.
    errors = [
        {"type": error.get("type"), "loc": list(error.get("loc", [])), "msg": error.get("msg")}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})


app.add_middleware(BaseHTTPMiddleware, dispatch=request_guard)

# Added last = outermost, so even error responses carry CORS headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    # Let the browser read the download filename / variant set by /download.
    expose_headers=["Content-Disposition", "X-Document-Variant", "X-Request-ID"],
)


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-health")
def database_health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"database": "connected"}
