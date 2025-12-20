#!/bin/bash

# プロジェクト ID を取得
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="agri-advisor"
REGION="asia-northeast1"

# API キーを .env.local から取得（デプロイ時のみ使用）
if [ -f .env.local ]; then
  source .env.local
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "Error: GEMINI_API_KEY is not set. Please set it in .env.local or as an environment variable."
  exit 1
fi

echo "Step 1: Building container with API key using Cloud Build..."
IMAGE_URL="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Build with build-arg to bake the API key into the Vite bundle via cloudbuild.yaml
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY=$GEMINI_API_KEY

echo "Step 2: Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_URL \
  --region $REGION \
  --allow-unauthenticated

echo "Deployment complete!"
