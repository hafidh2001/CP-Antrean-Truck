#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Build Docker image with build arguments
docker build \
    --build-arg VITE_DECRYPT_SECRET_KEY="$VITE_DECRYPT_SECRET_KEY" \
    -t cp-antrean-truck:latest \
    .

echo "Docker build completed!"
echo "To run: docker run -p 8080:80 cp-antrean-truck:latest"