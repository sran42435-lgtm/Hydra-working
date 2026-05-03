MEMORY_SYSTEM_DATABASE_URL=sqlite:///./data/memory.db uvicorn memory_system.main:app --host 0.0.0.0 --port 8006 &

uvicorn safety_pipeline.main:app --host 0.0.0.0 --port 8002 &

uvicorn model_service.main:app --host 0.0.0.0 --port 8004 &

uvicorn response_service.main:app --host 0.0.0.0 --port 8005 &

AI_SERVICE_MODEL_SERVICE_URL=http://localhost:8004 \
AI_SERVICE_SAFETY_PIPELINE_URL=http://localhost:8002 \
uvicorn ai_service.main:app --host 0.0.0.0 --port 8003 &

ORCHESTRATOR_SERVICE_AI_SERVICE_URL=http://localhost:8003 \
ORCHESTRATOR_SERVICE_MEMORY_SYSTEM_URL=http://localhost:8006 \
ORCHESTRATOR_SERVICE_RESPONSE_SERVICE_URL=http://localhost:8005 \
uvicorn orchestrator_service.main:app --host 0.0.0.0 --port 8001 &

API_GATEWAY_SAFETY_PIPELINE_URL=http://localhost:8002 \
API_GATEWAY_ORCHESTRATOR_URL=http://localhost:8001 \
uvicorn api_gateway.main:app --host 0.0.0.0 --port 8000 &

BFF_LAYER_API_GATEWAY_URL=http://localhost:8000 \
uvicorn bff_layer.main:app --host 0.0.0.0 --port 3000 &
