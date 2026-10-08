"""Text -> vector embeddings.

Default model: all-MiniLM-L6-v2 (384 dimensions), run locally through ONNX
Runtime via ChromaDB's bundled embedding function. Runs on CPU, needs no API
key, and no document text leaves the server. The model (~80 MB) is downloaded
once to ~/.cache/chroma on first use.

To switch models, implement the Embedder protocol and return it from
get_embedder(). The model name becomes part of the vector collection name, so a
new model starts with a fresh index (re-index via POST /api/v1/rag/reindex).
"""

from functools import lru_cache
from typing import Protocol


class Embedder(Protocol):
    name: str

    def embed(self, texts: list[str]) -> list[list[float]]: ...


class MiniLMEmbedder:
    name = "all-MiniLM-L6-v2"

    def __init__(self) -> None:
        from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

        self._model = ONNXMiniLM_L6_V2()

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        return [[float(value) for value in vector] for vector in self._model(texts)]


@lru_cache(maxsize=1)
def get_embedder() -> Embedder:
    return MiniLMEmbedder()
