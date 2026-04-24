"""
Safety Pipeline Service - Phase 1
Entry point untuk layanan validasi keamanan input/output.
Menyediakan endpoint REST untuk memeriksa konten sebelum dan sesudah diproses AI.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from shared.config.config_loader import ConfigLoader
from shared.errors.error_handler import setup_error_handlers
from .config import HOST, PORT, DEBUG
from .input_guard import InputGuard
from .output_guard import OutputGuard

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
input_guard = InputGuard()
output_guard = OutputGuard()

app = FastAPI(title="Hydra Safety Pipeline", version="1.0.0")
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class SafetyCheckRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    session_id: str = Field(..., min_length=1)
    trace_id: str = Field(..., min_length=1)


class SafetyCheckResponse(BaseModel):
    safe: bool
    risk_score: float
    filtered_content: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "safety_pipeline"}


@app.post("/v1/safety/input", response_model=SafetyCheckResponse)
async def check_input(request: SafetyCheckRequest):
    """
    Periksa konten input dari user sebelum diteruskan ke AI.
    Dipanggil oleh API Gateway.
    """
    try:
        result = input_guard.check(request.content)
        return SafetyCheckResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Input safety check failed: {str(e)}")


@app.post("/v1/safety/output", response_model=SafetyCheckResponse)
async def check_output(request: SafetyCheckRequest):
    """
    Periksa konten output dari AI sebelum dikirim ke user.
    Dipanggil oleh AI Service.
    """
    try:
        result = output_guard.check(request.content)
        return SafetyCheckResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Output safety check failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("safety_pipeline.main:app", host=HOST, port=PORT, reload=DEBUG)
