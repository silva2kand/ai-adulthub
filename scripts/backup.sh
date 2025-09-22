#!/bin/bash

# Adult Video Aggregator - Automated Backup Script
# This script creates daily backups of the database and uploads to S3
# Usage: ./backup.sh [manual|cron]

set -e  # Exit on any error

# Configuration
DB_NAME="adult_aggregator"
DB_USER="postgres"
DB_HOST="${DB_HOST:-localhost}"
S3_BUCKET="${S3_BUCKET:-adult-video-backups}"
S3_REGION="${S3_REGION:-us-east-1}"
BACKUP_RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/backups"
LOG_FILE="/var/log/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

# Error handler
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Check dependencies
check_dependencies() {
    log "INFO" "Checking dependencies..."
    
    if ! command -v pg_dump &> /dev/null; then
        error_exit "pg_dump not found. Please install PostgreSQL client."
    fi
    
    if ! command -v aws &> /dev/null; then
        error_exit "AWS CLI not found. Please install AWS CLI."
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        error_exit "AWS CLI not configured. Please run 'aws configure'."
    fi
    
    log "INFO" "All dependencies satisfied."
}

# Create backup directory
create_backup_dir() {
    log "INFO" "Creating backup directory..."
    mkdir -p "${BACKUP_DIR}"
}

# Database backup
backup_database() {
    local backup_file="${BACKUP_DIR}/db_backup_${DATE}.dump"
    local compressed_file="${backup_file}.gz"
    
    log "INFO" "Starting database backup..."
    
    # Create database dump
    if ! pg_dump -Fc -h "${DB_HOST}" -U "${DB_USER}" "${DB_NAME}" > "${backup_file}"; then
        error_exit "Database backup failed"
    fi
    
    # Compress the backup
    if ! gzip "${backup_file}"; then
        error_exit "Backup compression failed"
    fi
    
    log "INFO" "Database backup completed: ${compressed_file}"
    echo "${compressed_file}"
}

# Upload to S3
upload_to_s3() {
    local file_path=$1
    local s3_key="backups/database/$(basename ${file_path})"
    
    log "INFO" "Uploading backup to S3..."
    
    # Upload to primary region
    if ! aws s3 cp "${file_path}" "s3://${S3_BUCKET}/${s3_key}" --region "${S3_REGION}"; then
        error_exit "Failed to upload backup to S3"
    fi
    
    # Upload to secondary region for disaster recovery
    local secondary_region="eu-west-1"
    if ! aws s3 cp "${file_path}" "s3://${S3_BUCKET}-${secondary_region}/${s3_key}" --region "${secondary_region}"; then
        log "WARN" "Failed to upload backup to secondary region ${secondary_region}"
    fi
    
    log "INFO" "Backup uploaded successfully"
}

# Cleanup old backups from S3
cleanup_old_backups() {
    log "INFO" "Cleaning up old backups..."
    
    # Calculate cutoff date
    local cutoff_date=$(date -d "${BACKUP_RETENTION_DAYS} days ago" '+%Y%m%d')
    
    # List and delete old backups
    aws s3 ls "s3://${S3_BUCKET}/backups/database/" --region "${S3_REGION}" | \
    awk '{print $4}' | \
    grep -E 'db_backup_[0-9]{8}_[0-9]{6}\.dump\.gz' | \
    while read -r backup_file; do
        # Extract date from filename
        if [[ $backup_file =~ db_backup_([0-9]{8})_ ]]; then
            local backup_date="${BASH_REMATCH[1]}"
            
            if [[ $backup_date -lt $cutoff_date ]]; then
                log "INFO" "Deleting old backup: ${backup_file}"
                aws s3 rm "s3://${S3_BUCKET}/backups/database/${backup_file}" --region "${S3_REGION}"
            fi
        fi
    done
}

# Cleanup local files
cleanup_local() {
    local file_path=$1
    
    log "INFO" "Cleaning up local backup file..."
    rm -f "${file_path}"
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    log "INFO" "Verifying backup integrity..."
    
    # Check if file exists and is not empty
    if [[ ! -s "${backup_file}" ]]; then
        error_exit "Backup file is empty or does not exist"
    fi
    
    # Test gunzip can read the file
    if ! gunzip -t "${backup_file}"; then
        error_exit "Backup file is corrupted"
    fi
    
    log "INFO" "Backup integrity verified"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Send to Slack webhook if configured
    if [[ -n "${SLACK_WEBHOOK_URL}" ]]; then
        local color="good"
        if [[ "${status}" == "error" ]]; then
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"${color}\",\"text\":\"${message}\"}]}" \
            "${SLACK_WEBHOOK_URL}"
    fi
    
    # Send email if configured
    if [[ -n "${EMAIL_TO}" ]]; then
        echo "${message}" | mail -s "Backup ${status}" "${EMAIL_TO}"
    fi
}

# Main backup function
main() {
    local run_mode=${1:-cron}
    
    log "INFO" "Starting backup process (mode: ${run_mode})"
    
    # Check if another backup is running
    local lock_file="/tmp/backup.lock"
    if [[ -f "${lock_file}" ]]; then
        error_exit "Another backup process is already running"
    fi
    
    # Create lock file
    echo $$ > "${lock_file}"
    
    # Cleanup lock file on exit
    trap "rm -f ${lock_file}" EXIT
    
    try {
        check_dependencies
        create_backup_dir
        
        # Create database backup
        local backup_file=$(backup_database)
        
        # Verify backup
        verify_backup "${backup_file}"
        
        # Upload to S3
        upload_to_s3 "${backup_file}"
        
        # Cleanup old backups
        cleanup_old_backups
        
        # Cleanup local file
        cleanup_local "${backup_file}"
        
        local success_message="Backup completed successfully at $(date)"
        log "INFO" "${success_message}"
        
        if [[ "${run_mode}" == "cron" ]]; then
            send_notification "success" "${success_message}"
        fi
        
    } catch {
        local error_message="Backup failed: $1"
        log "ERROR" "${error_message}"
        
        send_notification "error" "${error_message}"
        exit 1
    }
}

# Restore function
restore() {
    local backup_date=$1
    local restore_db_name=${2:-"${DB_NAME}_restored"}
    
    if [[ -z "${backup_date}" ]]; then
        echo "Usage: $0 restore YYYYMMDD_HHMMSS [restore_db_name]"
        exit 1
    fi
    
    local backup_file="db_backup_${backup_date}.dump.gz"
    local s3_key="backups/database/${backup_file}"
    local local_file="${BACKUP_DIR}/${backup_file}"
    
    log "INFO" "Starting restore process for backup: ${backup_date}"
    
    # Download backup from S3
    aws s3 cp "s3://${S3_BUCKET}/${s3_key}" "${local_file}" --region "${S3_REGION}"
    
    # Decompress
    gunzip "${local_file}"
    local decompressed_file="${local_file%.gz}"
    
    # Create new database
    createdb -h "${DB_HOST}" -U "${DB_USER}" "${restore_db_name}"
    
    # Restore data
    pg_restore -h "${DB_HOST}" -U "${DB_USER}" -d "${restore_db_name}" "${decompressed_file}"
    
    # Cleanup
    rm -f "${decompressed_file}"
    
    log "INFO" "Restore completed successfully to database: ${restore_db_name}"
}

# List available backups
list_backups() {
    log "INFO" "Available backups:"
    aws s3 ls "s3://${S3_BUCKET}/backups/database/" --region "${S3_REGION}" | \
    grep 'db_backup_' | \
    awk '{print $4, $1, $2}' | \
    sort -r
}

# Help function
show_help() {
    cat << EOF
Adult Video Aggregator Backup Script

Usage:
    $0 [backup|restore|list|help] [options]

Commands:
    backup          Create and upload database backup (default)
    restore DATE    Restore database from backup (format: YYYYMMDD_HHMMSS)
    list           List available backups
    help           Show this help message

Environment Variables:
    DB_HOST         Database host (default: localhost)
    S3_BUCKET       S3 bucket name (default: adult-video-backups)
    S3_REGION       S3 region (default: us-east-1)
    SLACK_WEBHOOK_URL   Slack webhook for notifications
    EMAIL_TO        Email address for notifications

Examples:
    $0 backup
    $0 restore 20231221_143000
    $0 list
EOF
}

# Exception handling
try() {
    local cmd="$@"
    eval "$cmd"
}

catch() {
    return $?
}

# Main script logic
case "${1:-backup}" in
    backup)
        main "${2:-cron}"
        ;;
    restore)
        restore "$2" "$3"
        ;;
    list)
        list_backups
        ;;
    help)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac