"""
Model Service - Phase 1
Entry point untuk layanan inferensi LLM.
Menyediakan endpoint REST untuk generate text.
"""

from fastapi import FastAPI, Request, HTTPException
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
# Helper: Parse & Validate Generate Request Body
# ---------------------------------------------------------------------------
def _parse_generate_request(body: dict) -> dict:
    """Memvalidasi body request untuk generate. Mengembalikan dict yang sudah bersih."""
    prompt = body.get("prompt")
    max_tokens = body.get("max_tokens", 1024)
    temperature = body.get("temperature", 0.7)

    if not prompt or not isinstance(prompt, str):
        raise ValueError("prompt wajib diisi dan harus string")
    if len(prompt) > 10000:
        raise ValueError("prompt maksimal 10000 karakter")

    if not isinstance(max_tokens, (int, float)) or max_tokens < 1:
        raise ValueError("max_tokens harus integer >= 1")
    max_tokens = int(max_tokens)
    if max_tokens > 4096:
        raise ValueError("max_tokens maksimal 4096")

    if not isinstance(temperature, (int, float)) or temperature < 0.0 or temperature > 2.0:
        raise ValueError("temperature harus antara 0.0 dan 2.0")
    temperature = float(temperature)

    return {
        "prompt": prompt,
        "max_tokens": max_tokens,
        "temperature": temperature
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "model_service"}


@app.post("/v1/model/generate")
async def generate(request: Request):
    """
    Generate text menggunakan LLM.
    Request body: {"prompt": "...", "max_tokens": 1024, "temperature": 0.7}
    Response: {"text": "...", "usage": {...}}
    """
    try:
        body = await request.json()
        parsed = _parse_generate_request(body)

        result = await executor.generate(
            prompt=parsed["prompt"],
            max_tokens=parsed["max_tokens"],
            temperature=parsed["temperature"]
        )
        return {
            "text": result["text"],
            "usage": {
                "input_tokens": result["usage"]["input_tokens"],
                "output_tokens": result["usage"]["output_tokens"],
                "total_tokens": result["usage"]["total_tokens"]
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("model_service.main:app", host=HOST, port=PORT, reload=DEBUG)
