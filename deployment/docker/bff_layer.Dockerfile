# Phase 1 - BFF Layer Service Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared modules
COPY shared/ ./shared/

# Copy service code
COPY bff_layer/ ./bff_layer/

# Expose port
EXPOSE 3000

# Run service
CMD ["uvicorn", "bff_layer.main:app", "--host", "0.0.0.0", "--port", "3000"]
