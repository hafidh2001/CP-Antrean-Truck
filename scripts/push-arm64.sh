#!/bin/bash

# Push script for ARM64 architecture to Docker Hub

IMAGE_NAME="hafidh2001/cp-antrean-truck"
TAG="arm64"

echo "Pushing Docker image for ARM64 architecture to Docker Hub..."

# Make sure we're logged in to Docker Hub
if ! docker info | grep -q "Username"; then
  echo "Please login to Docker Hub first:"
  docker login
fi

# Push the ARM64 images
echo "Pushing ${IMAGE_NAME}:${TAG}..."
docker push ${IMAGE_NAME}:${TAG}

echo "Pushing ${IMAGE_NAME}:latest-arm64..."
docker push ${IMAGE_NAME}:latest-arm64

if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed ARM64 images to Docker Hub"
  echo "Images pushed:"
  echo "  - ${IMAGE_NAME}:${TAG}"
  echo "  - ${IMAGE_NAME}:latest-arm64"
else
  echo "❌ Failed to push Docker images"
  exit 1
fi