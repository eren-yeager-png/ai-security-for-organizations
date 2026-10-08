"""Processed safe text -> chunks -> embeddings -> vector store.

Only called with text that already passed the Sprint 4 PII policy (the same
text stored in document_pages). Raw extracted text never reaches this module.
"""

import logging

from app.db.models import Document
from app.rag import vector_store
from app.rag.chunking import chunk_pages
from app.rag.embeddings import get_embedder

logger = logging.getLogger(__name__)

EMBED_BATCH_SIZE = 64


def _source_label(document: Document) -> str:
    return document.source_url or document.file_name or document.title


def index_document(document: Document, pages: list[tuple[int, str]]) -> int:
    """Replace the document's chunks in the vector store. Returns the chunk count."""
    embedder = get_embedder()
    chunks = chunk_pages(pages)
    texts = [chunk.text for chunk in chunks]
    embeddings: list[list[float]] = []
    for start in range(0, len(texts), EMBED_BATCH_SIZE):
        embeddings.extend(embedder.embed(texts[start:start + EMBED_BATCH_SIZE]))

    # Authorization + citation metadata travels with EVERY chunk.
    metadatas = [
        {
            "document_id": document.id,
            "classification": document.classification,
            "source_type": document.source_type,
            "source": _source_label(document),
            "title": document.title,
            "page_number": chunk.page_number if document.source_type == "file" else 0,
            "chunk_index": chunk.chunk_index,
        }
        for chunk in chunks
    ]
    vector_store.replace_document_chunks(
        embedder.name,
        document.id,
        [vector_store.chunk_id(document.id, chunk.chunk_index) for chunk in chunks],
        texts,
        embeddings,
        metadatas,
    )
    logger.info("document_indexed document_id=%s chunks=%s model=%s", document.id, len(chunks), embedder.name)
    return len(chunks)


def remove_document(document_id: int) -> None:
    vector_store.delete_document(get_embedder().name, document_id)


def sync_document_metadata(document: Document) -> None:
    vector_store.update_document_metadata(
        get_embedder().name,
        document.id,
        {"classification": document.classification, "title": document.title, "source": _source_label(document)},
    )
