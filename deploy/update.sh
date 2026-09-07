#!/usr/bin/env bash
# Redeploy after pushing changes. Run on the box:
#   bash ~/abharanam/deploy/update.sh
#
# Pulls, reinstalls if lockfiles moved, rebuilds Next, and restarts both pm2
# processes. Env files and the database are untouched.
#
# The box is a t3.micro (1 GB RAM): `next build` needs the memory both live
# processes are using, so this stops them first and starts them again after —
# a few seconds of downtime per deploy, not a hot reload. If you resize to
# t3.small or larger, drop the stop/start and use `pm2 reload` instead so the
# old worker keeps serving while the new one builds.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ECOSYSTEM="$APP_ROOT/deploy/ecosystem.config.cjs"

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }

cd "$APP_ROOT"

# Note the lockfile hashes before pulling so we only pay for npm ci when the
# dependency set actually moved.
before_web="$(sha1sum package-lock.json | cut -d' ' -f1)"
before_api="$(sha1sum backend/package-lock.json | cut -d' ' -f1)"

log "Pulling latest"
git pull --ff-only

if [ "$(sha1sum package-lock.json | cut -d' ' -f1)" != "$before_web" ]; then
  log "Frontend lockfile changed — npm ci"
  npm ci
fi

if [ "$(sha1sum backend/package-lock.json | cut -d' ' -f1)" != "$before_api" ]; then
  log "Backend lockfile changed — npm ci"
  npm --prefix backend ci
fi

log "Stopping live processes to free RAM for the build"
pm2 stop "$ECOSYSTEM" || true

log "Building Next.js"
npm run build

log "Starting pm2 processes"
pm2 start "$ECOSYSTEM"

log "Done"
pm2 status
