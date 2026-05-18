#!/usr/bin/env bash
# FortuneEssence – Zero-downtime deploy script
# Run from your LOCAL machine after a successful build.
# Usage: bash deploy/deploy.sh <vps-host>
# Example: bash deploy/deploy.sh root@123.45.67.89
set -euo pipefail

VPS="${1:?Usage: $0 <user@vps-host>}"
APP_DIR="/var/app/fortune-essence"
APP_USER="fortune"

echo "==> Building SvelteKit app"
cd "$(dirname "$0")/.."
npm run build

echo "==> Syncing build to VPS"
rsync -avz --delete \
  build/ \
  "$VPS:$APP_DIR/build/"

echo "==> Syncing config files"
rsync -avz \
  package.json \
  ecosystem.config.cjs \
  "$VPS:$APP_DIR/"

echo "==> Installing production dependencies on VPS"
ssh "$VPS" "cd $APP_DIR && npm ci --omit=dev"

echo "==> Reloading PM2 (zero-downtime)"
ssh "$VPS" "sudo -u $APP_USER pm2 reload fortune-essence --update-env"

echo ""
echo "✅ Deploy complete. Check logs: ssh $VPS 'sudo -u $APP_USER pm2 logs fortune-essence --lines 50'"
