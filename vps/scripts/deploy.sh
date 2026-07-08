#!/usr/bin/env bash
# ===========================================================================
# FlowFinance — Deploy script para VPS Hostinger
# Llamado por GitHub Actions al hacer merge a main.
# Local: bash vps/scripts/deploy.sh
# ===========================================================================
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/flowfinance}"
TAG="${1:-latest}"

echo "🚀 FlowFinance deploy → tag=$TAG"

cd "$REPO_DIR"

# Pull código nuevo
git fetch origin main
git reset --hard origin/main

# Pull imagen Docker desde GHCR (publicada por CI)
docker compose -f vps/docker-compose.yml pull web

# Aplicar migraciones Supabase si hay nuevas
if command -v supabase &>/dev/null; then
  echo "📦 Aplicando migraciones Supabase..."
  supabase db push --linked
fi

# Recrear contenedor con la nueva imagen
TAG="$TAG" docker compose -f vps/docker-compose.yml up -d web

# Esperar health check
echo "⏳ Esperando health check..."
for i in {1..30}; do
  if docker compose -f vps/docker-compose.yml ps web | grep -q "healthy"; then
    echo "✅ Web container healthy"
    break
  fi
  sleep 2
done

# Reload nginx (sin downtime)
docker compose -f vps/docker-compose.yml exec -T nginx nginx -s reload

# Limpiar imágenes viejas
docker image prune -f --filter "until=72h" || true

echo "✅ Deploy completado"
