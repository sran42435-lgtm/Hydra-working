# Phase 1 - AI Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared/ ./shared/

# Copy service code
COPY ai_service/ ./ai_service/

# Expose port
EXPOSE 8003

# Run service
CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8003"]
