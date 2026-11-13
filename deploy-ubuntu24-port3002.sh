#!/usr/bin/env bash
# ============================================================================
# BALLY JUTE MILL ERP - UBUNTU 24 LOCAL SERVER DEPLOYMENT SCRIPT (PORT 3002)
# Database: "production" (PostgreSQL BJCL + production.db)
# ============================================================================
set -e

echo "=== Installing Bally Jute Mill Production ERP on Ubuntu 24 (Port 3002) ==="
sudo apt-get update -y
sudo apt-get install -y build-essential python3 sqlite3 curl

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

npm install
npm run build

if command -v psql >/dev/null 2>&1; then
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'production'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE production;"
  if [ -f "production_postgres_schema.sql" ]; then
    sudo -u postgres psql -d production -f production_postgres_schema.sql || true
  fi
fi

if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 3002/tcp || true
fi

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

echo "=== Bally Jute Mill ERP is live 24/7 at http://192.168.1.6:3002 ==="
