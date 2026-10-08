"""Split processed (PII-safe) page text into overlapping chunks for embedding.

Chunks never cross a page boundary, so every chunk keeps an exact page number.
Text is split on the most natural boundary that fits: paragraphs, then lines,
then sentences, then words. Neighbouring chunks share CHUNK_OVERLAP_CHARS of
text so an answer that straddles a boundary is still retrievable.
"""

import re
from dataclasses import dataclass

from app.config import CHUNK_OVERLAP_CHARS, CHUNK_SIZE_CHARS

# Chunks shorter than this are merged into the previous chunk of the same page.
MIN_CHUNK_CHARS = 100
SEPARATORS = ["\n\n", "\n", ". ", " "]


@dataclass(frozen=True)
class Chunk:
    page_number: int
    chunk_index: int  # position within the whole document, 0-based
    text: str


def _split_to_pieces(text: str, size: int) -> list[str]:
    """Break text into pieces no longer than `size`, preferring natural boundaries."""
    if len(text) <= size:
        return [text]
    for separator in SEPARATORS:
        if separator in text:
            parts = text.split(separator)
            pieces = [part + (separator if i < len(parts) - 1 else "") for i, part in enumerate(parts)]
            result: list[str] = []
            for piece in pieces:
                result.extend(_split_to_pieces(piece, size) if len(piece) > size else [piece])
            return result
    # No separator at all (e.g. one giant token): hard cut.
    return [text[i:i + size] for i in range(0, len(text), size)]


def _overlap_tail(text: str, overlap: int) -> str:
    if overlap <= 0 or len(text) <= overlap:
        return ""
    tail = text[-overlap:]
    space = tail.find(" ")
    return tail[space + 1:] if 0 <= space < len(tail) - 1 else tail  # start on a word boundary


def chunk_page(text: str, size: int = CHUNK_SIZE_CHARS, overlap: int = CHUNK_OVERLAP_CHARS) -> list[str]:
    text = re.sub(r"[ \t]+", " ", text).strip()
    if not text:
        return []
    chunks: list[str] = []
    current = ""
    for piece in _split_to_pieces(text, size - overlap):
        if current and len(current) + len(piece) > size:
            chunks.append(current.strip())
            current = _overlap_tail(current, overlap)
        current += piece
    if current.strip():
        if chunks and len(current.strip()) < MIN_CHUNK_CHARS and len(chunks[-1]) + len(current) <= size * 1.25:
            chunks[-1] = (chunks[-1] + " " + current.strip()).strip()
        else:
            chunks.append(current.strip())
    return chunks


def chunk_pages(pages: list[tuple[int, str]]) -> list[Chunk]:
    """pages: (page_number, safe_text) pairs, e.g. from DocumentPage rows."""
    result: list[Chunk] = []
    for page_number, text in pages:
        for chunk_text in chunk_page(text):
            result.append(Chunk(page_number=page_number, chunk_index=len(result), text=chunk_text))
    return result
