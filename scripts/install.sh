#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $EUID -ne 0 ]]; then echo 'Run with sudo bash scripts/install.sh'; exit 1; fi
if ! command -v docker >/dev/null; then
  . /etc/os-release
  if [[ ${ID:-} != ubuntu || ${VERSION_CODENAME:-} != resolute ]]; then
    echo 'This installer was prepared for Ubuntu 26.04. Inspect the OS before continuing.';exit 1
  fi
  for p in docker.io docker-compose docker-compose-v2 podman-docker containerd runc; do
    if dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q 'install ok installed'; then
      echo "Existing $p found. Resolve the Docker package conflict before continuing; nothing will be removed automatically.";exit 1
    fi
  done
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  arch=$(dpkg --print-architecture)
  cat > /etc/apt/sources.list.d/docker.sources <<SOURCE
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: resolute
Components: stable
Architectures: $arch
Signed-By: /etc/apt/keyrings/docker.asc
SOURCE
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
docker compose version
systemctl enable --now docker
if ! docker compose ps --status running --services 2>/dev/null | grep -qx proxy; then
  if ss -lntH | awk '{print $4}' | grep -Eq ':(80|443)$'; then
    echo 'Ports 80/443 already have a listener. Existing services were not stopped. Resolve proxy configuration before continuing.';exit 1
  fi
fi
if [[ ! -f .env ]]; then
  docker run --rm -it -v "$PWD:/work" -w /work node:24-bookworm-slim node scripts/init-env.mjs
fi
chmod 600 .env
docker compose build app
docker compose up -d --wait --wait-timeout 180
if ! docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
  echo 'Application health check failed. Check: docker compose logs --tail=100 app';exit 1
fi
echo 'Application started. HTTPS becomes available after DNS and ports 80/443 are reachable.'
echo 'Open https://jura.consulting/login and use Juradmin with the password you entered.'
