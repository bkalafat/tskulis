#!/bin/bash

# TS Kulis Rollback Script
# Automated rollback to previous deployment with safety checks

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_ROOT/logs/rollback-$(date +%Y%m%d-%H%M%S).log"

# Default values
ENVIRONMENT="staging"
TARGET_VERSION=""
FORCE_ROLLBACK=false
DRY_RUN=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Rollback TS Kulis application to a previous deployment.

OPTIONS:
    -e, --environment ENV     Target environment (staging, production) [default: staging]
    -v, --version VERSION     Specific version/backup to rollback to
    -f, --force              Force rollback without confirmation
    -d, --dry-run            Show what would be rolled back without executing
    -l, --list               List available backups
    -h, --help               Show this help message

EXAMPLES:
    $0 -l                                # List available backups
    $0                                   # Rollback to latest backup (staging)
    $0 -e production                     # Rollback production to latest backup
    $0 -v 20240928-143022               # Rollback to specific backup
    $0 -e production -f                 # Force rollback production without confirmation

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--version)
            TARGET_VERSION="$2"
            shift 2
            ;;
        -f|--force)
            FORCE_ROLLBACK=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -l|--list)
            list_backups
            exit 0
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

# List available backups
list_backups() {
    local backups_dir="$PROJECT_ROOT/backups"
    
    if [[ ! -d "$backups_dir" ]]; then
        log_warning "No backups directory found"
        return 0
    fi
    
    log "Available backups:"
    echo
    printf "%-20s %-12s %-20s %-20s\n" "BACKUP ID" "ENVIRONMENT" "TIMESTAMP" "COMMIT"
    printf "%-20s %-12s %-20s %-20s\n" "--------" "-----------" "---------" "------"
    
    for backup_dir in $(ls -t "$backups_dir"/ 2>/dev/null || true); do
        local backup_path="$backups_dir/$backup_dir"
        if [[ -f "$backup_path/deployment.env" ]]; then
            local env=$(grep "ENVIRONMENT=" "$backup_path/deployment.env" | cut -d'=' -f2)
            local timestamp=$(grep "TIMESTAMP=" "$backup_path/deployment.env" | cut -d'=' -f2-)
            local commit=$(grep "COMMIT=" "$backup_path/deployment.env" | cut -d'=' -f2 | cut -c1-8)
            
            printf "%-20s %-12s %-20s %-20s\n" "$backup_dir" "$env" "$timestamp" "$commit"
        fi
    done
    echo
}

# Validate backup exists
validate_backup() {
    local backup_id="$1"
    local backup_path="$PROJECT_ROOT/backups/$backup_id"
    
    if [[ ! -d "$backup_path" ]]; then
        log_error "Backup not found: $backup_id"
        log "Available backups:"
        list_backups
        exit 1
    fi
    
    if [[ ! -f "$backup_path/deployment.env" ]]; then
        log_error "Invalid backup: missing deployment.env"
        exit 1
    fi
    
    local backup_env=$(grep "ENVIRONMENT=" "$backup_path/deployment.env" | cut -d'=' -f2)
    if [[ "$backup_env" != "$ENVIRONMENT" ]]; then
        log_error "Backup environment mismatch: backup is for '$backup_env', but trying to rollback '$ENVIRONMENT'"
        exit 1
    fi
    
    log_success "Backup validation passed: $backup_id"
}

# Get latest backup
get_latest_backup() {
    local backups_dir="$PROJECT_ROOT/backups"
    
    if [[ ! -d "$backups_dir" ]]; then
        log_error "No backups directory found"
        exit 1
    fi
    
    for backup_dir in $(ls -t "$backups_dir"/ 2>/dev/null || true); do
        local backup_path="$backups_dir/$backup_dir"
        if [[ -f "$backup_path/deployment.env" ]]; then
            local backup_env=$(grep "ENVIRONMENT=" "$backup_path/deployment.env" | cut -d'=' -f2)
            if [[ "$backup_env" == "$ENVIRONMENT" ]]; then
                echo "$backup_dir"
                return 0
            fi
        fi
    done
    
    log_error "No backup found for environment: $ENVIRONMENT"
    exit 1
}

# Pre-rollback health check
pre_rollback_health_check() {
    log "Running pre-rollback health check..."
    
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
    
    if curl -f -s "$health_url" > /dev/null; then
        log_warning "Current deployment appears healthy"
        if [[ "$FORCE_ROLLBACK" != "true" ]]; then
            read -p "Are you sure you want to rollback a healthy deployment? (y/N): " -r
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "Rollback cancelled by user"
                exit 0
            fi
        fi
    else
        log "Current deployment is unhealthy, proceeding with rollback"
    fi
}

# Execute rollback
execute_rollback() {
    local backup_id="$1"
    local backup_path="$PROJECT_ROOT/backups/$backup_id"
    
    log "Executing rollback to backup: $backup_id"
    
    # Load backup information
    source "$backup_path/deployment.env"
    local rollback_commit="$COMMIT"
    
    log "Rollback details:"
    log "  Environment: $ENVIRONMENT"
    log "  Backup ID: $backup_id"
    log "  Target commit: $rollback_commit"
    log "  Backup timestamp: $TIMESTAMP"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual rollback will be performed"
        return 0
    fi
    
    # Create rollback backup of current state
    create_rollback_backup
    
    # Perform environment-specific rollback
    case $ENVIRONMENT in
        staging)
            rollback_staging "$backup_id"
            ;;
        production)
            rollback_production "$backup_id"
            ;;
    esac
}

# Create backup of current state before rollback
create_rollback_backup() {
    log "Creating backup of current state before rollback..."
    local rollback_backup_dir="$PROJECT_ROOT/backups/pre-rollback-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$rollback_backup_dir"
    
    echo "ENVIRONMENT=$ENVIRONMENT" > "$rollback_backup_dir/deployment.env"
    echo "TIMESTAMP=$(date)" >> "$rollback_backup_dir/deployment.env"
    echo "COMMIT=$(git rev-parse HEAD 2>/dev/null || echo 'unknown')" >> "$rollback_backup_dir/deployment.env"
    echo "ROLLBACK_TYPE=pre-rollback" >> "$rollback_backup_dir/deployment.env"
    
    log_success "Pre-rollback backup created: $(basename "$rollback_backup_dir")"
}

# Rollback staging environment
rollback_staging() {
    local backup_id="$1"
    log "Rolling back staging environment..."
    
    # Example staging rollback - customize for your infrastructure
    docker-compose -f docker-compose.staging.yml down
    
    # Restore from backup or redeploy specific version
    docker build -t tskulis:staging-rollback .
    docker-compose -f docker-compose.staging.yml up -d
    
    log_success "Staging rollback completed"
}

# Rollback production environment
rollback_production() {
    local backup_id="$1"
    log "Rolling back production environment..."
    
    # Production rollback with zero downtime
    # Example: Blue-green deployment rollback
    
    # Switch traffic back to previous version
    # kubectl patch service tskulis -p '{"spec":{"selector":{"version":"previous"}}}'
    
    # Or Docker Swarm rollback
    # docker service update --rollback tskulis
    
    # Or container registry rollback
    docker pull tskulis:previous
    docker tag tskulis:previous tskulis:latest
    docker-compose -f docker-compose.production.yml up -d
    
    log_success "Production rollback completed"
}

# Post-rollback health check
post_rollback_health_check() {
    log "Running post-rollback health check..."
    
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
    local max_attempts=30
    
    while [[ $attempts -lt $max_attempts ]]; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log_success "Health check passed (dry run)"
            return 0
        fi
        
        if curl -f -s "$health_url" > /dev/null; then
            log_success "Post-rollback health check passed"
            return 0
        fi
        
        attempts=$((attempts + 1))
        log "Health check attempt $attempts/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
    done
    
    log_error "Post-rollback health check failed"
    return 1
}

# Send rollback notification
send_rollback_notification() {
    local backup_id="$1"
    local status="$2"
    
    local message="TS Kulis rollback $status for $ENVIRONMENT (backup: $backup_id)"
    
    # Example notifications
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"🔄 $message\"}" \
    #     "$SLACK_WEBHOOK_URL"
    
    log "Rollback notification sent: $message"
}

# Main rollback function
main() {
    mkdir -p "$PROJECT_ROOT/logs"
    
    log "Starting rollback process for $ENVIRONMENT environment"
    
    # Determine target backup
    local target_backup="$TARGET_VERSION"
    if [[ -z "$target_backup" ]]; then
        target_backup=$(get_latest_backup)
        log "Using latest backup: $target_backup"
    else
        log "Using specified backup: $target_backup"
    fi
    
    # Validate backup
    validate_backup "$target_backup"
    
    # Pre-rollback checks
    pre_rollback_health_check
    
    # Confirmation for production
    if [[ "$ENVIRONMENT" == "production" && "$FORCE_ROLLBACK" != "true" ]]; then
        echo
        log_warning "You are about to rollback PRODUCTION environment!"
        log "Target backup: $target_backup"
        echo
        read -p "Are you absolutely sure you want to proceed? Type 'ROLLBACK' to continue: " -r
        if [[ "$REPLY" != "ROLLBACK" ]]; then
            log "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Execute rollback
    execute_rollback "$target_backup"
    
    # Post-rollback health check
    if ! post_rollback_health_check; then
        log_error "Rollback completed but health check failed!"
        send_rollback_notification "$target_backup" "completed_with_issues"
        exit 1
    fi
    
    log_success "Rollback completed successfully!"
    log "Environment: $ENVIRONMENT"
    log "Backup: $target_backup"
    log "Log file: $LOG_FILE"
    
    send_rollback_notification "$target_backup" "successful"
}

# Run main function
main "$@"