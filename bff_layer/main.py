"""
BFF Layer Service - Phase 1
Backend-for-Frontend yang menjadi perantara antara Frontend dan API Gateway.
Menyediakan endpoint REST untuk chat dan health check.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from shared.errors.error_handler import setup_error_handlers
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
# Request / Response Models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: str = Field(default=None)


class ChatResponse(BaseModel):
    session_id: str
    response: str
    trace_id: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return await chat_service.health_check()


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Endpoint chat dari frontend."""
    try:
        result = await chat_service.send_message(
            message=request.message,
            session_id=request.session_id
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat request failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("bff_layer.main:app", host=HOST, port=PORT, reload=DEBUG)
