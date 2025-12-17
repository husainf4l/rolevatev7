#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Build the Docker image for AMD64 Linux
echo "📦 Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t rolevatev7-backend:latest .

# Tag for GitHub Container Registry
echo "🏷️  Tagging image for GitHub Container Registry..."
docker tag rolevatev7-backend:latest ghcr.io/husainf4l/rolevatev7/rolevate-backend:latest

# Login to GitHub Container Registry (requires GITHUB_TOKEN)
echo "🔐 Logging in to GitHub Container Registry..."
echo "Please make sure GITHUB_TOKEN environment variable is set or run: docker login ghcr.io"

# Push to registry
echo "⬆️  Pushing image to ghcr.io..."
docker push ghcr.io/husainf4l/rolevatev7/rolevate-backend:latest

echo "✅ Deployment complete!"
echo "📝 Image pushed to: ghcr.io/husainf4l/rolevatev7/rolevate-backend:latest"
