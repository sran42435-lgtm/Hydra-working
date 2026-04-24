"""
Orchestrator Service - Phase 1
Entry point untuk orkestrasi alur chat.
Menyediakan endpoint REST untuk menerima request dari API Gateway
dan mengembalikan respons yang sudah diproses melalui pipeline.
"""

import uuid
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from shared.errors.error_handler import setup_error_handlers
from .config import HOST, PORT, DEBUG
from .request_flow_controller import RequestFlowController

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
flow_controller = RequestFlowController()

app = FastAPI(title="Hydra Orchestrator Service", version="1.0.0")
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class OrchestratorRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1, max_length=10000)
    trace_id: str = Field(..., min_length=1)


class OrchestratorResponse(BaseModel):
    response_text: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "orchestrator"}


@app.post("/v1/orchestrator/chat", response_model=OrchestratorResponse)
async def process_chat(request: OrchestratorRequest):
    """
    Proses chat request dari API Gateway.
    
    Alur:
    1. Ambil memory dari Memory System.
    2. Kirim ke AI Service untuk generasi.
    3. Simpan memory baru.
    4. Format output via Response Service.
    """
    try:
        result = await flow_controller.process(
            session_id=request.session_id,
            message=request.message,
            trace_id=request.trace_id
        )
        return OrchestratorResponse(response_text=result["response_text"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestrator error: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("orchestrator_service.main:app", host=HOST, port=PORT, reload=DEBUG)
