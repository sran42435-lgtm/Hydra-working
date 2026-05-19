"""
BFF Layer Service - Phase 1
Backend-for-Frontend yang menjadi perantara antara Frontend dan API Gateway.
Menyediakan endpoint REST untuk chat dan health check.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from shared.errors.error_handler import setup_error_handlers
from shared.schemas.chat_schema import parse_chat_request, build_chat_response
from .config import HOST, PORT, DEBUG
from .chat_aggregation_service import ChatAggregationService

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
chat_service = ChatAggregationService()

app = FastAPI(title="Hydra BFF Layer", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return await chat_service.health_check()


@app.post("/api/chat")
async def chat(request: Request):
    """
    Endpoint chat dari frontend.
    Menerima { "message": "...", "session_id": "..." (opsional) }
    """
    try:
        body = await request.json()
        parsed = parse_chat_request(body)

        result = await chat_service.send_message(
            message=parsed["message"],
            session_id=parsed.get("session_id")
        )
        return build_chat_response(
            session_id=result["session_id"],
            response_text=result["response"],
            trace_id=result["trace_id"]
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat request failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("bff_layer.main:app", host=HOST, port=PORT, reload=DEBUG)
