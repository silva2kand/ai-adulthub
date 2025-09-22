#!/bin/bash

# One-click deploy script for AWS/GCP
# Usage: ./deploy.sh [aws|gcp]

PLATFORM=${1:-aws}

echo "Deploying to $PLATFORM..."

# Build and push Docker image
docker build -t adult-aggregator:latest .
docker tag adult-aggregator:latest your-registry/adult-aggregator:latest
docker push your-registry/adult-aggregator:latest

if [ "$PLATFORM" = "aws" ]; then
  # AWS ECS deploy
  aws ecs update-service --cluster adult-aggregator-cluster --service adult-aggregator-service --force-new-deployment
elif [ "$PLATFORM" = "gcp" ]; then
  # GCP Cloud Run deploy
  gcloud run deploy adult-aggregator --image your-registry/adult-aggregator:latest --platform managed --region us-central1
else
  echo "Unsupported platform: $PLATFORM"
  exit 1
fi

echo "Deployment completed!"