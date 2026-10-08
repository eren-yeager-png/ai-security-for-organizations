"""ChromaDB vector store for document chunks.

Every chunk is stored with the metadata needed to authorize and cite it:

    document_id, classification, source_type, source, title, page_number, chunk_index

Authorization at query time:
  * The caller passes the set of document IDs the user may read, computed
    from PostgreSQL by app.authorization (classification + honoured grants,
    status = completed). Chroma applies it as a `where` filter INSIDE the
    similarity search, so chunks of other documents are never even returned.
  * query() then re-checks every returned chunk against that set (defense in
    depth) before anything is handed to the caller.

We always pass our own embeddings, so Chroma never embeds text by itself.
"""

import logging
import re
import threading
from dataclasses import dataclass

import chromadb
from chromadb.config import Settings

from app.config import CHROMA_DIR

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_client = None


@dataclass(frozen=True)
class RetrievedChunk:
    chunk_id: str
    document_id: int
    classification: str
    page_number: int | None
    chunk_index: int
    text: str
    similarity: float


def _get_client():
    global _client
    with _lock:
        if _client is None:
            CHROMA_DIR.mkdir(parents=True, exist_ok=True)
            _client = chromadb.PersistentClient(path=str(CHROMA_DIR), settings=Settings(anonymized_telemetry=False))
        return _client


def _collection(model_name: str):
    # One collection per embedding model: vectors from different models are not comparable.
    name = "document_chunks__" + re.sub(r"[^a-zA-Z0-9_-]", "_", model_name).lower()
    return _get_client().get_or_create_collection(name=name, embedding_function=None, metadata={"hnsw:space": "cosine"})


def chunk_id(document_id: int, chunk_index: int) -> str:
    return f"doc{document_id}-chunk{chunk_index}"


def replace_document_chunks(model_name: str, document_id: int, ids: list[str], texts: list[str], embeddings: list[list[float]], metadatas: list[dict]) -> None:
    collection = _collection(model_name)
    collection.delete(where={"document_id": document_id})
    if ids:
        collection.add(ids=ids, documents=texts, embeddings=embeddings, metadatas=metadatas)


def delete_document(model_name: str, document_id: int) -> None:
    _collection(model_name).delete(where={"document_id": document_id})


def update_document_metadata(model_name: str, document_id: int, changes: dict) -> None:
    """Keep chunk metadata (e.g. classification, title) in sync with PostgreSQL."""
    collection = _collection(model_name)
    existing = collection.get(where={"document_id": document_id}, include=["metadatas"])
    if existing["ids"]:
        collection.update(ids=existing["ids"], metadatas=[{**metadata, **changes} for metadata in existing["metadatas"]])


def count_document_chunks(model_name: str, document_id: int) -> int:
    return len(_collection(model_name).get(where={"document_id": document_id}, include=[])["ids"])


def query(model_name: str, embedding: list[float], allowed_document_ids: set[int], top_k: int) -> list[RetrievedChunk]:
    if not allowed_document_ids:
        return []  # nothing the user may read: do not search at all
    result = _collection(model_name).query(
        query_embeddings=[embedding],
        n_results=top_k,
        where={"document_id": {"$in": sorted(allowed_document_ids)}},
        include=["documents", "metadatas", "distances"],
    )
    chunks: list[RetrievedChunk] = []
    for chunk_key, text, metadata, distance in zip(result["ids"][0], result["documents"][0], result["metadatas"][0], result["distances"][0]):
        document_id = int(metadata.get("document_id", -1))
        if document_id not in allowed_document_ids:
            # Should be impossible given the where-filter; never let it through.
            logger.error("vector_store_unauthorized_chunk_dropped chunk_id=%s", chunk_key)
            continue
        page = int(metadata.get("page_number", 0))
        chunks.append(RetrievedChunk(
            chunk_id=chunk_key,
            document_id=document_id,
            classification=str(metadata.get("classification", "")),
            page_number=page or None,
            chunk_index=int(metadata.get("chunk_index", 0)),
            text=text,
            similarity=round(1.0 - float(distance), 4),  # cosine distance -> similarity
        ))
    return chunks
