#!/bin/bash
# Deploy latest code to VPS
# Usage: bash vps/deploy.sh [VPS_IP]

set -euo pipefail
VPS_IP=${1:-${VPS_HOST:?Set VPS_HOST env var}}
VPS_USER=${VPS_USER:-medic}
APP_DIR="/opt/medic-platform"

echo "Deploying to $VPS_USER@$VPS_IP..."

ssh "$VPS_USER@$VPS_IP" << 'REMOTE'
set -euo pipefail
cd /opt/medic-platform

echo ">>> Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo ">>> Checking disk space..."
USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
[ "$USAGE" -gt 90 ] && echo "WARNING: Disk ${USAGE}% full" && exit 1

echo ">>> Building and restarting..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

echo ">>> Waiting 30s for services..."
sleep 30

echo ">>> Service status:"
docker compose -f docker-compose.prod.yml ps

echo ">>> Gateway health:"
curl -sf http://localhost:8080/actuator/health | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print('Status:', d.get('status','?'))" \
  || echo "Gateway not responding yet"

echo ">>> Pruning old images..."
docker image prune -f --filter "until=24h" 2>/dev/null || true

echo ">>> Deploy complete: $(date)"
REMOTE