#!/usr/bin/env bash
# One-time provisioning for a fresh Ubuntu 24.04 EC2 instance.
#
#   curl -fsSL https://raw.githubusercontent.com/pixelstack47/abharanam-by-ansi/main/deploy/provision.sh | bash
#
# ...or clone the repo yourself and run `bash deploy/provision.sh`.
# Safe to re-run: every step is idempotent.
#
# It does NOT write .env files or start the apps — secrets are yours to place.
# Finish with the steps printed at the end (and in ./README.md).
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/pixelstack47/abharanam-by-ansi.git}"
CHECKOUT="${CHECKOUT:-$HOME/abharanam}"
APP_ROOT="$CHECKOUT"  # the GitHub repo root IS the app root — no nested lumiere/ dir
NODE_MAJOR=24

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$1"; }

# --- swap ---------------------------------------------------------------
# t3.micro has only 1 GB RAM; `next build` alone needs more than that, and
# update.sh only stops the live processes (not the OS/nginx/pm2 daemon
# itself) before building. 4G gives it real headroom.
if ! swapon --show | grep -q '/swapfile'; then
  log "Creating 4G swapfile"
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
else
  log "Swapfile already present — skipping"
fi

# --- packages -----------------------------------------------------------
log "Installing system packages"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git nginx

# Node from NodeSource. The API runs .ts files directly through Node's native
# type stripping, which needs >= 22.18 — do not downgrade this.
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt "$NODE_MAJOR" ]; then
  log "Installing Node.js ${NODE_MAJOR}.x"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
else
  log "Node $(node -v) already satisfies >= ${NODE_MAJOR} — skipping"
fi

log "Installing pm2 and certbot"
sudo npm install -g pm2
sudo apt-get install -y certbot python3-certbot-nginx

# --- source -------------------------------------------------------------
if [ -d "$CHECKOUT/.git" ]; then
  log "Updating existing checkout at $CHECKOUT"
  git -C "$CHECKOUT" pull --ff-only
else
  log "Cloning $REPO_URL -> $CHECKOUT"
  git clone "$REPO_URL" "$CHECKOUT"
fi

log "Installing dependencies"
npm --prefix "$APP_ROOT" ci
npm --prefix "$APP_ROOT/backend" ci

# --- next steps ---------------------------------------------------------
cat <<NEXT

$(printf '\033[1;32m==> System is ready.\033[0m') Remaining steps (details in deploy/README.md):

  1. Create the two env files — nothing runs without them:
       cp $APP_ROOT/.env.example         $APP_ROOT/.env.local
       cp $APP_ROOT/backend/.env.example $APP_ROOT/backend/.env
       \$EDITOR $APP_ROOT/backend/.env

     In backend/.env you MUST set: NODE_ENV=production, FRONTEND_ORIGIN to your
     https:// domain, MONGODB_URI, JWT_SECRET, S3_BUCKET.
     Leave AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY empty to use the instance
     IAM role. Generate a secret with:
       node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))'

     In .env.local set BACKEND_URL=http://127.0.0.1:5000

  2. Allow this instance's IP in MongoDB Atlas -> Network Access.

  3. Build, seed once, and start:
       npm --prefix $APP_ROOT run build
       (cd $APP_ROOT/backend && node --env-file=.env src/seed.ts)
       pm2 start $APP_ROOT/deploy/ecosystem.config.cjs
       pm2 save && pm2 startup    # run the command it prints

  4. Point nginx at it, then get a certificate:
       sudo cp $APP_ROOT/deploy/nginx.conf /etc/nginx/sites-available/abharanam
       sudo sed -i 's/example.com/YOURDOMAIN.com/g' /etc/nginx/sites-available/abharanam
       sudo ln -sf /etc/nginx/sites-available/abharanam /etc/nginx/sites-enabled/
       sudo rm -f /etc/nginx/sites-enabled/default
       sudo nginx -t && sudo systemctl reload nginx
       sudo certbot --nginx -d YOURDOMAIN.com -d www.YOURDOMAIN.com

  5. Add the S3 bucket CORS rule (deploy/s3-cors.json) so admin image uploads
     work — presigned PUTs go from the browser straight to S3.

NEXT
