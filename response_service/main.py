"""
Response Service - Phase 1
Entry point untuk layanan formatting response.
Menyediakan endpoint REST untuk memformat output AI sebelum dikirim ke user.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from shared.errors.error_handler import setup_error_handlers
from .config import HOST, PORT, DEBUG
from .response_stream_manager import ResponseStreamManager

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
formatter = ResponseStreamManager()

app = FastAPI(title="Hydra Response Service", version="1.0.0")
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------
class FormatRequest(BaseModel):
    raw_text: str = Field(..., min_length=1, max_length=10000)
    format: str = Field(default="json", pattern=r"^(json|markdown)$")


class FormattedContent(BaseModel):
    text: str
    markdown: str


class FormatResponse(BaseModel):
    formatted: FormattedContent


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "response_service"}


@app.post("/v1/response/format", response_model=FormatResponse)
async def format_response(request: FormatRequest):
    """Format teks mentah AI ke format yang diinginkan."""
    try:
        result = formatter.format_response(
            raw_text=request.raw_text,
            format_type=request.format
        )
        return FormatResponse(
            formatted=FormattedContent(**result["formatted"])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response formatting failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("response_service.main:app", host=HOST, port=PORT, reload=DEBUG)
