# Use Python 3.12 slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    portaudio19-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml first for dependency installation
COPY pyproject.toml ./

# Install uv for faster package installation
RUN pip install --no-cache-dir uv

# Install Python dependencies using uv
RUN uv pip install --system -r pyproject.toml

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV LIVEKIT_MEMORY_WARN_MB=2048
ENV LIVEKIT_MEMORY_LIMIT_MB=0

# Expose port (if needed)
EXPOSE 8080

# Run the agent
CMD ["python", "agent.py", "dev"]
