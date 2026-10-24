#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
backup_dir=${1:-/var/backups/jura}
install -d -m 700 "$backup_dir"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
umask 077
# Briefly pause all application writers for a consistent database + upload snapshot.
docker compose stop reminders app
trap 'docker compose start app reminders >/dev/null' EXIT
container=$(docker compose ps -aq app)
if [[ -z $container ]]; then echo 'No app container exists.';exit 1;fi
docker run --rm --volumes-from "$container":ro -v "$backup_dir:/backup" node:24-bookworm-slim tar czf "/backup/jura-data-$stamp.tar.gz" -C /app/data .
install -m 600 .env "$backup_dir/jura-env-$stamp"
echo "Backup saved in $backup_dir at $stamp. Copy it to independent storage."
