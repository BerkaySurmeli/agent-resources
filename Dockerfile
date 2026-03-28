FROM python:3.11-slim

WORKDIR /app

# Install dependencies (from api/ subdirectory)
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application (from api/ subdirectory)
COPY api/ .

# Expose port
EXPOSE 8000

# Run application (use $PORT from Railway, default to 8000)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
