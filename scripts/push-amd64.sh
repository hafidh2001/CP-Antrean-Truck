#!/bin/bash

# Push script for AMD64 architecture to Docker Hub

IMAGE_NAME="hafidh2001/cp-antrean-truck"
TAG="amd64"

echo "Pushing Docker image for AMD64 architecture to Docker Hub..."

# Make sure we're logged in to Docker Hub
if ! docker info | grep -q "Username"; then
  echo "Please login to Docker Hub first:"
  docker login
fi

# Push the AMD64 images
echo "Pushing ${IMAGE_NAME}:${TAG}..."
docker push ${IMAGE_NAME}:${TAG}

echo "Pushing ${IMAGE_NAME}:latest-amd64..."
docker push ${IMAGE_NAME}:latest-amd64

if [ $? -eq 0 ]; then
  echo "✅ Successfully pushed AMD64 images to Docker Hub"
  echo "Images pushed:"
  echo "  - ${IMAGE_NAME}:${TAG}"
  echo "  - ${IMAGE_NAME}:latest-amd64"
else
  echo "❌ Failed to push Docker images"
  exit 1
fi