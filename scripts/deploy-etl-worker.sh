#!/bin/bash
# Deploy Cloud Run ETL Worker to Google Cloud Platform

set -e

# Default values
PROJECT_ID=${GCP_PROJECT_ID:-""}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="etl-worker"
MEMORY="2Gi"
CPU=2
MIN_INSTANCES=1
MAX_INSTANCES=100
CONCURRENCY=80

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
step() {
    echo -e "${GREEN}✓ $1${NC}"
}

info() {
    echo -e "${CYAN}→ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

# Validate GCP_PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
    error "GCP_PROJECT_ID not set. Please set environment variable"
    exit 1
fi

info "Starting ETL Worker deployment to GCP..."
info "Project: $PROJECT_ID"
info "Region: $REGION"
info "Service: $SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    error "Google Cloud SDK not found. Please install from https://cloud.google.com/sdk"
    exit 1
fi
step "Google Cloud SDK found"

# Set GCP project
info "Setting GCP project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"
step "GCP project configured"

# Enable required APIs
info "Enabling required GCP APIs..."
APIS=(
    "run.googleapis.com"
    "cloudbuild.googleapis.com"
    "containerregistry.googleapis.com"
    "pubsub.googleapis.com"
    "bigquery.googleapis.com"
)

for api in "${APIS[@]}"; do
    info "Enabling $api..."
    gcloud services enable "$api" --quiet
done
step "APIs enabled"

# Build Docker image
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="$IMAGE_NAME:$IMAGE_TAG"

info "Building Docker image: $FULL_IMAGE_NAME..."
cd workers/etl-worker

docker build -t "$FULL_IMAGE_NAME" .
if [ $? -ne 0 ]; then
    cd ../..
    error "Docker build failed"
    exit 1
fi

cd ../..
step "Docker image built successfully"

# Push to GCR
info "Pushing image to Google Container Registry..."
docker push "$FULL_IMAGE_NAME"
if [ $? -ne 0 ]; then
    error "Failed to push image to GCR"
    exit 1
fi
step "Image pushed to GCR"

# Deploy to Cloud Run
info "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$FULL_IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --memory "$MEMORY" \
    --cpu "$CPU" \
    --min-instances "$MIN_INSTANCES" \
    --max-instances "$MAX_INSTANCES" \
    --concurrency "$CONCURRENCY" \
    --timeout 300 \
    --allow-unauthenticated \
    --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID,BIGQUERY_DATASET=drishtix_analytics" \
    --quiet

if [ $? -ne 0 ]; then
    error "Cloud Run deployment failed"
    exit 1
fi
step "Deployed to Cloud Run"

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format "value(status.url)")
step "Service URL: $SERVICE_URL"

# Create Pub/Sub push subscription
info "Creating Pub/Sub push subscription..."
SUBSCRIPTION_NAME="etl-worker-sub"
TOPIC_NAME="raw-data-stream"

# Create topic if doesn't exist
gcloud pubsub topics create "$TOPIC_NAME" --quiet 2>/dev/null || true

# Delete existing subscription if exists
gcloud pubsub subscriptions delete "$SUBSCRIPTION_NAME" --quiet 2>/dev/null || true

# Create push subscription
gcloud pubsub subscriptions create "$SUBSCRIPTION_NAME" \
    --topic "$TOPIC_NAME" \
    --push-endpoint "${SERVICE_URL}/process" \
    --ack-deadline 60 \
    --message-retention-duration 7d \
    --quiet

if [ $? -ne 0 ]; then
    error "Failed to create Pub/Sub subscription"
    exit 1
fi
step "Pub/Sub subscription created"

# Health check
info "Performing health check..."
sleep 5
if curl -s "${SERVICE_URL}/health" | grep -q "healthy"; then
    step "Health check passed"
else
    error "Health check failed"
fi

# Update .env file
info "Updating .env file with ETL_WORKER_URL..."
ENV_PATH=".env"
if [ -f "$ENV_PATH" ]; then
    if grep -q "ETL_WORKER_URL=" "$ENV_PATH"; then
        sed -i "s|ETL_WORKER_URL=.*|ETL_WORKER_URL=$SERVICE_URL|" "$ENV_PATH"
    else
        echo "ETL_WORKER_URL=$SERVICE_URL" >> "$ENV_PATH"
    fi
    step ".env file updated"
else
    error ".env file not found"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ETL Worker Deployment Complete!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Service URL: ${YELLOW}$SERVICE_URL${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "${NC}1. Test the worker: curl $SERVICE_URL/health${NC}"
echo -e "${NC}2. Update backend .env: ETL_WORKER_URL=$SERVICE_URL${NC}"
echo -e "${NC}3. Restart backend server to load new configuration${NC}"
echo -e "${NC}4. Monitor logs: gcloud run logs read $SERVICE_NAME --region $REGION --limit 50${NC}"
echo ""
