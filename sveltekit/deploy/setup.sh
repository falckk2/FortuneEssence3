#!/usr/bin/env bash
# FortuneEssence – Strato VPS initial setup script
# Run once as root (or sudo) on a fresh Ubuntu 22.04 VPS.
# Usage: sudo bash setup.sh
set -euo pipefail

APP_USER="fortune"
APP_DIR="/var/app/fortune-essence"
LOG_DIR="/var/log/fortune-essence"
NODE_VERSION="20"

echo "==> Installing system packages"
apt-get update -qq
apt-get install -y -qq curl wget gnupg2 nginx certbot python3-certbot-nginx

echo "==> Installing Node.js $NODE_VERSION via NodeSource"
curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
apt-get install -y -qq nodejs

echo "==> Installing PM2 globally"
npm install -g pm2

echo "==> Creating app user: $APP_USER"
id "$APP_USER" &>/dev/null || useradd --system --shell /bin/bash --create-home "$APP_USER"

echo "==> Creating directories"
mkdir -p "$APP_DIR" "$LOG_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$LOG_DIR"

echo "==> Configuring PM2 startup"
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | tail -1 | bash

echo ""
echo "✅ Server setup complete."
echo ""
echo "Next steps:"
echo "  1. Upload your built app:  rsync -avz sveltekit/build/ $APP_USER@<vps>:$APP_DIR/build/"
echo "  2. Upload config files:    rsync -avz sveltekit/{package.json,ecosystem.config.cjs,.env} $APP_USER@<vps>:$APP_DIR/"
echo "  3. On the VPS, install production deps:"
echo "       cd $APP_DIR && npm ci --omit=dev"
echo "  4. Copy nginx config:"
echo "       cp nginx.conf /etc/nginx/sites-available/fortune-essence"
echo "       ln -s /etc/nginx/sites-available/fortune-essence /etc/nginx/sites-enabled/"
echo "       nginx -t && systemctl reload nginx"
echo "  5. Obtain TLS certificate:"
echo "       certbot --nginx -d yourdomain.se -d www.yourdomain.se"
echo "  6. Start the app:"
echo "       sudo -u $APP_USER pm2 start $APP_DIR/ecosystem.config.cjs"
echo "       sudo -u $APP_USER pm2 save"
echo "  7. Install crontab:"
echo "       sudo -u $APP_USER crontab crontab.example"
