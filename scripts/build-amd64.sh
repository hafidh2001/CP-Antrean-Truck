#!/bin/bash

# Build script for AMD64 architecture

# Load environment variables from .env file
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

IMAGE_NAME="hafidh2001/cp-antrean-truck"
TAG="amd64"

echo "Building Docker image for AMD64 architecture..."

# Build the image for AMD64
docker buildx build \
  --platform linux/amd64 \
  --build-arg VITE_DECRYPT_SECRET_KEY="${VITE_DECRYPT_SECRET_KEY}" \
  -t ${IMAGE_NAME}:${TAG} \
  --load \
  ..

if [ $? -eq 0 ]; then
  echo "✅ Successfully built ${IMAGE_NAME}:${TAG}"
else
  echo "❌ Failed to build Docker image"
  exit 1
fi