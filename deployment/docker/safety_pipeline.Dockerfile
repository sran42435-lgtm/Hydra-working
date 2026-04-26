# Phase 1 - Safety Pipeline Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared/ ./shared/

# Copy service code
COPY safety_pipeline/ ./safety_pipeline/

# Expose port
EXPOSE 8002

# Run service
CMD ["uvicorn", "safety_pipeline.main:app", "--host", "0.0.0.0", "--port", "8002"]
