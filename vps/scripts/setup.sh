#!/bin/bash
# M.E.D.I.C. VPS Setup Script
# Usage: sudo bash vps/setup.sh
# Tested on: Ubuntu 22.04 LTS

set -euo pipefail
DOMAIN=${DOMAIN:-medic.health}
EMAIL=${EMAIL:-admin@medic.health}
DEPLOY_USER=${DEPLOY_USER:-medic}

echo "================================================================"
echo " M.E.D.I.C. VPS Setup — $DOMAIN"
echo "================================================================"

# ── System update ────────────────────────────────────────────────
apt-get update -qq && apt-get upgrade -y -qq

# ── Install dependencies ─────────────────────────────────────────
apt-get install -y -qq \
    curl wget git ufw fail2ban \
    ca-certificates gnupg lsb-release \
    certbot python3-certbot-nginx

# ── Docker ───────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# ── Create deploy user ───────────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
    usermod -aG docker "$DEPLOY_USER"
    mkdir -p /home/$DEPLOY_USER/.ssh
    # Copy your public key here (optional – uncomment the next line)
    # echo "ssh-rsa AAAA..." >> /home/$DEPLOY_USER/.ssh/authorized_keys
    chmod 700 /home/$DEPLOY_USER/.ssh
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker compose" \
        >> /etc/sudoers.d/$DEPLOY_USER
fi

# ── Clone repo ───────────────────────────────────────────────────
APP_DIR="/opt/medic-platform"
if [ ! -d "$APP_DIR" ]; then
    git clone https://github.com/Byron-games/medic-platform.git "$APP_DIR"
fi
chown -R $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"

# ── Firewall ─────────────────────────────────────────────────────
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo "Firewall configured"

# ── fail2ban ─────────────────────────────────────────────────────
cat > /etc/fail2ban/jail.local << 'F2B'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
backend  = systemd

[sshd]
enabled = true
port    = 22
F2B
systemctl enable fail2ban
systemctl restart fail2ban

# ── SSH hardening ────────────────────────────────────────────────
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/'  /etc/ssh/sshd_config
sed -i 's/X11Forwarding yes/X11Forwarding no/'                    /etc/ssh/sshd_config
echo "PermitRootLogin no" >> /etc/ssh/sshd_config
systemctl reload sshd

# ── SSL certificate (self-signed placeholder) ────────────────────
mkdir -p "$APP_DIR/nginx/ssl"
if [ ! -f "$APP_DIR/nginx/ssl/fullchain.pem" ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$APP_DIR/nginx/ssl/privkey.pem" \
        -out "$APP_DIR/nginx/ssl/fullchain.pem" \
        -subj "/CN=$DOMAIN"
    echo "Self-signed cert created. Run certbot after DNS is configured."
fi

# ── Systemd service for auto-restart ─────────────────────────────
cat > /etc/systemd/system/medic-platform.service << SVC
[Unit]
Description=M.E.D.I.C. Healthcare Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d --build
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
User=$DEPLOY_USER
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SVC

systemctl daemon-reload
systemctl enable medic-platform

echo ""
echo "================================================================"
echo " Setup complete!"
echo ""
echo " Next steps:"
echo " 1. Copy .env.production to $APP_DIR/.env"
echo " 2. Point DNS: $DOMAIN -> $(curl -s ifconfig.me)"
echo " 3. Get real SSL: certbot --nginx -d $DOMAIN -m $EMAIL"
echo " 4. Deploy: cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d"
echo "================================================================"
