#!/bin/bash

###############################################################################
# Cloud Functions Deployment Script
# 
# Deploys all Cloud Functions for EventSphere (Project Drishti)
# 
# Usage:
#   ./scripts/deploy-cloud-functions.sh [function-name]
# 
# Functions:
#   - alert-triggers
#   - reward-automation
#   - twilio-webhooks
#   - all (default)
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_ACCOUNT="${GCP_SERVICE_ACCOUNT:-}"

# Function to print colored messages
log() {
    echo -e "${CYAN}$1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

header() {
    echo ""
    echo -e "${CYAN}============================================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}============================================================${NC}"
}

# Check prerequisites
check_prerequisites() {
    header "Checking Prerequisites"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI not found. Please install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    success "gcloud CLI found"
    
    # Check if project ID is set
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            error "GCP_PROJECT_ID not set. Set it with: export GCP_PROJECT_ID=your-project-id"
            exit 1
        fi
    fi
    success "Project ID: $PROJECT_ID"
    
    # Check if APIs are enabled
    info "Checking required APIs..."
    
    REQUIRED_APIS=(
        "cloudfunctions.googleapis.com"
        "cloudbuild.googleapis.com"
        "pubsub.googleapis.com"
        "firestore.googleapis.com"
    )
    
    for api in "${REQUIRED_APIS[@]}"; do
        if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            success "$api enabled"
        else
            warning "$api not enabled. Enabling..."
            gcloud services enable "$api" --project="$PROJECT_ID"
            success "$api enabled"
        fi
    done
}

# Create Pub/Sub topics
create_pubsub_topics() {
    header "Creating Pub/Sub Topics"
    
    TOPICS=(
        "incident-alerts"
        "reward-events"
        "alert-escalation"
    )
    
    for topic in "${TOPICS[@]}"; do
        if gcloud pubsub topics describe "$topic" --project="$PROJECT_ID" &>/dev/null; then
            success "Topic $topic already exists"
        else
            info "Creating topic $topic..."
            gcloud pubsub topics create "$topic" --project="$PROJECT_ID"
            success "Topic $topic created"
        fi
    done
}

# Deploy Alert Triggers function
deploy_alert_triggers() {
    header "Deploying Alert Triggers Function"
    
    cd functions/alert-triggers
    
    info "Installing dependencies..."
    npm install
    
    info "Deploying function..."
    gcloud functions deploy handleAlertTrigger \
        --gen2 \
        --runtime=nodejs20 \
        --region="$REGION" \
        --source=. \
        --entry-point=handleAlertTrigger \
        --trigger-topic=incident-alerts \
        --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID},TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN},TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER},API_BASE_URL=${API_BASE_URL}" \
        --memory=256MB \
        --timeout=60s \
        --max-instances=10 \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --project="$PROJECT_ID"
    
    success "Alert Triggers function deployed"
    cd ../..
}

# Deploy Reward Automation function
deploy_reward_automation() {
    header "Deploying Reward Automation Function"
    
    cd functions/reward-automation
    
    info "Installing dependencies..."
    npm install
    
    info "Deploying function..."
    gcloud functions deploy handleRewardTrigger \
        --gen2 \
        --runtime=nodejs20 \
        --region="$REGION" \
        --source=. \
        --entry-point=handleRewardTrigger \
        --trigger-topic=reward-events \
        --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID" \
        --memory=256MB \
        --timeout=60s \
        --max-instances=10 \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --project="$PROJECT_ID"
    
    success "Reward Automation function deployed"
    cd ../..
}

# Deploy Twilio Webhooks function
deploy_twilio_webhooks() {
    header "Deploying Twilio Webhooks Function"
    
    cd functions/twilio-webhooks
    
    info "Installing dependencies..."
    npm install
    
    info "Deploying function..."
    gcloud functions deploy handleTwilioWebhook \
        --gen2 \
        --runtime=nodejs20 \
        --region="$REGION" \
        --source=. \
        --entry-point=handleTwilioWebhook \
        --trigger-http \
        --allow-unauthenticated \
        --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID},TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN},GEMINI_API_KEY=${GEMINI_API_KEY},WEBHOOK_BASE_URL=https://${REGION}-${PROJECT_ID}.cloudfunctions.net" \
        --memory=512MB \
        --timeout=120s \
        --max-instances=20 \
        ${SERVICE_ACCOUNT:+--service-account=$SERVICE_ACCOUNT} \
        --project="$PROJECT_ID"
    
    # Get function URL
    WEBHOOK_URL=$(gcloud functions describe handleTwilioWebhook \
        --gen2 \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format='value(serviceConfig.uri)')
    
    success "Twilio Webhooks function deployed"
    info "Webhook URL: $WEBHOOK_URL"
    warning "Configure this URL in Twilio Console for SMS/WhatsApp webhooks"
    
    cd ../..
}

# Display deployment summary
display_summary() {
    header "Deployment Summary"
    
    echo ""
    success "All Cloud Functions deployed successfully!"
    echo ""
    
    info "Project ID: $PROJECT_ID"
    info "Region: $REGION"
    echo ""
    
    echo "Deployed Functions:"
    echo "  • handleAlertTrigger (Pub/Sub: incident-alerts)"
    echo "  • handleRewardTrigger (Pub/Sub: reward-events)"
    echo "  • handleTwilioWebhook (HTTP)"
    echo ""
    
    info "Next Steps:"
    echo "  1. Configure Twilio webhook URL in Twilio Console"
    echo "  2. Set up Firebase Admin SDK for FCM notifications"
    echo "  3. Add on-call responders to Firestore 'responders' collection"
    echo "  4. Test functions with: node scripts/test-cloud-functions.js"
    echo "  5. Monitor logs: gcloud functions logs read --follow"
    echo ""
    
    info "View functions in Console:"
    echo "  https://console.cloud.google.com/functions/list?project=$PROJECT_ID"
    echo ""
}

# Main deployment logic
main() {
    FUNCTION_NAME="${1:-all}"
    
    echo ""
    log "============================================================"
    log "Cloud Functions Deployment - EventSphere (Project Drishti)"
    log "============================================================"
    echo ""
    
    check_prerequisites
    create_pubsub_topics
    
    case "$FUNCTION_NAME" in
        alert-triggers)
            deploy_alert_triggers
            ;;
        reward-automation)
            deploy_reward_automation
            ;;
        twilio-webhooks)
            deploy_twilio_webhooks
            ;;
        all)
            deploy_alert_triggers
            deploy_reward_automation
            deploy_twilio_webhooks
            ;;
        *)
            error "Invalid function name: $FUNCTION_NAME"
            echo "Valid options: alert-triggers, reward-automation, twilio-webhooks, all"
            exit 1
            ;;
    esac
    
    display_summary
}

# Check if required environment variables are set
check_env_vars() {
    MISSING_VARS=()
    
    [ -z "$TWILIO_ACCOUNT_SID" ] && MISSING_VARS+=("TWILIO_ACCOUNT_SID")
    [ -z "$TWILIO_AUTH_TOKEN" ] && MISSING_VARS+=("TWILIO_AUTH_TOKEN")
    [ -z "$TWILIO_PHONE_NUMBER" ] && MISSING_VARS+=("TWILIO_PHONE_NUMBER")
    [ -z "$GEMINI_API_KEY" ] && MISSING_VARS+=("GEMINI_API_KEY")
    [ -z "$API_BASE_URL" ] && MISSING_VARS+=("API_BASE_URL")
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        warning "Missing environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        echo ""
        warning "Functions will deploy but may not work correctly without these values."
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Run deployment
check_env_vars
main "$@"
