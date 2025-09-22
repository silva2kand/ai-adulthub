#!/bin/bash

# Database backup script for S3
# Run daily via cron: 0 2 * * * /path/to/backup-db.sh

DB_HOST=${DB_HOST:-localhost}
DB_NAME=${DB_NAME:-adult_aggregator}
DB_USER=${DB_USER:-postgres}
S3_BUCKET=${S3_BUCKET:-my-backup-bucket}
BACKUP_DIR=/tmp/backups

mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=$BACKUP_DIR/${DB_NAME}_$TIMESTAMP.sql

# Dump database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/backups/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"