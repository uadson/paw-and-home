#!/bin/bash
# Script de limpeza periódica de recursos não utilizados do Docker.
# Remove containers parados, redes não utilizadas, imagens órfãs (dangling) e cache de build.

set -euo pipefail

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Iniciando limpeza do Docker..."

# Remove containers com status exited
docker container prune -f

# Remove imagens dangling (sem tag)
docker image prune -f

# Remove redes não utilizadas
docker network prune -f

# Remove volumes órfãos
docker volume prune -f

# Opcional: remove cache de compilação com mais de 7 dias
docker builder prune -f --filter "until=168h"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Limpeza concluída com sucesso."
