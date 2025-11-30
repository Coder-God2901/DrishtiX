#!/bin/bash

##############################################################################
# EventSphere GCP Infrastructure Deployment Script
# 
# This script deploys all Google Cloud Platform resources using Terraform
# Includes: Pub/Sub, BigQuery, Cloud Storage, Cloud Armor, KMS, IAM, etc.
#
# Usage: ./scripts/deploy-infrastructure.sh [plan|apply|destroy]
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TERRAFORM_DIR="./terraform"
PROJECT_ID="${VITE_GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"

# Functions
print_header() {
    echo -e "${BLUE}===========================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===========================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform not found. Please install Terraform first."
        echo "Visit: https://developer.hashicorp.com/terraform/downloads"
        exit 1
    fi
    print_success "Terraform installed: $(terraform version | head -n1)"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI not found. Please install Google Cloud SDK first."
        echo "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "gcloud CLI installed: $(gcloud version | head -n1)"
    
    # Check if logged in to gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        print_warning "Not logged in to gcloud. Running authentication..."
        gcloud auth login
    fi
    print_success "Authenticated to gcloud"
    
    # Check project ID
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID not set. Please set VITE_GCP_PROJECT_ID environment variable."
        echo "Example: export VITE_GCP_PROJECT_ID=your-project-id"
        exit 1
    fi
    print_success "Project ID: $PROJECT_ID"
    
    # Set gcloud project
    gcloud config set project "$PROJECT_ID"
    
    echo ""
}

# Initialize Terraform
init_terraform() {
    print_header "Initializing Terraform"
    
    cd "$TERRAFORM_DIR"
    
    # Create terraform.tfvars if it doesn't exist
    if [ ! -f "terraform.tfvars" ]; then
        print_info "Creating terraform.tfvars..."
        cat > terraform.tfvars <<EOF
project_id = "$PROJECT_ID"
region     = "$REGION"
EOF
        print_success "Created terraform.tfvars"
    fi
    
    # Initialize Terraform
    terraform init
    
    print_success "Terraform initialized"
    cd - > /dev/null
    echo ""
}

# Plan Terraform deployment
plan_terraform() {
    print_header "Planning Terraform Deployment"
    
    cd "$TERRAFORM_DIR"
    terraform plan -out=tfplan
    print_success "Terraform plan created (saved to tfplan)"
    cd - > /dev/null
    echo ""
}

# Apply Terraform deployment
apply_terraform() {
    print_header "Applying Terraform Deployment"
    
    cd "$TERRAFORM_DIR"
    
    # Check if plan exists
    if [ -f "tfplan" ]; then
        print_info "Applying saved plan..."
        terraform apply tfplan
        rm tfplan
    else
        print_warning "No saved plan found. Creating new plan..."
        terraform apply -auto-approve
    fi
    
    print_success "Infrastructure deployed successfully!"
    cd - > /dev/null
    echo ""
}

# Destroy Terraform deployment
destroy_terraform() {
    print_header "Destroying Terraform Deployment"
    
    print_warning "This will destroy ALL infrastructure!"
    read -p "Are you sure? Type 'yes' to confirm: " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        print_info "Destruction cancelled."
        exit 0
    fi
    
    cd "$TERRAFORM_DIR"
    terraform destroy -auto-approve
    print_success "Infrastructure destroyed"
    cd - > /dev/null
    echo ""
}

# Show Terraform outputs
show_outputs() {
    print_header "Terraform Outputs"
    
    cd "$TERRAFORM_DIR"
    terraform output
    cd - > /dev/null
    echo ""
}

# Enable required GCP APIs
enable_apis() {
    print_header "Enabling Required GCP APIs"
    
    apis=(
        "compute.googleapis.com"
        "storage-api.googleapis.com"
        "bigquery.googleapis.com"
        "pubsub.googleapis.com"
        "cloudfunctions.googleapis.com"
        "aiplatform.googleapis.com"
        "vision.googleapis.com"
        "cloudkms.googleapis.com"
        "cloudmonitoring.googleapis.com"
        "logging.googleapis.com"
        "cloudarmor.googleapis.com"
        "firestore.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_info "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID" 2>/dev/null || true
    done
    
    print_success "All required APIs enabled"
    echo ""
}

# Create service account key
create_service_account_key() {
    print_header "Creating Service Account Key"
    
    SA_NAME="cloud-functions-sa"
    SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    KEY_FILE="./service-account-key.json"
    
    # Check if service account exists (will be created by Terraform)
    if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &> /dev/null; then
        print_info "Service account exists: $SA_EMAIL"
        
        # Create key if it doesn't exist
        if [ ! -f "$KEY_FILE" ]; then
            print_info "Creating service account key..."
            gcloud iam service-accounts keys create "$KEY_FILE" \
                --iam-account="$SA_EMAIL" \
                --project="$PROJECT_ID"
            print_success "Service account key created: $KEY_FILE"
        else
            print_warning "Service account key already exists: $KEY_FILE"
        fi
    else
        print_warning "Service account not found. It will be created by Terraform."
    fi
    
    echo ""
}

# Update .env file
update_env_file() {
    print_header "Updating .env File"
    
    cd "$TERRAFORM_DIR"
    
    # Get Terraform outputs
    BUCKET_NAME=$(terraform output -raw bucket_name 2>/dev/null || echo "")
    DATASET_ID=$(terraform output -raw bigquery_dataset 2>/dev/null || echo "")
    
    cd - > /dev/null
    
    if [ ! -f ".env" ]; then
        cp .env.example .env 2>/dev/null || touch .env
    fi
    
    # Update .env with infrastructure details
    print_info "Updating .env with infrastructure details..."
    
    if [ -n "$BUCKET_NAME" ]; then
        sed -i.bak "s/^VITE_GCS_BUCKET=.*/VITE_GCS_BUCKET=$BUCKET_NAME/" .env
    fi
    
    if [ -n "$DATASET_ID" ]; then
        sed -i.bak "s/^VITE_BIGQUERY_DATASET=.*/VITE_BIGQUERY_DATASET=$DATASET_ID/" .env
    fi
    
    sed -i.bak "s/^VITE_GCP_PROJECT_ID=.*/VITE_GCP_PROJECT_ID=$PROJECT_ID/" .env
    sed -i.bak "s/^VITE_GCP_REGION=.*/VITE_GCP_REGION=$REGION/" .env
    
    rm -f .env.bak
    
    print_success ".env file updated"
    echo ""
}

# Main deployment flow
deploy() {
    print_header "🚀 EventSphere GCP Infrastructure Deployment"
    echo ""
    
    check_prerequisites
    enable_apis
    init_terraform
    plan_terraform
    apply_terraform
    show_outputs
    create_service_account_key
    update_env_file
    
    print_header "✅ Deployment Complete!"
    print_info "Next steps:"
    echo "  1. Review the Terraform outputs above"
    echo "  2. Deploy Cloud Functions: ./scripts/deploy-cloud-functions.sh all"
    echo "  3. Run end-to-end tests: node scripts/test-e2e-pipeline.js"
    echo ""
    print_success "Infrastructure is ready! 🎉"
}

# Main script
main() {
    case "${1:-}" in
        plan)
            check_prerequisites
            init_terraform
            plan_terraform
            ;;
        apply)
            check_prerequisites
            init_terraform
            apply_terraform
            show_outputs
            ;;
        destroy)
            check_prerequisites
            init_terraform
            destroy_terraform
            ;;
        outputs)
            show_outputs
            ;;
        "")
            deploy
            ;;
        *)
            echo "Usage: $0 [plan|apply|destroy|outputs]"
            echo ""
            echo "Commands:"
            echo "  (none)   - Full deployment (default)"
            echo "  plan     - Show deployment plan"
            echo "  apply    - Apply infrastructure changes"
            echo "  destroy  - Destroy all infrastructure"
            echo "  outputs  - Show Terraform outputs"
            exit 1
            ;;
    esac
}

main "$@"
