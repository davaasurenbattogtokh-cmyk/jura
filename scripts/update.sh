#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -d .git ]]; then echo 'Extract the reviewed new release into this application directory, then run scripts/install.sh. Data lives in the Docker volume.';exit 1;fi
if [[ -n $(git status --porcelain) ]]; then echo 'Working tree is not clean; review changes before updating.';exit 1;fi
git pull --ff-only
bash scripts/backup.sh
docker compose build app
docker compose up -d --wait --wait-timeout 180
