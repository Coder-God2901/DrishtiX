# Security-hardened resources for DrishtiX
# Risk Engine, Cloud Run, VPC, Cloud Armor

# ========================================
# VPC Network (Private)
# ========================================

resource "google_compute_network" "vpc" {
  name                    = "drishtix-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "drishtix-subnet-${var.region}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
  
  private_ip_google_access = true
  
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# ========================================
# Cloud Run Service (Private Ingress)
# ========================================

resource "google_service_account" "cloudrun_sa" {
  account_id   = "cloud-run-sa"
  display_name = "Cloud Run Service Account"
}

resource "google_project_iam_member" "cloudrun_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/pubsub.publisher",
    "roles/pubsub.subscriber",
    "roles/bigquery.dataEditor",
    "roles/aiplatform.user",
    "roles/dlp.user"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_cloud_run_service" "api" {
  name     = "drishtix-api"
  location = var.region
  
  template {
    spec {
      service_account_name = google_service_account.cloudrun_sa.email
      
      containers {
        image = "gcr.io/${var.project_id}/drishtix-api:latest"
        
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
        
        env {
          name  = "NODE_ENV"
          value = var.environment
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        ports {
          container_port = 3000
        }
      }
      
      container_concurrency = 80
      timeout_seconds       = 300
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"      = "1"
        "autoscaling.knative.dev/maxScale"      = "100"
        "run.googleapis.com/cpu-throttling"     = "false"
        "run.googleapis.com/execution-environment" = "gen2"
        # Private ingress: only accessible via load balancer
        "run.googleapis.com/ingress" = "internal-and-cloud-load-balancing"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image
    ]
  }
}

# Cloud Run IAM - Allow only load balancer to invoke (secure)
resource "google_cloud_run_service_iam_member" "lb_invoker" {
  service  = google_cloud_run_service.api.name
  location = google_cloud_run_service.api.location
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# ========================================
# Load Balancer with Cloud Armor
# ========================================

# Backend service for Cloud Run
resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  name                  = "drishtix-api-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  
  cloud_run {
    service = google_cloud_run_service.api.name
  }
}

resource "google_compute_backend_service" "api_backend" {
  name                  = "drishtix-api-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  
  security_policy = google_compute_security_policy.web_firewall_enhanced.id
  
  backend {
    group = google_compute_region_network_endpoint_group.cloudrun_neg.id
  }
  
  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# URL map
resource "google_compute_url_map" "api_urlmap" {
  name            = "drishtix-api-urlmap"
  default_service = google_compute_backend_service.api_backend.id
}

# HTTPS proxy
resource "google_compute_target_https_proxy" "api_proxy" {
  name    = "drishtix-api-proxy"
  url_map = google_compute_url_map.api_urlmap.id
  
  ssl_certificates = [google_compute_managed_ssl_certificate.api_cert.id]
}

# Managed SSL certificate
resource "google_compute_managed_ssl_certificate" "api_cert" {
  name = "drishtix-api-cert"
  
  managed {
    domains = ["api.drishtix.example.com"] # Replace with actual domain
  }
}

# Global forwarding rule
resource "google_compute_global_forwarding_rule" "api_forwarding" {
  name       = "drishtix-api-forwarding"
  target     = google_compute_target_https_proxy.api_proxy.id
  port_range = "443"
  ip_protocol = "TCP"
}

# Enhanced Cloud Armor Policy (SQL injection, XSS, etc.)
resource "google_compute_security_policy" "web_firewall_enhanced" {
  name = "web-firewall-enhanced"
  
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
    priority = 1100
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Block XSS attacks"
  }
  
  # Block LFI (Local File Inclusion)
  rule {
    action   = "deny(403)"
    priority = 1200
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-v33-stable')"
      }
    }
    description = "Block LFI attacks"
  }
  
  # Block RCE (Remote Code Execution)
  rule {
    action   = "deny(403)"
    priority = 1300
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rce-v33-stable')"
      }
    }
    description = "Block RCE attacks"
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
      ban_duration_sec = 600
      
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      
      ban_threshold {
        count        = 10000
        interval_sec = 600
      }
    }
    description = "API rate limiting: 100 req/min per IP"
  }
  
  # Geo-blocking (example: block specific countries if needed)
  rule {
    action   = "deny(403)"
    priority = 3000
    match {
      expr {
        expression = "origin.region_code == 'CN' || origin.region_code == 'RU'"
      }
    }
    description = "Geo-blocking (example)"
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
    description = "Default allow"
  }
}

# ========================================
# Risk Engine Pub/Sub
# ========================================

resource "google_pubsub_topic" "risk_engine" {
  name = "risk-engine"
  
  message_retention_duration = "86400s" # 24 hours
  
  message_storage_policy {
    allowed_persistence_regions = [var.region]
  }
}

resource "google_pubsub_subscription" "risk_engine_sub" {
  name  = "risk-engine-sub"
  topic = google_pubsub_topic.risk_engine.name
  
  ack_deadline_seconds = 60
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
  
  push_config {
    push_endpoint = "${google_cloud_run_service.api.status[0].url}/api/pubsub/risk-engine"
    
    oidc_token {
      service_account_email = google_service_account.cloudrun_sa.email
    }
  }
}

# Dead letter topic for failed messages
resource "google_pubsub_topic" "dead_letter" {
  name = "dead-letter-queue"
  
  message_retention_duration = "604800s" # 7 days
}

# Anomaly events topic
resource "google_pubsub_topic" "anomaly_events" {
  name = "anomaly-events"
  
  message_retention_duration = "86400s"
}

# Heatgrid stream topic (from Dataflow)
resource "google_pubsub_topic" "heatgrid_stream" {
  name = "heatgrid-stream"
  
  message_retention_duration = "3600s" # 1 hour
}

# ========================================
# Cloud DLP (PII Removal)
# ========================================

resource "google_data_loss_prevention_inspect_template" "pii_detector" {
  parent       = "projects/${var.project_id}"
  display_name = "PII Detector Template"
  
  inspect_config {
    info_types {
      name = "EMAIL_ADDRESS"
    }
    info_types {
      name = "PHONE_NUMBER"
    }
    info_types {
      name = "CREDIT_CARD_NUMBER"
    }
    info_types {
      name = "LOCATION"
    }
    
    min_likelihood = "POSSIBLE"
    
    limits {
      max_findings_per_request = 0 # unlimited
    }
  }
}

# ========================================
# Outputs
# ========================================

output "cloud_run_url" {
  value       = google_cloud_run_service.api.status[0].url
  description = "Cloud Run service URL (private)"
}

output "load_balancer_ip" {
  value       = google_compute_global_forwarding_rule.api_forwarding.ip_address
  description = "Load balancer public IP"
}

output "risk_engine_topic" {
  value       = google_pubsub_topic.risk_engine.name
  description = "Risk engine Pub/Sub topic"
}

output "vpc_network" {
  value       = google_compute_network.vpc.name
  description = "VPC network name"
}

output "cloud_armor_policy" {
  value       = google_compute_security_policy.web_firewall_enhanced.id
  description = "Cloud Armor security policy ID"
}
