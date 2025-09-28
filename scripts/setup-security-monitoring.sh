#!/bin/bash

# Security and Monitoring Setup Script for TS Kulis
# Configures security policies, monitoring, and alerting

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Setup security scanning
setup_security_scanning() {
    log "Setting up security scanning tools..."
    
    # Install security dependencies
    cd "$PROJECT_ROOT"
    
    # Audit existing dependencies
    log "Running npm security audit..."
    npm audit --audit-level=moderate || log_warning "Security vulnerabilities detected"
    
    # Setup pre-commit hooks for security
    if command -v pre-commit &> /dev/null; then
        log "Setting up pre-commit hooks..."
        cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/trufflesecurity/trufflehog
    rev: main
    hooks:
      - id: trufflehog
        name: TruffleHog
        description: Detect secrets in your data
        entry: bash -c 'trufflehog git file://. --since-commit HEAD --only-verified --fail'
        language: system
        stages: ["commit", "push"]
  
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package.lock.json

  - repo: local
    hooks:
      - id: npm-audit
        name: NPM Security Audit
        entry: npm audit --audit-level high
        language: system
        pass_filenames: false
        stages: ["commit"]
EOF
        
        pre-commit install
        log "Pre-commit hooks configured"
    else
        log_warning "pre-commit not installed, skipping hook setup"
    fi
}

# Setup monitoring configuration
setup_monitoring() {
    log "Setting up monitoring configuration..."
    
    # Create monitoring configuration
    mkdir -p "$PROJECT_ROOT/monitoring"
    
    # Grafana dashboard configuration
    cat > "$PROJECT_ROOT/monitoring/grafana-dashboard.json" << EOF
{
  "dashboard": {
    "title": "TS Kulis Application Monitoring",
    "tags": ["tskulis", "nextjs", "performance"],
    "panels": [
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "http_request_duration_seconds_sum{job=\"tskulis\"} / http_request_duration_seconds_count{job=\"tskulis\"}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph", 
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"tskulis\",status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=\"tskulis\"}"
          }
        ]
      }
    ]
  }
}
EOF
    
    # Prometheus configuration
    cat > "$PROJECT_ROOT/monitoring/prometheus.yml" << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'tskulis'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF

    # Alert rules
    cat > "$PROJECT_ROOT/monitoring/alerts.yml" << EOF
groups:
  - name: tskulis.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          description: "Error rate is above 10% for 5 minutes"

      - alert: HighResponseTime
        expr: http_request_duration_seconds_sum / http_request_duration_seconds_count > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High response time
          description: "Average response time is above 2 seconds"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 512
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: High memory usage
          description: "Memory usage is above 512MB"

      - alert: ServiceDown
        expr: up{job="tskulis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Service is down
          description: "TS Kulis service is not responding"
EOF
    
    log "Monitoring configuration created"
}

# Setup log aggregation
setup_logging() {
    log "Setting up log aggregation..."
    
    mkdir -p "$PROJECT_ROOT/logging"
    
    # Fluentd configuration
    cat > "$PROJECT_ROOT/logging/fluent.conf" << EOF
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<filter **>
  @type record_transformer
  <record>
    hostname "#{Socket.gethostname}"
    service "tskulis"
    environment "#{ENV['NODE_ENV']}"
  </record>
</filter>

<match **>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
  logstash_prefix tskulis
  type_name _doc
</match>
EOF

    # Logrotate configuration
    cat > "$PROJECT_ROOT/logging/logrotate.conf" << EOF
/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nextjs nextjs
    postrotate
        /bin/kill -USR1 \$(cat /app/logs/nextjs.pid) 2>/dev/null || true
    endscript
}
EOF
    
    log "Log aggregation configuration created"
}

# Setup security headers
setup_security_headers() {
    log "Setting up security headers configuration..."
    
    mkdir -p "$PROJECT_ROOT/nginx"
    
    # Nginx security configuration
    cat > "$PROJECT_ROOT/nginx/security.conf" << EOF
# Security headers for TS Kulis
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com; frame-ancestors 'none';" always;

# HSTS (if using HTTPS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Remove server version
server_tokens off;
EOF

    # Nginx main configuration
    cat > "$PROJECT_ROOT/nginx/nginx.conf" << EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                   '\$status \$body_bytes_sent "\$http_referer" '
                   '"\$http_user_agent" "\$http_x_forwarded_for" '
                   'rt=\$request_time uct=\$upstream_connect_time '
                   'uht=\$upstream_header_time urt=\$upstream_response_time';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss 
               application/json application/xml;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/m;

    # Security configuration
    include /etc/nginx/security.conf;

    upstream app {
        server app:3000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name localhost;

        # Rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location /api/auth/ {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location / {
            proxy_pass http://app;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                proxy_pass http://app;
            }
        }

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://app/api/health;
        }

        # Block access to sensitive files
        location ~ /\.(env|git|svn) {
            deny all;
            return 404;
        }

        location ~ /\.(yml|yaml|json)$ {
            deny all;
            return 404;
        }
    }
}
EOF
    
    log "Security headers configuration created"
}

# Setup backup scripts
setup_backup_scripts() {
    log "Setting up backup scripts..."
    
    mkdir -p "$PROJECT_ROOT/scripts/backup"
    
    # Database backup script
    cat > "$PROJECT_ROOT/scripts/backup/backup-database.sh" << 'EOF'
#!/bin/bash

# Database backup script for TS Kulis
set -e

BACKUP_DIR="/app/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/tskulis}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

# Create backup
echo "Creating database backup..."
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
cd "$BACKUP_DIR"
tar -czf "backup_$DATE.tar.gz" "backup_$DATE"
rm -rf "backup_$DATE"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Database backup completed: backup_$DATE.tar.gz"
EOF

    # Application backup script
    cat > "$PROJECT_ROOT/scripts/backup/backup-app.sh" << 'EOF'
#!/bin/bash

# Application backup script for TS Kulis
set -e

BACKUP_DIR="/app/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="${APP_DIR:-/app}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

# Create application backup
echo "Creating application backup..."
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.next \
    --exclude=coverage \
    --exclude=logs \
    "$APP_DIR"

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Application backup completed: app_backup_$DATE.tar.gz"
EOF

    chmod +x "$PROJECT_ROOT/scripts/backup/"*.sh
    
    log "Backup scripts created"
}

# Setup environment validation
setup_environment_validation() {
    log "Setting up environment validation..."
    
    # Environment validation script
    cat > "$PROJECT_ROOT/scripts/validate-environment.js" << 'EOF'
/**
 * Environment Validation Script
 * Validates required environment variables and configuration
 */

const requiredEnvVars = {
  production: [
    'NODE_ENV',
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET'
  ],
  staging: [
    'NODE_ENV',
    'MONGODB_URI',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ],
  development: [
    'NODE_ENV',
    'MONGODB_URI'
  ]
};

function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  
  console.log(`Validating ${env} environment...`);
  
  const missing = [];
  const warnings = [];
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  // Check optional but recommended variables
  const recommended = [
    'NEXT_PUBLIC_GOOGLE_ANALYTICS',
    'SENTRY_DSN',
    'REDIS_URL'
  ];
  
  recommended.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  });
  
  // Validate URLs
  if (process.env.NEXTAUTH_URL && !isValidUrl(process.env.NEXTAUTH_URL)) {
    missing.push('NEXTAUTH_URL (invalid URL)');
  }
  
  if (process.env.MONGODB_URI && !isValidMongoUri(process.env.MONGODB_URI)) {
    missing.push('MONGODB_URI (invalid MongoDB URI)');
  }
  
  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Missing recommended environment variables:');
    warnings.forEach(varName => console.warn(`  - ${varName}`));
  }
  
  console.log('✅ Environment validation passed');
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidMongoUri(uri) {
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };
EOF
    
    log "Environment validation script created"
}

# Main setup function
main() {
    log "Starting security and monitoring setup for TS Kulis..."
    
    setup_security_scanning
    setup_monitoring
    setup_logging
    setup_security_headers
    setup_backup_scripts
    setup_environment_validation
    
    log "Security and monitoring setup completed!"
    log "Files created:"
    log "  - Security: .pre-commit-config.yaml, nginx/security.conf"
    log "  - Monitoring: monitoring/prometheus.yml, monitoring/alerts.yml"
    log "  - Logging: logging/fluent.conf, logging/logrotate.conf"
    log "  - Backup: scripts/backup/backup-*.sh"
    log "  - Validation: scripts/validate-environment.js"
    
    log_warning "Don't forget to:"
    log_warning "  1. Configure webhook URLs for notifications"
    log_warning "  2. Set up SSL certificates for production"
    log_warning "  3. Configure monitoring endpoints"
    log_warning "  4. Test backup and restore procedures"
}

# Run main function
main "$@"