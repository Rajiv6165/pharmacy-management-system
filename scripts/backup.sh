#!/bin/bash
# Pharmacy Database Backup Script
set -e

# Make sure DATABASE_URL is set (from environment)
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set." >&2
  exit 1
fi

# Set backup directory (relative to script or absolute)
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename using current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pharmacy_db_backup_$TIMESTAMP.sql"

echo "Starting database backup at $(date)..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress the backup file to save space
gzip "$BACKUP_FILE"
echo "Database backup completed successfully: $BACKUP_FILE.gz"

# Keep only the last 7 days of backups to avoid exhausting disk space
echo "Cleaning up backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "pharmacy_db_backup_*.sql.gz" -mtime +7 -delete
echo "Cleanup done."
