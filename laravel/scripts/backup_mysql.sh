#!/usr/bin/env bash
# ==============================================================================
# KaizenBros Dialysis Centre - Production MySQL Backup Script
# Retention: Daily backups, compressed gzip, encrypted off-site capable
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/var/backups/kaizenbros_mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/kaizenbros_prod_${TIMESTAMP}.sql.gz"
LOG_FILE="/var/log/kaizenbros_backup.log"

# Read DB credentials securely from Laravel .env
ENV_FILE="/var/www/kaizenbros/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "[$TIMESTAMP] ERROR: .env file not found at $ENV_FILE" >> "$LOG_FILE"
    exit 1
fi

DB_DATABASE=$(grep "^DB_DATABASE=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')
DB_USERNAME=$(grep "^DB_USERNAME=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')
DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')
DB_HOST=$(grep "^DB_HOST=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting automated MySQL backup for ${DB_DATABASE}..." >> "$LOG_FILE"

# Run mysqldump with single transaction for ACID consistency without table lock
mysqldump \
    --host="${DB_HOST:-127.0.0.1}" \
    --user="${DB_USERNAME}" \
    --password="${DB_PASSWORD}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --default-character-set=utf8mb4 \
    "${DB_DATABASE}" | gzip -9 > "${BACKUP_FILE}"

chmod 600 "${BACKUP_FILE}"

echo "[$TIMESTAMP] Backup completed successfully: ${BACKUP_FILE} ($(du -sh ${BACKUP_FILE} | cut -f1))" >> "$LOG_FILE"

# Rotate: Delete local backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
echo "[$TIMESTAMP] Rotation completed (retained 30 daily snapshots)." >> "$LOG_FILE"
