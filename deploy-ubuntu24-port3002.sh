#!/usr/bin/env bash
# ============================================================================
# BALLY JUTE MILL ERP - UBUNTU 24 LOCAL SERVER DEPLOYMENT SCRIPT (PORT 3002)
# Database: "production" (production.db)
# ============================================================================
set -e

echo "=== Installing Bally Jute Mill Production ERP on Ubuntu 24 (Port 3002) ==="
sudo apt-get update -y
sudo apt-get install -y build-essential python3 sqlite3 curl

# Install Node.js 22 LTS if not present
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

npm install --legacy-peer-deps
npm run build

# Open port 3002 on UFW if UFW is active
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 3002/tcp || true
fi

# Create systemd service on port 3002 so other web apps are never disturbed
SERVICE_FILE="/etc/systemd/system/bally-jute-production.service"
sudo bash -c "cat > $SERVICE_FILE" <<EOF
[Unit]
Description=Bally Jute Mill Production ERP (Port 3002)
After=network.target

[Service]
Type=simple
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3002
Environment=SECONDARY_PORT=3002
ExecStart=$(command -v npx) tsx server.ts
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable bally-jute-production.service
sudo systemctl restart bally-jute-production.service

echo "=== Bally Jute Mill ERP is live at http://192.168.1.6:3002 ==="
