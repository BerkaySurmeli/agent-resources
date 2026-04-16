FROM python:3.11-slim

WORKDIR /app

# Cache bust - forces fresh build
ARG CACHE_BUST=2026-04-16-1147

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application - this layer should not be cached when code changes
COPY . .

# Debug: Show what was copied
RUN echo "=== Build Time: 2026-04-15-1645 ===" && ls -la core/ && cat core/config.py | grep "SECRET_KEY first 20"

# Force rebuild timestamp - updated to force fresh build
ENV BUILD_TIMESTAMP=2026-04-16-1145

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
