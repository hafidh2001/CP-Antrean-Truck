#!/bin/bash

# Build script for ARM64 architecture

IMAGE_NAME="hafidh2001/cp-antrean-truck"
TAG="arm64"

echo "Building Docker image for ARM64 architecture..."

# Build the image for ARM64
docker buildx build \
  --platform linux/arm64 \
  -t ${IMAGE_NAME}:${TAG} \
  --load \
  .

if [ $? -eq 0 ]; then
  echo "✅ Successfully built ${IMAGE_NAME}:${TAG}"
else
  echo "❌ Failed to build Docker image"
  exit 1
fi