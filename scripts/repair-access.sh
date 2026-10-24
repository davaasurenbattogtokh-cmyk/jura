#!/usr/bin/env bash
set +x
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ${1:-} != '' && ${1:-} != '--reset-admin' ]]; then
  echo 'Usage: bash scripts/repair-access.sh [--reset-admin]' >&2; exit 1
fi
if [[ ! -f .env ]]; then echo 'Missing .env. Run scripts/install.sh first.' >&2; exit 1; fi
if [[ ${1:-} == '--reset-admin' && ! -t 0 ]]; then
  echo 'Run this command interactively in your server terminal.' >&2; exit 1
fi

# Preserve the live database, uploads and original environment before any change.
bash scripts/backup.sh
umask 077
jura_env_tmp=$(mktemp .env.repair.XXXXXX)
trap 'rm -f "$jura_env_tmp"' EXIT
awk '!/^[[:space:]]*(export[[:space:]]+)?APP_URL[[:space:]]*=/' .env > "$jura_env_tmp"
printf '\nAPP_URL=https://juras.consulting\n' >> "$jura_env_tmp"
chmod 600 "$jura_env_tmp"
mv "$jura_env_tmp" .env

docker compose build app
docker compose up -d --wait --wait-timeout 180 app reminders
# Git can replace the bind-mounted file; recreate rather than reload the old inode.
docker compose up -d --no-deps --force-recreate proxy

# Exercise the production origin check without using any real account password.
docker compose exec -T app node --input-type=module -e '
  if (process.env.APP_URL !== "https://juras.consulting") throw Error("APP_URL mismatch");
  const url = "http://127.0.0.1:3000/api/jura";
  const ready = await fetch(url + "?view=public");
  if (!ready.ok) throw Error("Administrator initialization failed: " + ready.status);
  const probe = await fetch(url, {method:"POST", headers:{"Content-Type":"application/json", Origin:process.env.APP_URL},
    body:JSON.stringify({action:"login",username:"origin-probe-" + crypto.randomUUID(),password:"invalid-probe"})});
  if (probe.status !== 401) throw Error("Expected credential rejection after origin validation, got " + probe.status);
  console.log("juras.consulting origin accepted; authentication remains protected.");
'

if [[ ${1:-} == '--reset-admin' ]]; then bash scripts/reset-admin.sh; fi
echo 'Open https://juras.consulting/login and sign in as Juradmin.'
echo 'Public HTTPS also requires DNS pointing to this VPS and ports 80/443 reachable.'
