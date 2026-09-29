#!/usr/bin/env bash
# ==============================================================================
# KaizenBros Dialysis Centre - Production MySQL Restore Script
# CAUTION: This will restore database state from a verified backup snapshot.
# ==============================================================================

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 /path/to/backup_file.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE does not exist."
    exit 1
fi

ENV_FILE="/var/www/kaizenbros/.env"
DB_DATABASE=$(grep "^DB_DATABASE=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')
DB_USERNAME=$(grep "^DB_USERNAME=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')
DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')
DB_HOST=$(grep "^DB_HOST=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"')

echo "=========================================================="
echo "WARNING: Restoring will overwrite current database: $DB_DATABASE"
echo "Backup File: $BACKUP_FILE"
echo "=========================================================="
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Restore aborted by operator."
    exit 0
fi

echo "Restoring database from compressed snapshot..."
gunzip -c "$BACKUP_FILE" | mysql \
    --host="${DB_HOST:-127.0.0.1}" \
    --user="${DB_USERNAME}" \
    --password="${DB_PASSWORD}" \
    "${DB_DATABASE}"

echo "Database restore completed successfully."
