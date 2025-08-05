#!/bin/bash

# Build script for all architectures

IMAGE_NAME="hafidh2001/cp-antrean-truck"

echo "Setting up Docker buildx..."

# Create and use a new builder instance
docker buildx create --name multiarch-builder --use 2>/dev/null || docker buildx use multiarch-builder

# Ensure the builder is bootstrapped
docker buildx inspect --bootstrap

echo "Building Docker images for all architectures..."

# Build for both platforms and push to registry
docker buildx build \
  --platform linux/amd64,linux/arm64 \
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