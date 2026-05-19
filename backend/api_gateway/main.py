"""
API Gateway Service - Phase 1
Entry point utama sistem. Menerima request dari client,
menjalankan rate limiting, autentikasi, dan routing.
"""

import time
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from shared.errors.error_handler import setup_error_handlers
from .config import HOST, PORT, DEBUG, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW
from .http_request_router import router as chat_router

# ---------------------------------------------------------------------------
# Rate Limiter Sederhana (in-memory)
# ---------------------------------------------------------------------------
rate_limit_store: dict[str, list[float]] = {}

def rate_limit_middleware(request: Request):
    """Middleware untuk rate limiting berbasis IP."""
    client_id = request.client.host if request.client else "unknown"
    now = time.time()
    requests = rate_limit_store.get(client_id, [])
    requests = [t for t in requests if t > now - RATE_LIMIT_WINDOW]
    if len(requests) >= RATE_LIMIT_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    requests.append(now)
    rate_limit_store[client_id] = requests

# ---------------------------------------------------------------------------
# App Initialization
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Hydra API Gateway",
    version="1.0.0",
    description="Phase 1 - Core Chat Gateway"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers
setup_error_handlers(app)

# Routes
app.include_router(chat_router)

# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "service": "api_gateway"}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_gateway.main:app", host=HOST, port=PORT, reload=DEBUG)
