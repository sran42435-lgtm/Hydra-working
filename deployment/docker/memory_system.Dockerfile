# Phase 1 - Memory System Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared/ ./shared/

# Copy service code
COPY memory_system/ ./memory_system/

# Expose port
EXPOSE 8006

# Run service
CMD ["uvicorn", "memory_system.main:app", "--host", "0.0.0.0", "--port", "8006"]
