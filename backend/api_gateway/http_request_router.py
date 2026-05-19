"""
HTTP Request Router - Phase 1
Menyediakan FastAPI router untuk endpoint chat di API Gateway.
Memisahkan routing logic dari main.py agar lebih terstruktur.
"""

import uuid
from fastapi import APIRouter, Request, Depends, HTTPException
import httpx
from .config import SAFETY_PIPELINE_URL, ORCHESTRATOR_URL, SESSION_HEADER
from .auth_validation_middleware import verify_token

router = APIRouter()


@router.post("/v1/chat")
async def chat(
    request: Request,
    _: bool = Depends(verify_token)
):
    """
    Main chat endpoint.
    
    Alur:
    1. Baca body request.
    2. Validasi message.
    3. Generate session_id jika belum ada.
    4. Cek input safety.
    5. Forward ke orchestrator.
    6. Kembalikan response.
    """
    # 1. Baca body request
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    message = body.get("message", "")
    if not message or len(message) > 10000:
        raise HTTPException(status_code=400, detail="Message cannot be empty or exceed 10000 characters")

    # 2. Session ID
    session_id = request.headers.get(SESSION_HEADER)
    if not session_id:
        session_id = str(uuid.uuid4())

    # 3. Trace ID
    trace_id = str(uuid.uuid4())

    # 4. Safety input check
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            safety_resp = await client.post(
                f"{SAFETY_PIPELINE_URL}/v1/safety/input",
                json={
                    "content": message,
                    "session_id": session_id,
                    "trace_id": trace_id
                }
            )
            if safety_resp.status_code == 400:
                detail = safety_resp.json().get("error", "Content blocked")
                raise HTTPException(status_code=400, detail=detail)
            safety_resp.raise_for_status()
            safety_data = safety_resp.json()
        except httpx.HTTPError:
            raise HTTPException(status_code=503, detail="Safety service unavailable")

        if not safety_data.get("safe"):
            raise HTTPException(status_code=400, detail="Content blocked by safety policy")

        filtered_message = safety_data.get("filtered_content", message)

        # 5. Forward to orchestrator
        try:
            orch_resp = await client.post(
                f"{ORCHESTRATOR_URL}/v1/orchestrator/chat",
                json={
                    "session_id": session_id,
                    "message": filtered_message,
                    "trace_id": trace_id
                },
                timeout=30.0
            )
            orch_resp.raise_for_status()
            orch_data = orch_resp.json()
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Orchestrator timeout")
        except httpx.HTTPError:
            raise HTTPException(status_code=503, detail="Orchestrator service unavailable")

    return {
        "session_id": session_id,
        "response": orch_data.get("response_text", ""),
        "trace_id": trace_id
    }
