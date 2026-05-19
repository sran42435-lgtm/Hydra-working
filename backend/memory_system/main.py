"""
Memory System Service - Phase 1
Entry point untuk layanan penyimpanan dan pengambilan short-term memory.
Menyediakan endpoint REST untuk menyimpan dan membaca riwayat percakapan.
"""

from fastapi import FastAPI, Request, HTTPException, Query
from shared.config.config_loader import ConfigLoader
from shared.db.connection_pool_manager import init_connection_pool
from shared.db.db_client import DatabaseClient
from shared.errors.error_handler import setup_error_handlers
from shared.schemas.message_schema import (
    create_message_from_request,
    build_message_list_response
)
from .config import (
    HOST, PORT, DEBUG, DATABASE_URL,
    TABLE_DEFINITIONS, INDEXES, SHORT_TERM_LIMIT
)
from .storage.relational_store_adapter import RelationalStoreAdapter

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
init_connection_pool(DATABASE_URL)
db_client = DatabaseClient(TABLE_DEFINITIONS)
db_client.initialize()

store = RelationalStoreAdapter()

app = FastAPI(title="Hydra Memory System", version="1.0.0")
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "memory_system"}


@app.post("/v1/memory", status_code=201)
async def save_memory(request: Request):
    """
    Simpan pesan baru sebagai memory.
    Request body: { "session_id": "...", "role": "user|assistant", "content": "..." }
    Response: dictionary pesan yang baru dibuat.
    """
    try:
        body = await request.json()
        # Validasi dan buat pesan
        message = create_message_from_request(body)
        # Pastikan sesi ada
        store.create_session(message["session_id"])
        # Simpan ke database
        saved = store.save_message(
            session_id=message["session_id"],
            role=message["role"],
            content=message["content"]
        )
        return saved
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan memory: {str(e)}")


@app.get("/v1/memory/short-term")
async def get_short_term_memory(
    session_id: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=SHORT_TERM_LIMIT)
):
    """
    Ambil riwayat percakapan terbaru untuk sesi tertentu.
    Query params: ?session_id=...&limit=...
    Response: { "memories": [...], "count": n }
    """
    try:
        if not store.session_exists(session_id):
            return build_message_list_response([])
        messages = store.get_messages(session_id, limit)
        return build_message_list_response(messages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengambil memory: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("memory_system.main:app", host=HOST, port=PORT, reload=DEBUG)
