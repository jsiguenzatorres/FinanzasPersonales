#!/usr/bin/env bash
# ===========================================================================
# FlowFinance — Bootstrap del VPS Hostinger (correr UNA vez al inicio)
# Ubuntu 24.04 LTS. Ejecutar como root o con sudo.
# Uso: curl -fsSL <url-raw>/vps/scripts/bootstrap-vps.sh | bash -s -- flowfinance.app
# ===========================================================================
set -euo pipefail

DOMAIN="${1:-flowfinance.app}"
EMAIL="${2:-admin@$DOMAIN}"
DEPLOY_USER="${3:-flowfinance}"

echo "🔧 Bootstrap VPS para $DOMAIN"

# 1. Actualizar sistema
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git ufw fail2ban htop ca-certificates gnupg

# 2. Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 3. Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Usuario de deploy (sin root)
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash -G docker,sudo "$DEPLOY_USER"
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose" > "/etc/sudoers.d/$DEPLOY_USER"
fi

# 5. Clonar repo
REPO_DIR="/opt/flowfinance"
if [ ! -d "$REPO_DIR" ]; then
  mkdir -p "$REPO_DIR"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$REPO_DIR"
  echo "⚠️  Configura la deploy key SSH y clona manualmente:"
  echo "    sudo -u $DEPLOY_USER git clone git@github.com:<owner>/flowfinance.git $REPO_DIR"
fi

# 6. Certbot inicial (modo standalone para emitir primer cert)
apt-get install -y certbot
mkdir -p /var/www/certbot

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "🔐 Emitiendo certificado SSL para $DOMAIN..."
  certbot certonly --standalone \
    --non-interactive --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "app.$DOMAIN" \
    -d "www.$DOMAIN"
fi

# 7. SSH hardening
sed -i 's/^#*PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh

# 8. Habilitar fail2ban
systemctl enable fail2ban && systemctl start fail2ban

echo "✅ Bootstrap completado"
echo "Próximos pasos:"
echo "  1. sudo -u $DEPLOY_USER -i"
echo "  2. ssh-keygen -t ed25519 -C 'flowfinance-deploy'"
echo "  3. Agrega la pubkey a GitHub repo → Settings → Deploy keys"
echo "  4. git clone git@github.com:<owner>/flowfinance.git $REPO_DIR"
echo "  5. Crea $REPO_DIR/.env.production con secrets reales"
echo "  6. cd $REPO_DIR && docker compose -f vps/docker-compose.yml up -d"
