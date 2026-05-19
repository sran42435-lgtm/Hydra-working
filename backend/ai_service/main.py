"""
AI Service - Phase 1
Entry point untuk layanan AI orchestration.
Menangani prompt construction, pemanggilan Model Service, safety output check,
dan response policy sebelum mengembalikan hasil ke Orchestrator.
"""

import httpx
from fastapi import FastAPI, HTTPException, Request
from shared.errors.error_handler import setup_error_handlers
from .config import HOST, PORT, DEBUG, MODEL_SERVICE_URL, SAFETY_PIPELINE_URL
from .prompt_construction_engine import PromptConstructionEngine
from .response_policy_engine import ResponsePolicyEngine

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
prompt_engine = PromptConstructionEngine()
response_policy = ResponsePolicyEngine()

app = FastAPI(title="Hydra AI Service", version="1.0.0")
setup_error_handlers(app)


# ---------------------------------------------------------------------------
# Helper: Parse & Validate Generate Request Body
# ---------------------------------------------------------------------------
def _parse_generate_request(body: dict) -> dict:
    """Memvalidasi body request untuk generate. Mengembalikan dict yang sudah bersih."""
    session_id = body.get("session_id")
    prompt = body.get("prompt")
    trace_id = body.get("trace_id")
    context = body.get("context", [])

    if not session_id or not isinstance(session_id, str):
        raise ValueError("session_id wajib diisi dan harus string")
    if not prompt or not isinstance(prompt, str):
        raise ValueError("prompt wajib diisi dan harus string")
    if len(prompt) > 10000:
        raise ValueError("prompt maksimal 10000 karakter")
    if not trace_id or not isinstance(trace_id, str):
        raise ValueError("trace_id wajib diisi dan harus string")
    if not isinstance(context, list):
        raise ValueError("context harus berupa list")

    # Validasi setiap item dalam context
    validated_context = []
    for item in context:
        role = item.get("role")
        content = item.get("content")
        if role not in ("user", "assistant"):
            raise ValueError(f"role context harus 'user' atau 'assistant', bukan '{role}'")
        if not content or not isinstance(content, str):
            raise ValueError("content context tidak boleh kosong")
        validated_context.append({"role": role, "content": content})

    return {
        "session_id": session_id,
        "prompt": prompt,
        "trace_id": trace_id,
        "context": validated_context
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai_service"}


@app.post("/v1/ai/generate")
async def generate(request: Request):
    """
    Menghasilkan respons AI berdasarkan prompt dan konteks.
    
    Alur:
    1. Bangun prompt lengkap dari prompt + context.
    2. Kirim ke Model Service untuk inferensi.
    3. Validasi output dengan Safety Pipeline.
    4. Terapkan response policy.
    5. Kembalikan hasil.
    """
    try:
        body = await request.json()
        parsed = _parse_generate_request(body)

        # Step 1: Build prompt
        prompt_result = prompt_engine.build_prompt(
            prompt=parsed["prompt"],
            context=parsed["context"]
        )

        # Step 2: Call Model Service
        async with httpx.AsyncClient(timeout=30.0) as client:
            model_resp = await client.post(
                f"{MODEL_SERVICE_URL}/v1/model/generate",
                json={
                    "prompt": prompt_result["full_prompt"],
                    "max_tokens": 1024,
                    "temperature": 0.7
                }
            )
            if model_resp.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Model service error: {model_resp.status_code}"
                )
            model_data = model_resp.json()
            generated_text = model_data.get("text", "")
            usage = model_data.get("usage", {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0})
            
            # Step 3: Safety Output Check
            try:
                safety_resp = await client.post(
                    f"{SAFETY_PIPELINE_URL}/v1/safety/output",
                    json={
                        "content": generated_text,
                        "session_id": parsed["session_id"],
                        "trace_id": parsed["trace_id"]
                    }
                )
                if safety_resp.status_code == 200:
                    safety_data = safety_resp.json()
                    if not safety_data.get("safe", True):
                        generated_text = response_policy.get_fallback_response()
                    else:
                        generated_text = safety_data.get("filtered_content", generated_text)
            except Exception:
                # Jika safety service tidak tersedia, lanjutkan dengan generated_text apa adanya (degraded mode)
                pass

        # Step 4: Apply response policy
        policy_result = response_policy.validate(generated_text)
        final_text = policy_result["text"]

        return {
            "generated_text": final_text,
            "usage": usage
        }

    except httpx.TimeoutException:
        return {
            "generated_text": response_policy.get_fallback_response(),
            "usage": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai_service.main:app", host=HOST, port=PORT, reload=DEBUG)
