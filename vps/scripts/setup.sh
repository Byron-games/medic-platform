#!/bin/bash
# M.E.D.I.C. VPS Setup Script
# Usage: DOMAIN=medic.health EMAIL=admin@medic.health bash setup.sh
# Tested on: Ubuntu 22.04 LTS (Hetzner CX21)
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN=your-domain.com}"
EMAIL="${EMAIL:?Set EMAIL=your-email@domain.com}"
APP_DIR="/opt/medic-platform"
REPO="https://github.com/Byron-games/medic-platform.git"

echo "=========================================="
echo "  M.E.D.I.C. VPS Setup"
echo "  Domain: $DOMAIN"
echo "=========================================="

# 1. System hardening
echo ">>> Hardening system..."
ufw --force enable
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
apt-get install -y fail2ban
systemctl enable fail2ban

# 2. Docker
echo ">>> Installing Docker..."
curl -fsSL https://get.docker.com | bash
systemctl enable docker

# 3. Clone repo
echo ">>> Cloning repository..."
git clone "$REPO" "$APP_DIR" || (cd "$APP_DIR" && git pull)
cd "$APP_DIR"

# 4. Generate secrets
echo ">>> Generating secrets..."
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
GRAFANA_PASSWORD=$(openssl rand -hex 12)

cat > .env << EOF
JWT_SECRET=$JWT_SECRET
DB_USER=medic
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
GRAFANA_USER=admin
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
JITSI_SERVER_URL=https://meet.jit.si
DOMAIN=$DOMAIN
ADMIN_EMAIL=$EMAIL
EOF
chmod 600 .env
echo "  -> .env created with secure random secrets"

# 5. Build and start
echo ">>> Building and starting services..."
docker compose up -d --build

# 6. Systemd service for auto-restart
cat > /etc/systemd/system/medic.service << EOF
[Unit]
Description=M.E.D.I.C. Platform
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
systemctl enable medic

# 7. Daily backup cron
echo ">>> Setting up daily backups..."
cat > /etc/cron.daily/medic-backup << 'CRONEOF'
#!/bin/bash
BACKUP_DIR="/opt/medic-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
docker exec medic-postgres pg_dumpall -U medic > "$BACKUP_DIR/medic_$TIMESTAMP.sql"
# Keep last 30 days
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
CRONEOF
chmod +x /etc/cron.daily/medic-backup

echo ""
echo "=========================================="
echo "  Setup complete!"
echo "  Platform: http://$DOMAIN"
echo "  Admin login: admin / Admin@123"
echo "  CHANGE THE DEFAULT PASSWORD IMMEDIATELY"
echo "=========================================="
