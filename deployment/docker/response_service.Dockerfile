# Phase 1 - Response Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared/ ./shared/

# Copy service code
COPY response_service/ ./response_service/

# Expose port
EXPOSE 8005

# Run service
CMD ["uvicorn", "response_service.main:app", "--host", "0.0.0.0", "--port", "8005"]
