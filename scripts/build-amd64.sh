#!/bin/bash

# Build script for AMD64 architecture

IMAGE_NAME="hafidh2001/cp-antrean-truck"
TAG="amd64"

echo "Building Docker image for AMD64 architecture..."

# Build the image for AMD64
docker buildx build \
  --platform linux/amd64 \
  -t ${IMAGE_NAME}:${TAG} \
  -t ${IMAGE_NAME}:latest-amd64 \
  --load \
  .

if [ $? -eq 0 ]; then
  echo "✅ Successfully built ${IMAGE_NAME}:${TAG}"
  docker images | grep ${IMAGE_NAME}
else
  echo "❌ Failed to build Docker image"
  exit 1
fi