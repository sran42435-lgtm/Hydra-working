"""
Memory System Service - Phase 1
Entry point untuk layanan penyimpanan dan pengambilan short-term memory.
Menyediakan endpoint REST untuk menyimpan dan membaca riwayat percakapan.
"""

import uuid
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from shared.config.config_loader import ConfigLoader
from shared.db.connection_pool_manager import init_connection_pool
from shared.db.db_client import DatabaseClient
from shared.errors.error_handler import setup_error_handlers
from .config import HOST, PORT, DEBUG, DATABASE_URL, TABLE_DEFINITIONS, INDEXES, SHORT_TERM_LIMIT
from .storage.relational_store_adapter import RelationalStoreAdapter

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
init_connection_pool(DATABASE_URL)
db_client = DatabaseClient(TABLE_DEFINITIONS)
db_client.initialize()
# Buat indeks
with db_client:
    pass  # Indeks sudah dibuat di initialize()

store = RelationalStoreAdapter()

app = FastAPI(title="Hydra Memory System", version="1.0.0")
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class MemoryCreateRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    role: str = Field(..., pattern=r"^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=10000)


class MemoryResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    timestamp: str


class MemoryListResponse(BaseModel):
    memories: list[MemoryResponse]
    count: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "memory_system"}


@app.post("/v1/memory", response_model=MemoryResponse, status_code=201)
async def save_memory(request: MemoryCreateRequest):
    """Simpan pesan baru sebagai memory."""
    try:
        # Pastikan sesi ada
        store.create_session(request.session_id)
        result = store.save_message(
            session_id=request.session_id,
            role=request.role,
            content=request.content
        )
        return MemoryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan memory: {str(e)}")


@app.get("/v1/memory/short-term", response_model=MemoryListResponse)
async def get_short_term_memory(session_id: str, limit: int = 10):
    """Ambil riwayat percakapan terbaru untuk sesi tertentu."""
    try:
        if not store.session_exists(session_id):
            return MemoryListResponse(memories=[], count=0)
        messages = store.get_messages(session_id, limit=min(limit, SHORT_TERM_LIMIT))
        memories = [MemoryResponse(**msg) for msg in messages]
        return MemoryListResponse(memories=memories, count=len(memories))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengambil memory: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("memory_system.main:app", host=HOST, port=PORT, reload=DEBUG)
