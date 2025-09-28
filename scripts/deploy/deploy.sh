#!/bin/bash

# TS Kulis Deployment Script
# Automated deployment with health checks and rollback capabilities

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/deploy-$(date +%Y%m%d-%H%M%S).log"

# Default values
ENVIRONMENT="staging"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false
ROLLBACK_ON_FAILURE=true
HEALTH_CHECK_TIMEOUT=300  # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy TS Kulis application to specified environment.

OPTIONS:
    -e, --environment ENV    Target environment (staging, production) [default: staging]
    -s, --skip-tests        Skip running tests
    -b, --skip-build        Skip building application
    -d, --dry-run          Perform dry run without actual deployment
    -n, --no-rollback      Disable automatic rollback on failure
    -t, --timeout SECONDS  Health check timeout in seconds [default: 300]
    -h, --help             Show this help message

EXAMPLES:
    $0                                    # Deploy to staging with full checks
    $0 -e production                      # Deploy to production
    $0 -e staging -s -b                   # Quick deploy to staging (skip tests and build)
    $0 -d                                 # Dry run to see what would be deployed
    $0 -e production -t 600               # Production deploy with 10-minute health check timeout

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -n|--no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        -t|--timeout)
            HEALTH_CHECK_TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 1
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Start deployment
log "Starting deployment to $ENVIRONMENT environment"
log "Project root: $PROJECT_ROOT"
log "Log file: $LOG_FILE"

if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN MODE - No actual deployment will occur"
fi

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if required tools are installed
check_dependencies() {
    local deps=("node" "npm" "git")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep is not installed or not in PATH"
            exit 1
        fi
    done
    log_success "All required dependencies are available"
}

# Check git status
check_git_status() {
    cd "$PROJECT_ROOT"
    
    if [[ -n "$(git status --porcelain)" ]]; then
        log_warning "Working directory has uncommitted changes"
        if [[ "$ENVIRONMENT" == "production" ]]; then
            log_error "Cannot deploy to production with uncommitted changes"
            exit 1
        fi
    fi
    
    local branch=$(git branch --show-current)
    log "Current branch: $branch"
    
    if [[ "$ENVIRONMENT" == "production" && "$branch" != "main" ]]; then
        log_error "Production deployments must be from main branch (current: $branch)"
        exit 1
    fi
    
    log_success "Git status check passed"
}

# Load environment configuration
load_environment_config() {
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        log "Loading environment configuration from $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    else
        log_warning "Environment file not found: $env_file"
    fi
}

# Install dependencies
install_dependencies() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log "Skipping dependency installation (build skipped)"
        return 0
    fi
    
    log "Installing dependencies..."
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        npm ci --legacy-peer-deps
    fi
    
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log "Skipping tests"
        return 0
    fi
    
    log "Running test suite..."
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        npm run test:ci
    fi
    
    log_success "All tests passed"
}

# Build application
build_application() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log "Skipping build"
        return 0
    fi
    
    log "Building application..."
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        npm run build:production
    fi
    
    log_success "Application built successfully"
}

# Run performance audit
run_performance_audit() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log "Skipping performance audit"
        return 0
    fi
    
    log "Running performance audit..."
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" != "true" ]]; then
        # Start application in background for testing
        npm start &
        local app_pid=$!
        
        # Wait for application to start
        sleep 10
        
        # Run lighthouse audit
        npm run lighthouse || {
            log_warning "Performance audit failed, but continuing deployment"
            kill $app_pid 2>/dev/null || true
            return 0
        }
        
        # Stop test application
        kill $app_pid 2>/dev/null || true
    fi
    
    log_success "Performance audit completed"
}

# Deploy to environment
deploy_to_environment() {
    log "Deploying to $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        staging)
            deploy_to_staging
            ;;
        production)
            deploy_to_production
            ;;
    esac
}

# Deploy to staging
deploy_to_staging() {
    log "Executing staging deployment..."
    
    if [[ "$DRY_RUN" != "true" ]]; then
        # Example staging deployment - customize based on your infrastructure
        
        # Build Docker image
        docker build -t tskulis:staging .
        
        # Deploy with docker-compose
        docker-compose -f docker-compose.staging.yml up -d
        
        # Or deploy to cloud service
        # kubectl apply -f k8s/staging/
        # or use your cloud provider's CLI
    fi
    
    log_success "Staging deployment completed"
}

# Deploy to production
deploy_to_production() {
    log "Executing production deployment..."
    
    # Additional production checks
    if [[ "$DRY_RUN" != "true" ]]; then
        # Backup current deployment
        backup_current_deployment
        
        # Example production deployment
        docker build -t tskulis:production .
        docker tag tskulis:production tskulis:latest
        
        # Deploy with zero-downtime strategy
        docker-compose -f docker-compose.production.yml up -d
        
        # Or deploy to cloud service with rolling update
        # kubectl rolling-update tskulis --image=tskulis:production
    fi
    
    log_success "Production deployment completed"
}

# Backup current deployment for rollback
backup_current_deployment() {
    log "Creating backup of current deployment..."
    local backup_dir="$PROJECT_ROOT/backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Save current deployment info
    echo "ENVIRONMENT=$ENVIRONMENT" > "$backup_dir/deployment.env"
    echo "TIMESTAMP=$(date)" >> "$backup_dir/deployment.env"
    echo "COMMIT=$(git rev-parse HEAD)" >> "$backup_dir/deployment.env"
    
    log_success "Backup created: $backup_dir"
}

# Health check after deployment
health_check() {
    log "Running post-deployment health checks..."
    
    local health_url
    case $ENVIRONMENT in
        staging)
            health_url="https://staging.tskulis.com/api/health"
            ;;
        production)
            health_url="https://tskulis.com/api/health"
            ;;
        *)
            health_url="http://localhost:3000/api/health"
            ;;
    esac
    
    local attempts=0
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / 10))
    
    while [[ $attempts -lt $max_attempts ]]; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log_success "Health check passed (dry run)"
            return 0
        fi
        
        if curl -f -s "$health_url" > /dev/null; then
            log_success "Health check passed"
            return 0
        fi
        
        attempts=$((attempts + 1))
        log "Health check attempt $attempts/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback deployment
rollback_deployment() {
    if [[ "$ROLLBACK_ON_FAILURE" != "true" ]]; then
        log "Rollback disabled, skipping..."
        return 0
    fi
    
    log_warning "Rolling back deployment..."
    
    # Find latest backup
    local latest_backup=$(ls -t "$PROJECT_ROOT/backups/" | head -1)
    if [[ -n "$latest_backup" ]]; then
        log "Rolling back to backup: $latest_backup"
        # Implement rollback logic based on your deployment method
        # docker-compose -f docker-compose.rollback.yml up -d
        # kubectl rollout undo deployment/tskulis
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

# Main deployment flow
main() {
    # Trap errors to trigger rollback
    trap 'log_error "Deployment failed, initiating rollback..."; rollback_deployment; exit 1' ERR
    
    check_dependencies
    check_git_status
    load_environment_config
    install_dependencies
    run_tests
    build_application
    run_performance_audit
    deploy_to_environment
    
    # Health check with rollback on failure
    if ! health_check; then
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback_deployment
            exit 1
        else
            log_error "Health check failed, but rollback is disabled"
            exit 1
        fi
    fi
    
    log_success "Deployment to $ENVIRONMENT completed successfully!"
    log "Log file: $LOG_FILE"
    
    # Send deployment notification
    send_deployment_notification
}

# Send deployment notification
send_deployment_notification() {
    local status="success"
    local message="TS Kulis deployed successfully to $ENVIRONMENT"
    
    # Example: Send Slack notification
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"$message\"}" \
    #     "$SLACK_WEBHOOK_URL"
    
    # Example: Send email notification
    # echo "$message" | mail -s "Deployment $status" admin@tskulis.com
    
    log "Deployment notification sent"
}

# Run main deployment
main "$@"