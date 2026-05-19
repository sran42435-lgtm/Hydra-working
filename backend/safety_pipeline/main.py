"""
Safety Pipeline Service - Phase 1
Entry point untuk layanan validasi keamanan input/output.
Menyediakan endpoint REST untuk memeriksa konten sebelum dan sesudah diproses AI.
"""

from fastapi import FastAPI, Request, HTTPException
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
# Helper: Parse & Validate Safety Check Request Body
# ---------------------------------------------------------------------------
def _parse_safety_request(body: dict) -> dict:
    """Memvalidasi body request untuk safety check. Mengembalikan dict yang sudah bersih."""
    content = body.get("content")
    session_id = body.get("session_id")
    trace_id = body.get("trace_id")

    if not content or not isinstance(content, str):
        raise ValueError("content wajib diisi dan harus string")
    if len(content) > 10000:
        raise ValueError("content maksimal 10000 karakter")
    if not session_id or not isinstance(session_id, str):
        raise ValueError("session_id wajib diisi dan harus string")
    if not trace_id or not isinstance(trace_id, str):
        raise ValueError("trace_id wajib diisi dan harus string")

    return {
        "content": content,
        "session_id": session_id,
        "trace_id": trace_id
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "safety_pipeline"}


@app.post("/v1/safety/input")
async def check_input(request: Request):
    """
    Periksa konten input dari user sebelum diteruskan ke AI.
    Dipanggil oleh API Gateway.
    """
    try:
        body = await request.json()
        parsed = _parse_safety_request(body)
        result = input_guard.check(parsed["content"])
        return {
            "safe": result["safe"],
            "risk_score": result["risk_score"],
            "filtered_content": result["filtered_content"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Input safety check failed: {str(e)}")


@app.post("/v1/safety/output")
async def check_output(request: Request):
    """
    Periksa konten output dari AI sebelum dikirim ke user.
    Dipanggil oleh AI Service.
    """
    try:
        body = await request.json()
        parsed = _parse_safety_request(body)
        result = output_guard.check(parsed["content"])
        return {
            "safe": result["safe"],
            "risk_score": result["risk_score"],
            "filtered_content": result["filtered_content"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Output safety check failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("safety_pipeline.main:app", host=HOST, port=PORT, reload=DEBUG)
