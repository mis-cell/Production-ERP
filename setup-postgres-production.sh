#!/usr/bin/env bash
# ============================================================================
# BALLY JUTE MILL ERP - BEGINNER AUTO-SETUP FOR UBUNTU (192.168.1.6:3002)
# Safely creates "production" database in your existing PostgreSQL (BJCL)
# WITHOUT touching or disturbing "SQC" or "bjcl_db"!
# ============================================================================
set -e

echo "=================================================================="
echo " STEP 1: Installing Node.js & Build Tools (if needed)"
echo "=================================================================="
sudo apt-get update -y
sudo apt-get install -y build-essential python3 sqlite3 curl

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "=================================================================="
echo " STEP 2: Installing NPM Packages & Building Application"
echo "=================================================================="
npm install
npm run build

echo "=================================================================="
echo " STEP 3: Creating 'production' database in PostgreSQL (BJCL)"
echo " (Existing databases 'SQC' and 'bjcl_db' will NOT be touched)"
echo "=================================================================="
if command -v psql >/dev/null 2>&1; then
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'production'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE production;"
  echo "-> Database 'production' is ready!"
  if [ -f "production_postgres_schema.sql" ]; then
    sudo -u postgres psql -d production -f production_postgres_schema.sql
    echo "-> All 42 tables and fields created in PostgreSQL 'production'!"
  fi
fi

# Allow port 3002 on firewall if active
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 3002/tcp || true
fi

echo "=================================================================="
echo " STEP 4: Starting Server on http://192.168.1.6:3002"
echo "=================================================================="
PORT=3002 SECONDARY_PORT=3002 NODE_ENV=production npx tsx server.ts
