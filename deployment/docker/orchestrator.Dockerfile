# Phase 1 - Orchestrator Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared/ ./shared/

# Copy service code
COPY orchestrator_service/ ./orchestrator_service/

# Expose port
EXPOSE 8001

# Run service
CMD ["uvicorn", "orchestrator_service.main:app", "--host", "0.0.0.0", "--port", "8001"]
