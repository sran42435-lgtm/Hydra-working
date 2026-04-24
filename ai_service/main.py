"""
AI Service - Phase 1
Entry point untuk layanan AI orchestration.
Menangani prompt construction, pemanggilan Model Service, safety output check,
dan response policy sebelum mengembalikan hasil ke Orchestrator.
"""

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
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
# Request / Response Models
# ---------------------------------------------------------------------------
class ContextMessage(BaseModel):
    role: str
    content: str


class GenerateRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1, max_length=10000)
    context: list[ContextMessage] = Field(default_factory=list)
    trace_id: str = Field(..., min_length=1)


class GenerateResponse(BaseModel):
    generated_text: str
    usage: dict


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai_service"}


@app.post("/v1/ai/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
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
        # Step 1: Build prompt
        prompt_result = prompt_engine.build_prompt(
            prompt=request.prompt,
            context=[msg.dict() for msg in request.context]
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
            
            # Step 3: Safety Output Check
            safety_resp = await client.post(
                f"{SAFETY_PIPELINE_URL}/v1/safety/output",
                json={
                    "content": generated_text,
                    "session_id": request.session_id,
                    "trace_id": request.trace_id
                }
            )
            if safety_resp.status_code == 200:
                safety_data = safety_resp.json()
                if not safety_data.get("safe", True):
                    # Konten diblokir, gunakan fallback
                    generated_text = response_policy.get_fallback_response()
                else:
                    generated_text = safety_data.get("filtered_content", generated_text)
            # Jika safety service tidak tersedia, tetap lanjutkan dengan generated_text apa adanya (degraded mode).

        # Step 4: Apply response policy
        policy_result = response_policy.validate(generated_text)
        final_text = policy_result["text"]

        return GenerateResponse(
            generated_text=final_text,
            usage=model_data.get("usage", {"input_tokens": 0, "output_tokens": 0})
        )

    except httpx.TimeoutException:
        # Model timeout -> fallback
        return GenerateResponse(
            generated_text=response_policy.get_fallback_response(),
            usage={"input_tokens": 0, "output_tokens": 0}
        )
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
