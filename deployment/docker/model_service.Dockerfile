# Phase 1 - Model Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared/ ./shared/

# Copy service code
COPY model_service/ ./model_service/

# Expose port
EXPOSE 8004

# Run service
CMD ["uvicorn", "model_service.main:app", "--host", "0.0.0.0", "--port", "8004"]
