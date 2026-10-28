#!/usr/bin/env bash
# Uso: scripts/pdf/proposta.sh saida.pdf [dados.json]
set -euo pipefail
cd "$(dirname "$0")/../.."
node scripts/pdf/render.mjs scripts/pdf/proposta.html "${1:?saida.pdf}" ${2:+"$2"}
