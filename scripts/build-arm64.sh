#!/bin/bash

# Build script for ARM64 architecture

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
TAG="arm64"

echo "Building Docker image for ARM64 architecture..."
echo "Using VITE_DECRYPT_SECRET_KEY: ${VITE_DECRYPT_SECRET_KEY:0:4}****" # Show first 4 chars for verification

# Build the image for ARM64
docker buildx build \
  --platform linux/arm64 \
  --build-arg VITE_DECRYPT_SECRET_KEY="${VITE_DECRYPT_SECRET_KEY}" \
  -t ${IMAGE_NAME}:${TAG} \
  --load \
  .

if [ $? -eq 0 ]; then
  echo "✅ Successfully built ${IMAGE_NAME}:${TAG}"
else
  echo "❌ Failed to build Docker image"
  exit 1
fi