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

echo "Deploying $SERVICE_NAME to $PROJECT_ID in $REGION..."

# Cloud Run にデプロイ
# --set-build-env-vars を使用して、ビルド時に API キーを注入（Vite のビルドに必要）
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --set-build-env-vars GEMINI_API_KEY=$GEMINI_API_KEY \
  --allow-unauthenticated

echo "Deployment complete!"
