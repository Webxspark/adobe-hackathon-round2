    # Adobe India Hackathon 2025 - Finale Solution (Full-Stack)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies including Node.js
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    ffmpeg \
    espeak-ng \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend files and build
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci

# Copy frontend source and build for production
COPY client/ ./
RUN cp .env.production .env || echo "No production env file"
RUN npm run build

# Go back to app directory and copy backend files
WORKDIR /app
COPY . .

# Create necessary directories and pre-download model
RUN mkdir -p uploads static templates data .cache

# Pre-download the sentence-transformers model to avoid runtime download issues
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Move built frontend to static directory for serving
RUN cp -r client/dist/* static/ 2>/dev/null || echo "No dist directory found"

# Expose port 8080 as required by Adobe
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
