# DrishtiX Terraform Infrastructure Configuration
# Production-ready Google Cloud Platform setup

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "drishtix-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "storage.googleapis.com",
    "bigquery.googleapis.com",
    "aiplatform.googleapis.com",
    "pubsub.googleapis.com",
    "run.googleapis.com",
    "firestore.googleapis.com",
    "cloudkms.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "dataflow.googleapis.com",
    "vision.googleapis.com",
    "fcm.googleapis.com",
  ])
  
  service            = each.value
  disable_on_destroy = false
}

# VPC Network
resource "google_compute_network" "drishtix_vpc" {
  name                    = "drishtix-vpc-${var.environment}"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
  
  depends_on = [google_project_service.required_apis]
}

# Subnet
resource "google_compute_subnetwork" "drishtix_subnet" {
  name          = "drishtix-subnet-${var.region}"
  network       = google_compute_network.drishtix_vpc.id
  region        = var.region
  ip_cidr_range = "10.0.0.0/24"
  
  # Enable private Google access
  private_ip_google_access = true
  
  log_config {
    aggregation_interval = "INTERVAL_10_MIN"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Cloud Armor Security Policy
resource "google_compute_security_policy" "web_firewall" {
  name        = "drishtix-web-firewall"
  description = "Cloud Armor security policy for DrishtiX"
  
  # Block SQL injection
  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Block SQL injection attacks"
  }
  
  # Block XSS
  rule {
    action   = "deny(403)"
    priority = 1001
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block XSS attacks"
  }
  
  # Rate limiting
  rule {
    action   = "rate_based_ban"
    priority = 2000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      
      ban_duration_sec = 600
    }
    description = "Rate limit to 100 requests per minute per IP"
  }
  
  # Default allow
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }
}

# Service Accounts
resource "google_service_account" "cloud_run_sa" {
  account_id   = "cloud-run-sa"
  display_name = "Cloud Run Service Account"
  description  = "Service account for Cloud Run services"
}

resource "google_service_account" "dataflow_sa" {
  account_id   = "dataflow-sa"
  display_name = "Dataflow Service Account"
  description  = "Service account for Dataflow jobs"
}

resource "google_service_account" "ground_station_sa" {
  account_id   = "ground-station-sa"
  display_name = "Ground Station Service Account"
  description  = "Service account for drone ground stations"
}

# IAM Roles for Cloud Run SA
resource "google_project_iam_member" "cloudrun_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloudrun_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloudrun_bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloudrun_vertexai" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloudrun_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Cloud Storage Bucket
resource "google_storage_bucket" "drishtix_storage" {
  name          = "${var.project_id}-drishtix-storage"
  location      = var.region
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  encryption {
    default_kms_key_name = google_kms_crypto_key.data_key.id
  }
  
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90
    }
  }
  
  versioning {
    enabled = true
  }
  
  logging {
    log_bucket = google_storage_bucket.logs_bucket.name
  }
  
  depends_on = [google_kms_crypto_key_iam_member.storage_kms]
}

# Logs Bucket
resource "google_storage_bucket" "logs_bucket" {
  name          = "${var.project_id}-logs"
  location      = var.region
  force_destroy = false
  
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 30
    }
  }
}

# KMS Key Ring
resource "google_kms_key_ring" "drishtix_keyring" {
  name     = "drishtix-keys"
  location = var.region
}

# KMS Crypto Key
resource "google_kms_crypto_key" "data_key" {
  name            = "data-encryption-key"
  key_ring        = google_kms_key_ring.drishtix_keyring.id
  rotation_period = "7776000s" # 90 days
  
  lifecycle {
    prevent_destroy = true
  }
}

# IAM for KMS
resource "google_kms_crypto_key_iam_member" "storage_kms" {
  crypto_key_id = google_kms_crypto_key.data_key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:service-${data.google_project.project.number}@gs-project-accounts.iam.gserviceaccount.com"
}

# BigQuery Dataset
resource "google_bigquery_dataset" "drishtix_analytics" {
  dataset_id  = "drishtix_analytics"
  location    = "US"
  description = "DrishtiX analytics and ML training data"
  
  access {
    role          = "OWNER"
    user_by_email = google_service_account.cloud_run_sa.email
  }
  
  access {
    role          = "READER"
    special_group = "projectReaders"
  }
  
  default_table_expiration_ms = 7776000000 # 90 days
}

# Pub/Sub Topics
resource "google_pubsub_topic" "video_frames" {
  name = "drishtix-video-frames"
  
  message_retention_duration = "86400s" # 24 hours
}

resource "google_pubsub_topic" "video_frames_dlq" {
  name = "drishtix-video-frames-dlq"
}

# Pub/Sub Subscription
resource "google_pubsub_subscription" "video_processor_sub" {
  name  = "video-processor-sub"
  topic = google_pubsub_topic.video_frames.name
  
  ack_deadline_seconds = 60
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.video_frames_dlq.id
    max_delivery_attempts = 5
  }
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

# IAM for Pub/Sub
resource "google_pubsub_topic_iam_binding" "publisher" {
  topic   = google_pubsub_topic.video_frames.name
  role    = "roles/pubsub.publisher"
  members = [
    "serviceAccount:${google_service_account.ground_station_sa.email}",
    "serviceAccount:${google_service_account.cloud_run_sa.email}",
  ]
}

# Cloud Run Service (API)
resource "google_cloud_run_service" "api" {
  name     = "drishtix-api"
  location = var.region
  
  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      
      containers {
        image = "gcr.io/${var.project_id}/drishtix-api:latest"
        
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "PUBSUB_TOPIC"
          value = google_pubsub_topic.video_frames.name
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "100"
        "autoscaling.knative.dev/minScale"      = "1"
        "run.googleapis.com/ingress"            = "internal-and-cloud-load-balancing"
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.id
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
}

# VPC Access Connector
resource "google_vpc_access_connector" "connector" {
  name          = "drishtix-connector"
  region        = var.region
  network       = google_compute_network.drishtix_vpc.name
  ip_cidr_range = "10.8.0.0/28"
  
  min_instances = 2
  max_instances = 10
}

# Cloud Run IAM (Allow unauthenticated for public API)
resource "google_cloud_run_service_iam_member" "api_public" {
  location = google_cloud_run_service.api.location
  service  = google_cloud_run_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Backend Service for Load Balancer
resource "google_compute_backend_service" "api_backend" {
  name                  = "drishtix-api-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  
  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }
  
  security_policy = google_compute_security_policy.web_firewall.id
  
  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# Network Endpoint Group for Cloud Run
resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "drishtix-api-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"
  
  cloud_run {
    service = google_cloud_run_service.api.name
  }
}

# Data source for project
data "google_project" "project" {
  project_id = var.project_id
}

# Outputs
output "vpc_network_id" {
  value = google_compute_network.drishtix_vpc.id
}

output "cloud_run_url" {
  value = google_cloud_run_service.api.status[0].url
}

output "storage_bucket_name" {
  value = google_storage_bucket.drishtix_storage.name
}

output "bigquery_dataset_id" {
  value = google_bigquery_dataset.drishtix_analytics.dataset_id
}

output "pubsub_topic_id" {
  value = google_pubsub_topic.video_frames.id
}
