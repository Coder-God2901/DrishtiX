/**
 * Cloud Armor Security Policy Configuration
 * 
 * WAF rules for DDoS protection, SQL injection prevention,
 * XSS blocking, rate limiting, and geo-fencing.
 */

export interface CloudArmorRule {
  priority: number;
  description: string;
  match: {
    expr: {
      expression: string;
    };
  };
  action: 'allow' | 'deny' | 'rate_based_ban' | 'throttle';
  preview?: boolean;
}

export interface SecurityPolicy {
  name: string;
  description: string;
  rules: CloudArmorRule[];
  adaptiveProtectionConfig?: {
    layer7DdosDefenseConfig: {
      enable: boolean;
      ruleVisibility: 'STANDARD' | 'PREMIUM';
    };
  };
  ddosProtectionConfig?: {
    ddosProtection: 'STANDARD' | 'ADVANCED';
  };
}

/**
 * Production-ready Cloud Armor Security Policy
 */
export const cloudArmorPolicy: SecurityPolicy = {
  name: 'drishtix-security-policy',
  description: 'DrishtiX Event Safety Platform Security Policy',

  rules: [
    // Rule 1: Block SQL Injection Attempts
    {
      priority: 1000,
      description: 'Block SQL injection attempts',
      match: {
        expr: {
          expression: `evaluatePreconfiguredExpr('sqli-stable')`,
        },
      },
      action: 'deny',
    },

    // Rule 2: Block XSS Attacks
    {
      priority: 1100,
      description: 'Block cross-site scripting (XSS) attacks',
      match: {
        expr: {
          expression: `evaluatePreconfiguredExpr('xss-stable')`,
        },
      },
      action: 'deny',
    },

    // Rule 3: Block Remote Code Execution
    {
      priority: 1200,
      description: 'Block remote code execution attempts',
      match: {
        expr: {
          expression: `evaluatePreconfiguredExpr('rce-stable')`,
        },
      },
      action: 'deny',
    },

    // Rule 4: Block Local File Inclusion
    {
      priority: 1300,
      description: 'Block local file inclusion attacks',
      match: {
        expr: {
          expression: `evaluatePreconfiguredExpr('lfi-stable')`,
        },
      },
      action: 'deny',
    },

    // Rule 5: Rate Limiting - API Endpoints
    {
      priority: 2000,
      description: 'Rate limit API requests to 100 per minute per IP',
      match: {
        expr: {
          expression: `request.path.matches('/api/.*')`,
        },
      },
      action: 'rate_based_ban',
    },

    // Rule 6: Rate Limiting - Login Attempts
    {
      priority: 2100,
      description: 'Rate limit login attempts to 5 per minute per IP',
      match: {
        expr: {
          expression: `request.path == '/api/auth/login'`,
        },
      },
      action: 'throttle',
    },

    // Rule 7: Geo-blocking (Optional)
    {
      priority: 3000,
      description: 'Block traffic from high-risk countries',
      match: {
        expr: {
          expression: `origin.region_code in ['CN', 'RU', 'KP']`,
        },
      },
      action: 'deny',
      preview: true, // Set to false to enforce
    },

    // Rule 8: Block Known Bad User Agents
    {
      priority: 3100,
      description: 'Block malicious user agents',
      match: {
        expr: {
          expression: `has(request.headers['user-agent']) && request.headers['user-agent'].contains('bot') || request.headers['user-agent'].contains('crawler')`,
        },
      },
      action: 'deny',
      preview: true,
    },

    // Rule 9: Protect Admin Endpoints
    {
      priority: 4000,
      description: 'Extra protection for admin endpoints',
      match: {
        expr: {
          expression: `request.path.matches('/api/admin/.*')`,
        },
      },
      action: 'rate_based_ban',
    },

    // Rule 10: Allow All Other Traffic
    {
      priority: 2147483647, // Max priority (lowest precedence)
      description: 'Default allow rule',
      match: {
        expr: {
          expression: 'true',
        },
      },
      action: 'allow',
    },
  ],

  adaptiveProtectionConfig: {
    layer7DdosDefenseConfig: {
      enable: true,
      ruleVisibility: 'STANDARD',
    },
  },

  ddosProtectionConfig: {
    ddosProtection: 'ADVANCED',
  },
};

/**
 * Terraform configuration for Cloud Armor
 */
export const CLOUD_ARMOR_TERRAFORM = `
resource "google_compute_security_policy" "drishtix_policy" {
  name        = "drishtix-security-policy"
  description = "DrishtiX Event Safety Platform Security Policy"
  project     = var.project_id

  # Adaptive Protection (DDoS)
  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD"
    }
  }

  # Advanced DDoS Protection
  ddos_protection_config {
    ddos_protection = "ADVANCED"
  }

  # Rule 1: Block SQL Injection
  rule {
    action   = "deny(403)"
    priority = 1000
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-stable')"
      }
    }
    description = "Block SQL injection attempts"
  }

  # Rule 2: Block XSS
  rule {
    action   = "deny(403)"
    priority = 1100
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
    description = "Block XSS attacks"
  }

  # Rule 3: Block RCE
  rule {
    action   = "deny(403)"
    priority = 1200
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rce-stable')"
      }
    }
    description = "Block remote code execution"
  }

  # Rule 4: Block LFI
  rule {
    action   = "deny(403)"
    priority = 1300
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-stable')"
      }
    }
    description = "Block local file inclusion"
  }

  # Rule 5: Rate Limit API
  rule {
    action   = "rate_based_ban"
    priority = 2000
    match {
      expr {
        expression = "request.path.matches('/api/.*')"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      ban_duration_sec = 600
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
    }
    description = "Rate limit API to 100 req/min"
  }

  # Rule 6: Rate Limit Login
  rule {
    action   = "throttle"
    priority = 2100
    match {
      expr {
        expression = "request.path == '/api/auth/login'"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 5
        interval_sec = 60
      }
    }
    description = "Rate limit login to 5 attempts/min"
  }

  # Rule 7: Geo-blocking (preview mode)
  rule {
    action   = "deny(403)"
    priority = 3000
    preview  = true
    match {
      expr {
        expression = "origin.region_code in ['CN', 'RU', 'KP']"
      }
    }
    description = "Block high-risk countries (preview)"
  }

  # Default allow rule
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

# Attach to backend service
resource "google_compute_backend_service" "drishtix_backend" {
  name                  = "drishtix-backend"
  project               = var.project_id
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  enable_cdn            = true
  security_policy       = google_compute_security_policy.drishtix_policy.id

  backend {
    group = google_compute_region_network_endpoint_group.drishtix_neg.id
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}
`;

/**
 * VPC Network Security Configuration
 */
export const VPC_SECURITY_CONFIG = `
# VPC Network with Private Subnets
resource "google_compute_network" "drishtix_vpc" {
  name                    = "drishtix-vpc"
  project                 = var.project_id
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

# Private subnet for services
resource "google_compute_subnetwork" "private_subnet" {
  name          = "drishtix-private-subnet"
  project       = var.project_id
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.drishtix_vpc.id

  # Enable Private Google Access
  private_ip_google_access = true

  # Secondary ranges for GKE (if using Kubernetes)
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = "10.1.0.0/16"
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = "10.2.0.0/16"
  }
}

# Cloud NAT for outbound traffic
resource "google_compute_router" "nat_router" {
  name    = "drishtix-nat-router"
  project = var.project_id
  region  = var.region
  network = google_compute_network.drishtix_vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "drishtix-nat"
  project                            = var.project_id
  router                             = google_compute_router.nat_router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall rules
resource "google_compute_firewall" "allow_internal" {
  name    = "drishtix-allow-internal"
  project = var.project_id
  network = google_compute_network.drishtix_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/24"]
  priority      = 1000
}

resource "google_compute_firewall" "allow_health_checks" {
  name    = "drishtix-allow-health-checks"
  project = var.project_id
  network = google_compute_network.drishtix_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  source_ranges = [
    "35.191.0.0/16",
    "130.211.0.0/22"
  ]
  target_tags = ["allow-health-check"]
  priority    = 1000
}

resource "google_compute_firewall" "deny_all_egress" {
  name      = "drishtix-deny-all-egress"
  project   = var.project_id
  network   = google_compute_network.drishtix_vpc.name
  direction = "EGRESS"

  deny {
    protocol = "all"
  }

  destination_ranges = ["0.0.0.0/0"]
  priority           = 65535
}
`;

/**
 * Security monitoring and alerting
 */
export const SECURITY_MONITORING_CONFIG = `
# Log sink for security events
resource "google_logging_project_sink" "security_sink" {
  name        = "drishtix-security-sink"
  project     = var.project_id
  destination = "bigquery.googleapis.com/projects/\${var.project_id}/datasets/security_logs"

  filter = <<-EOT
    resource.type="http_load_balancer"
    OR resource.type="cloud_run_revision"
    OR protoPayload.methodName="google.cloud.sql.v1beta4.SqlInstancesService.Update"
    OR protoPayload.methodName=~".*Admin.*"
    OR severity >= ERROR
  EOT

  unique_writer_identity = true
}

# Alert policy for SQL injection attempts
resource "google_monitoring_alert_policy" "sql_injection_alert" {
  display_name = "SQL Injection Attempts Detected"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "SQL injection rate > 5/min"
    
    condition_threshold {
      filter          = "resource.type=\\"http_load_balancer\\" AND metric.type=\\"logging.googleapis.com/user/sql_injection_blocked\\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.security_email.id]

  alert_strategy {
    auto_close = "1800s"
  }
}

# Alert policy for failed login attempts
resource "google_monitoring_alert_policy" "failed_login_alert" {
  display_name = "Excessive Failed Login Attempts"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Failed logins > 10/min"
    
    condition_threshold {
      filter          = "resource.type=\\"cloud_run_revision\\" AND metric.type=\\"logging.googleapis.com/user/failed_login\\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.security_email.id]
}

# Notification channel
resource "google_monitoring_notification_channel" "security_email" {
  display_name = "Security Team Email"
  project      = var.project_id
  type         = "email"
  
  labels = {
    email_address = var.security_email
  }
}
`;

/**
 * Deployment commands
 */
export const DEPLOYMENT_COMMANDS = `
# 1. Deploy Cloud Armor policy
gcloud compute security-policies create drishtix-security-policy \\
  --description="DrishtiX Event Safety Platform Security Policy"

# 2. Add SQL injection rule
gcloud compute security-policies rules create 1000 \\
  --security-policy=drishtix-security-policy \\
  --expression="evaluatePreconfiguredExpr('sqli-stable')" \\
  --action=deny-403

# 3. Add XSS rule
gcloud compute security-policies rules create 1100 \\
  --security-policy=drishtix-security-policy \\
  --expression="evaluatePreconfiguredExpr('xss-stable')" \\
  --action=deny-403

# 4. Add rate limiting rule
gcloud compute security-policies rules create 2000 \\
  --security-policy=drishtix-security-policy \\
  --expression="request.path.matches('/api/.*')" \\
  --action=rate-based-ban \\
  --rate-limit-threshold-count=100 \\
  --rate-limit-threshold-interval-sec=60 \\
  --ban-duration-sec=600 \\
  --conform-action=allow \\
  --exceed-action=deny-429 \\
  --enforce-on-key=IP

# 5. Attach to backend service
gcloud compute backend-services update drishtix-backend \\
  --security-policy=drishtix-security-policy \\
  --global

# 6. Enable Cloud Armor logging
gcloud compute backend-services update drishtix-backend \\
  --enable-logging \\
  --logging-sample-rate=1.0 \\
  --global

# 7. Create VPC network
gcloud compute networks create drishtix-vpc \\
  --subnet-mode=custom \\
  --bgp-routing-mode=regional

# 8. Create private subnet
gcloud compute networks subnets create drishtix-private-subnet \\
  --network=drishtix-vpc \\
  --region=us-central1 \\
  --range=10.0.0.0/24 \\
  --enable-private-ip-google-access

# 9. Verify security policy
gcloud compute security-policies describe drishtix-security-policy

# 10. Monitor security events
gcloud logging read "resource.type=http_load_balancer AND jsonPayload.enforcedSecurityPolicy.name=drishtix-security-policy" \\
  --limit=50 \\
  --format=json
`;
