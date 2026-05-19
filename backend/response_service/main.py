"""
Response Service - Phase 1
Entry point untuk layanan formatting response.
Menyediakan endpoint REST untuk memformat output AI sebelum dikirim ke user.
"""

from fastapi import FastAPI, Request, HTTPException
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
# Helper: Parse & Validate Format Request Body
# ---------------------------------------------------------------------------
def _parse_format_request(body: dict) -> dict:
    """Memvalidasi body request untuk format response. Mengembalikan dict yang sudah bersih."""
    raw_text = body.get("raw_text")
    fmt = body.get("format", "json")

    if not raw_text or not isinstance(raw_text, str):
        raise ValueError("raw_text wajib diisi dan harus string")
    if len(raw_text) > 10000:
        raise ValueError("raw_text maksimal 10000 karakter")

    if fmt not in ("json", "markdown"):
        raise ValueError("format harus 'json' atau 'markdown'")

    return {
        "raw_text": raw_text,
        "format": fmt
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "response_service"}


@app.post("/v1/response/format")
async def format_response(request: Request):
    """
    Format teks mentah AI ke format yang diinginkan.
    Request body: {"raw_text": "...", "format": "json|markdown"}
    Response: {"formatted": {"text": "...", "markdown": "..."}}
    """
    try:
        body = await request.json()
        parsed = _parse_format_request(body)

        result = formatter.format_response(
            raw_text=parsed["raw_text"],
            format_type=parsed["format"]
        )
        return {
            "formatted": {
                "text": result["formatted"]["text"],
                "markdown": result["formatted"]["markdown"]
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Response formatting failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("response_service.main:app", host=HOST, port=PORT, reload=DEBUG)
