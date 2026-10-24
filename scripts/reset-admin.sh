#!/usr/bin/env bash
set +x
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -t 0 ]]; then echo 'Run this command in your server terminal.' >&2; exit 1; fi
docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" || {
  echo 'Application health check failed. Check: docker compose ps' >&2; exit 1;
}
IFS= read -r -s -p 'New Juradmin password (hidden, minimum 10 characters): ' jura_password
printf '\n'
IFS= read -r -s -p 'Repeat new password (hidden): ' jura_confirmation
printf '\n'
if [[ "$jura_password" != "$jura_confirmation" ]]; then
  unset jura_password jura_confirmation
  echo 'Passwords do not match. No changes made.' >&2; exit 1
fi
unset jura_confirmation
trap 'unset jura_password' EXIT
printf '%s' "$jura_password" | docker compose exec -T app node --input-type=module -e "$(cat scripts/reset-admin.mjs)"
