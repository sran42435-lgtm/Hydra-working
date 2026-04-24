"""
Model Service - Phase 1
Entry point untuk layanan inferensi LLM.
Menyediakan endpoint REST untuk generate text.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from shared.errors.error_handler import setup_error_handlers
from .config import HOST, PORT, DEBUG
from .llm_inference_executor import LLMInferenceExecutor

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
executor = LLMInferenceExecutor()

app = FastAPI(title="Hydra Model Service", version="1.0.0")
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    max_tokens: int = Field(default=1024, ge=1, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class UsageInfo(BaseModel):
    input_tokens: int
    output_tokens: int
    total_tokens: int


class GenerateResponse(BaseModel):
    text: str
    usage: UsageInfo


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "model_service"}


@app.post("/v1/model/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """Generate text menggunakan LLM."""
    try:
        result = await executor.generate(
            prompt=request.prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        return GenerateResponse(
            text=result["text"],
            usage=UsageInfo(**result["usage"])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("model_service.main:app", host=HOST, port=PORT, reload=DEBUG)
