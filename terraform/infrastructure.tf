# Terraform Configuration for EventSphere GCP Infrastructure
# Complete infrastructure as code for Project Drishti

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

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudbuild.googleapis.com",
    "pubsub.googleapis.com",
    "bigquery.googleapis.com",
    "storage.googleapis.com",
    "firestore.googleapis.com",
    "aiplatform.googleapis.com",
    "vision.googleapis.com",
    "dialogflow.googleapis.com",
    "cloudscheduler.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudkms.googleapis.com"
  ])
  
  project = var.project_id
  service = each.key
  
  disable_on_destroy = false
}

# Cloud Storage Bucket
resource "google_storage_bucket" "data_storage" {
  name          = "${var.project_id}-data-storage"
  location      = var.region
  force_destroy = false
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
}

# BigQuery Dataset
resource "google_bigquery_dataset" "analytics" {
  dataset_id  = "drishtix_analytics"
  location    = "US"
  description = "Event analytics and predictions data warehouse"
  
  default_table_expiration_ms = 31536000000 # 1 year
}

# Pub/Sub Topics
resource "google_pubsub_topic" "topics" {
  for_each = toset([
    "video-analytics",
    "social-signals",
    "gps-tracking",
    "incident-alerts",
    "crowd-predictions",
    "alert-escalation",
    "reward-events"
  ])
  
  name = each.key
  
  message_retention_duration = "604800s" # 7 days
}

# Pub/Sub Subscriptions
resource "google_pubsub_subscription" "subscriptions" {
  for_each = toset([
    "video-analytics-processing",
    "social-signals-processing",
    "incident-alerts-processing"
  ])
  
  name  = each.key
  topic = google_pubsub_topic.topics[split("-processing", each.key)[0]].name
  
  ack_deadline_seconds = 60
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

# Service Account for Cloud Functions
resource "google_service_account" "cloud_functions" {
  account_id   = "cloud-functions-sa"
  display_name = "Cloud Functions Service Account"
}

# IAM bindings for service account
resource "google_project_iam_member" "cloud_functions_roles" {
  for_each = toset([
    "roles/pubsub.publisher",
    "roles/datastore.user",
    "roles/bigquery.dataEditor",
    "roles/storage.objectAdmin",
    "roles/aiplatform.user"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloud_functions.email}"
}

# Firestore Database (already created, import existing)
# terraform import google_firestore_database.default "(default)"

# Cloud KMS Keyring
resource "google_kms_key_ring" "drishtix_keys" {
  name     = "drishtix-keys"
  location = var.region
}

# Cloud KMS Encryption Key
resource "google_kms_crypto_key" "data_encryption" {
  name            = "data-encryption-key"
  key_ring        = google_kms_key_ring.drishtix_keys.id
  rotation_period = "7776000s" # 90 days
  
  lifecycle {
    prevent_destroy = true
  }
}

# Cloud Armor Security Policy
resource "google_compute_security_policy" "web_firewall" {
  name = "web-firewall"
  
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["9.9.9.0/24"] # Example malicious IP range
      }
    }
    description = "Deny access to malicious IPs"
  }
  
  rule {
    action   = "rate_based_ban"
    priority = "2000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
    }
    description = "Rate limit: 100 requests per minute"
  }
  
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default allow rule"
  }
}

# Outputs
output "bucket_name" {
  value = google_storage_bucket.data_storage.name
}

output "bigquery_dataset" {
  value = google_bigquery_dataset.analytics.dataset_id
}

output "service_account_email" {
  value = google_service_account.cloud_functions.email
}

output "pubsub_topics" {
  value = [for topic in google_pubsub_topic.topics : topic.name]
}
