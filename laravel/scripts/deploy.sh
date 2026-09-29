#!/usr/bin/env bash
# ==============================================================================
# KaizenBros Dialysis Centre - Production Zero-Downtime Deployment Script
# Future Updates Workflow:
# Developer -> GitHub -> Pull / Deploy -> Production Server -> Laravel Update ->
# Laravel Migration (MySQL intact) -> Cache -> Nginx / FPM Reload
# ==============================================================================

set -euo pipefail

DEPLOY_DIR="/var/www/kaizenbros"
BRANCH="main"

echo "=== [1/6] Navigating to deployment directory ==="
cd "$DEPLOY_DIR"

echo "=== [2/6] Enabling Maintenance Mode ==="
php artisan down --render="errors::503" --secret="kaizen-deploy-bypass-token" || true

echo "=== [3/6] Pulling Latest Production Code from GitHub ==="
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "=== [4/6] Installing PHP & Node Dependencies ==="
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev
npm ci --prefer-offline --no-audit
npm run build

echo "=== [5/6] Running Safe Database Migrations (MySQL Remains Intact) ==="
php artisan migrate --force

echo "=== [6/6] Optimizing Laravel Configuration & Route Caches ==="
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "=== Restarting Queue Workers & Reloading PHP-FPM ==="
php artisan queue:restart
systemctl reload php8.3-fpm
systemctl reload nginx

echo "=== Disabling Maintenance Mode ==="
php artisan up

echo "=== KaizenBros Deployment Completed Successfully! ==="
