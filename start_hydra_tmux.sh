#!/data/data/com.termux/files/usr/bin/bash

SESSION="hydra"

# Kill session lama kalau ada
tmux kill-session -t $SESSION 2>/dev/null

# Buat session baru
tmux new-session -d -s $SESSION

# Panel 1 - Memory System
tmux send-keys -t $SESSION "cd ~/Hydra-working && source venv/bin/activate && MEMORY_SYSTEM_DATABASE_URL=sqlite:///./data/memory.db uvicorn memory_system.main:app --host 0.0.0.0 --port 8006" C-m

# Split vertical
tmux split-window -h -t $SESSION

# Panel 2 - Safety
tmux send-keys -t $SESSION "cd ~/Hydra-working && source venv/bin/activate && uvicorn safety_pipeline.main:app --host 0.0.0.0 --port 8002" C-m

# Split horizontal
tmux split-window -v -t $SESSION

# Panel 3 - Model
tmux send-keys -t $SESSION "cd ~/Hydra-working && source venv/bin/activate && uvicorn model_service.main:app --host 0.0.0.0 --port 8004" C-m

# Panel 4 - Response
tmux select-pane -t 0
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/Hydra-working && source venv/bin/activate && uvicorn response_service.main:app --host 0.0.0.0 --port 8005" C-m

# Panel 5 - AI
tmux select-pane -t 1
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/Hydra-working && source venv/bin/activate && AI_SERVICE_MODEL_SERVICE_URL=http://localhost:8004 AI_SERVICE_SAFETY_PIPELINE_URL=http://localhost:8002 uvicorn ai_service.main:app --host 0.0.0.0 --port 8003" C-m

# Panel 6 - Orchestrator
tmux select-pane -t 2
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/Hydra-working && source venv/bin/activate && ORCHESTRATOR_SERVICE_AI_SERVICE_URL=http://localhost:8003 ORCHESTRATOR_SERVICE_MEMORY_SYSTEM_URL=http://localhost:8006 ORCHESTRATOR_SERVICE_RESPONSE_SERVICE_URL=http://localhost:8005 uvicorn orchestrator_service.main:app --host 0.0.0.0 --port 8001" C-m

# Panel 7 - API Gateway
tmux select-pane -t 3
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/Hydra-working && source venv/bin/activate && API_GATEWAY_SAFETY_PIPELINE_URL=http://localhost:8002 API_GATEWAY_ORCHESTRATOR_URL=http://localhost:8001 uvicorn api_gateway.main:app --host 0.0.0.0 --port 8000" C-m

# Panel 8 - BFF
tmux select-pane -t 4
tmux split-window -v -t $SESSION
tmux send-keys -t $SESSION "cd ~/Hydra-working && source venv/bin/activate && BFF_LAYER_API_GATEWAY_URL=http://localhost:8000 uvicorn bff_layer.main:app --host 0.0.0.0 --port 3000" C-m

# Attach ke session
tmux attach -t $SESSION
