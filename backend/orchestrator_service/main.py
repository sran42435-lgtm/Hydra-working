"""
Orchestrator Service - Phase 1
Entry point untuk orkestrasi alur chat.
Menyediakan endpoint REST untuk menerima request dari API Gateway
dan mengembalikan respons yang sudah diproses melalui pipeline.
"""

from fastapi import FastAPI, HTTPException, Request
from shared.errors.error_handler import setup_error_handlers
from shared.schemas.chat_schema import parse_orchestrator_request, build_orchestrator_response
from .config import HOST, PORT, DEBUG
from .request_flow_controller import RequestFlowController

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
flow_controller = RequestFlowController()

app = FastAPI(title="Hydra Orchestrator Service", version="1.0.0")
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "orchestrator"}


@app.post("/v1/orchestrator/chat")
async def process_chat(request: Request):
    """
    Proses chat request dari API Gateway.
    
    Alur:
    1. Ambil memory dari Memory System.
    2. Kirim ke AI Service untuk generasi.
    3. Simpan memory baru.
    4. Format output via Response Service.
    """
    try:
        body = await request.json()
        parsed = parse_orchestrator_request(body)

        result = await flow_controller.process(
            session_id=parsed["session_id"],
            message=parsed["message"],
            trace_id=parsed["trace_id"]
        )
        return build_orchestrator_response(result["response_text"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestrator error: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("orchestrator_service.main:app", host=HOST, port=PORT, reload=DEBUG)
