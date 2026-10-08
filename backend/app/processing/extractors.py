"""Text extraction for uploaded files (PDF, CSV)."""

import io
import logging
from dataclasses import dataclass

from pypdf import PdfReader
from pypdf.errors import PdfReadError

logger = logging.getLogger(__name__)

# Upper bound on pages we will parse, to keep a hostile PDF from tying up the worker.
MAX_PDF_PAGES = 2000


class ExtractionError(Exception):
    """Raised with a short, user-safe message when a document cannot be processed."""


@dataclass(frozen=True)
class PageText:
    page_number: int  # 1-based; for single-source documents this is always 1
    text: str


def _clean(text: str) -> str:
    # Drop NUL bytes (PostgreSQL TEXT rejects them) and trim trailing whitespace per line.
    lines = (line.rstrip() for line in text.replace("\x00", "").splitlines())
    return "\n".join(lines).strip()


def extract_pdf(data: bytes) -> list[PageText]:
    if not data.startswith(b"%PDF-"):
        raise ExtractionError("File is not a valid PDF")
    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise ExtractionError("Encrypted PDFs are not supported")
        if len(reader.pages) > MAX_PDF_PAGES:
            raise ExtractionError(f"PDF has more than {MAX_PDF_PAGES} pages")
        pages: list[PageText] = []
        for index, page in enumerate(reader.pages, start=1):
            text = _clean(page.extract_text() or "")
            if text:
                pages.append(PageText(index, text))
    except ExtractionError:
        raise
    except (PdfReadError, ValueError, KeyError, TypeError, AttributeError, RecursionError) as exc:
        logger.warning("pdf_extraction_failed error=%s", type(exc).__name__)
        raise ExtractionError("PDF could not be parsed (corrupt or unsupported file)") from exc
    if not pages:
        raise ExtractionError("No extractable text found; the PDF may be empty, scanned, or image-only (OCR is not supported)")
    return pages


def decode_text(data: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("latin-1")


def extract_csv(data: bytes) -> list[PageText]:
    text = _clean(decode_text(data))
    if not text:
        raise ExtractionError("CSV file is empty")
    return [PageText(1, text)]
