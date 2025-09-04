#!/bin/bash

# Build script for all architectures

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root directory
cd "$PROJECT_ROOT"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

IMAGE_NAME="hafidh2001/cp-antrean-truck"

echo "Setting up Docker buildx..."

# Create and use a new builder instance
docker buildx create --name multiarch-builder --use 2>/dev/null || docker buildx use multiarch-builder

# Ensure the builder is bootstrapped
docker buildx inspect --bootstrap

echo "Building Docker images for all architectures..."
echo "Using VITE_DECRYPT_SECRET_KEY: ${VITE_DECRYPT_SECRET_KEY:0:4}****" # Show first 4 chars for verification
echo "Using VITE_API_URL: ${VITE_API_URL}"
echo "Using VITE_API_TOKEN: ${VITE_API_TOKEN:0:4}****" # Show first 4 chars for verification

# Build for both platforms and push to registry
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --build-arg VITE_DECRYPT_SECRET_KEY="${VITE_DECRYPT_SECRET_KEY}" \
  --build-arg VITE_API_URL="${VITE_API_URL}" \
  --build-arg VITE_API_TOKEN="${VITE_API_TOKEN}" \
  -t ${IMAGE_NAME}:latest \
  -t ${IMAGE_NAME}:amd64 \
  -t ${IMAGE_NAME}:arm64 \
  --push \
  .

if [ $? -eq 0 ]; then
  echo "✅ Successfully built and pushed multi-architecture images"
  echo "Images pushed:"
  echo "  - ${IMAGE_NAME}:latest (multi-arch)"
  echo "  - ${IMAGE_NAME}:amd64"
  echo "  - ${IMAGE_NAME}:arm64"
else
  echo "❌ Failed to build Docker images"
  exit 1
fi