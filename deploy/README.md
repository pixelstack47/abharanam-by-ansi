# Deploying Abharanam to a single EC2 instance

Both processes — the Next.js app and the Express API — run on one Ubuntu box
behind nginx. The API stays bound to `127.0.0.1:5000` and is never exposed;
`next.config.ts` rewrites `/api/*` to it, so the browser only ever sees one
origin. That is what keeps the `sameSite: "lax"` auth cookie working with no
CORS handling anywhere.

```
          :443 ─ nginx ─ :3000  next start  ──(server components)──┐
 browser ─┤                                                        ├─ :5000 express ─ Atlas / S3
          └─ /api/* ─── Next rewrite ────────────────────────────┘
```

Runtime requirement: **Node >= 22.18**. The API executes `.ts` files directly
through Node's native type stripping (`node --env-file=.env src/index.ts`) —
there is no build step and no `ts-node`. `provision.sh` installs Node 24.

Files here: `provision.sh` (one-time setup), `update.sh` (redeploy),
`ecosystem.config.cjs` (pm2), `nginx.conf`, `iam-policy.json`, `s3-cors.json`.

---

## 1. AWS resources — console walkthrough

Everything here is done once, by hand, in the AWS console. Sign in, and set the
region selector (top right) to **Asia Pacific (Mumbai) ap-south-1** before you
start — it must match `AWS_REGION` and sit next to the S3 bucket. Resources
created in the wrong region will not be visible from the right one.

### 1a. Launch the EC2 instance

EC2 → Instances → **Launch instances**.

| Field | Value |
|---|---|
| Name | `abharanam` |
| AMI | **Ubuntu Server 24.04 LTS** (default amd64/x86 image — leave architecture alone) |
| Instance type | **t3.micro** (free-tier eligible: 750 hrs/month for a new account's first 12 months) |
| Key pair | Create new → name `abharanam` → type **RSA**, format **.pem** → Download |
| Storage | 20 GB **gp3** |

The `.pem` downloads once and cannot be re-downloaded — keep it. On Windows it
usually lands in `%USERPROFILE%\Downloads`.

t3.micro has only 1 GB RAM — not enough to run `next build` and both live
processes at once. `provision.sh` and `update.sh` are adjusted for this: the
swapfile is sized at 4 GB instead of 2, and `update.sh` stops both pm2
processes before building and restarts them after, so the build gets the full
1 GB to itself. That's a few seconds of downtime on every deploy — fine for a
low-traffic storefront. If traffic grows, resize later (EC2 console → stop
instance → Actions → Instance settings → Change instance type → t3.small →
start) and both scripts keep working unchanged.

### 1b. Security group

In the same launch screen, under Network settings → **Edit** → Create security
group named `abharanam-sg`, with three inbound rules and nothing else:

| Type | Port | Source | Why |
|---|---|---|---|
| SSH | 22 | **My IP** | admin access — never 0.0.0.0/0 |
| HTTP | 80 | Anywhere 0.0.0.0/0 | certbot's HTTP challenge, then redirects |
| HTTPS | 443 | Anywhere 0.0.0.0/0 | the site |

Port 5000 stays closed. The API binds to localhost and is reached only through
the Next rewrite; exposing it would bypass the same-origin design.

Then **Launch instance**.

### 1c. Elastic IP

EC2 → Network & Security → **Elastic IPs** → Allocate Elastic IP address →
Allocate. Select it → Actions → **Associate** → Instance: `abharanam` →
Associate.

Do not skip this. Without it the public IP changes on every stop/start, which
breaks both your DNS record and the Atlas allowlist. It is free while
associated with a running instance.

### 1d. IAM role for S3

IAM → **Policies** → Create policy → **JSON** tab → paste the contents of
`deploy/iam-policy.json`, replacing `BUCKET` with your real bucket name →
name it `abharanam-s3` → Create.

IAM → **Roles** → Create role → Trusted entity **AWS service** → Use case
**EC2** → Next → tick `abharanam-s3` → name the role `abharanam-ec2` → Create.

Attach it: EC2 → Instances → select `abharanam` → Actions → Security →
**Modify IAM role** → `abharanam-ec2` → Update.

Then leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` **empty** in
`backend/.env`. `backend/src/lib/s3.ts` only passes explicit credentials when
both are set, and otherwise falls back to the SDK's default provider chain,
which finds the role. No long-lived keys on disk, nothing to rotate.

### 1e. DNS

At your domain registrar, add an **A record** pointing at the Elastic IP — one
for the apex (`@`) and one for `www`. Do this before certbot runs: the
certificate is issued by an HTTP challenge on port 80, which requires the name
to already resolve. Check from your machine with:

```bash
nslookup yourdomain.com
```

A domain is effectively required. `NODE_ENV=production` makes the session
cookie `secure: true`, so over plain `http://<ip>` a login appears to succeed
and then every subsequent request is anonymous.

### 1f. MongoDB Atlas allowlist

Atlas → your cluster → **Network Access** → Add IP Address → paste the Elastic
IP → Confirm. Atlas silently refuses unlisted addresses, and the failure
surfaces as a connection timeout that reads like a malformed URI.

## 2. Provision

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
curl -fsSL https://raw.githubusercontent.com/pixelstack47/abharanam-by-ansi/main/deploy/provision.sh | bash
```

Installs a 2 GB swapfile, Node 24, nginx, certbot and pm2, clones the repo to
`~/abharanam`, and runs `npm ci` in both packages. It is idempotent — re-run it
freely. It deliberately stops short of writing env files or starting anything,
and prints the remaining steps.

## 3. Environment

Neither app starts without these. `backend/src/config.ts` aborts at boot
listing whatever is missing.

```bash
cd ~/abharanam
cp .env.example .env.local
cp backend/.env.example backend/.env
nano backend/.env
```

`.env.local` (frontend):

```
BACKEND_URL=http://127.0.0.1:5000
NEXT_PUBLIC_WHATSAPP_NUMBER=917558083325
```

`backend/.env` — beyond the example's values:

```
NODE_ENV=production
FRONTEND_ORIGIN=https://yourdomain.com
PORT=5000
MONGODB_URI=...          # Atlas SRV string
JWT_SECRET=...           # node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))'
S3_BUCKET=abharanam
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=       # empty — instance role
AWS_SECRET_ACCESS_KEY=   # empty — instance role
```

**`NODE_ENV=production` has to be in this file.** `npm start` loads it with
`--env-file=.env`, and it is what flips the session cookie to `secure: true`
(`backend/src/lib/auth.ts`). Without it the cookie is sent over plain HTTP.

## 4. MongoDB Atlas

Confirm you did step 1f — the Elastic IP is in Network Access. The API fails
at `connectDB` otherwise, with a timeout that reads like a bad URI.

## 5. Build, seed, start

```bash
cd ~/abharanam
npm run build
(cd backend && node --env-file=.env src/seed.ts)   # once, creates the admin user
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup        # then run the sudo command it prints, so pm2 survives reboot
pm2 status
```

`seed.ts` needs `ADMIN_EMAIL` / `ADMIN_PASSWORD` set. Run it once — re-running
reseeds catalogue data.

## 6. nginx + TLS

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/abharanam
sudo sed -i 's/example.com/yourdomain.com/g' /etc/nginx/sites-available/abharanam
sudo ln -sf /etc/nginx/sites-available/abharanam /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

certbot edits the site file in place to add the `:443` block and the redirect,
and installs a renewal timer. Check it with `sudo certbot renew --dry-run`.

## 7. S3 CORS — required for admin image uploads

`POST /api/admin/uploads` returns a **presigned PUT**; the browser then uploads
straight to S3, cross-origin. Without a CORS rule that upload fails in the
browser while every other page looks fine.

```bash
sed -i 's/example.com/yourdomain.com/g' deploy/s3-cors.json
aws s3api put-bucket-cors --bucket abharanam --cors-configuration file://deploy/s3-cors.json
```

(In the S3 console's CORS editor, paste only the inner `CORSRules` array.)

Reads do **not** need CORS or public access — `/api/images/:key` proxies them
through the backend, so keep Block Public Access fully on.

## 8. Verify

```bash
curl -sS https://yourdomain.com/api/health          # {"ok":true} — proves the rewrite reaches the API
curl -sSI https://yourdomain.com/ | head -1         # 200
pm2 logs --lines 50
```

Then in a browser: log in as the seeded admin (the cookie should show
`Secure`, `HttpOnly`), and upload a product image to exercise the S3 path.

---

## Redeploying

```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
bash ~/abharanam/deploy/update.sh
```

Pulls, reinstalls only if a lockfile moved, rebuilds, and restarts both pm2
processes (stop-then-start, not a zero-downtime reload — see the comment at
the top of `update.sh` for why, and when that changes if you resize the box).

## Changing environment variables

Two different files, two different rules for what "picking up the change"
requires.

**`backend/.env`** — no build step involved; the API runs `.ts` files
directly via `node --env-file=.env`, so a restart alone is enough:

```bash
nano ~/abharanam/backend/.env      # edit, save
pm2 restart abharanam-api
```

**`.env.local`** (frontend) — depends on the variable:

- `NEXT_PUBLIC_*` variables (e.g. `NEXT_PUBLIC_WHATSAPP_NUMBER`) get baked
  into the browser JS bundle at build time. A restart alone will **not** pick
  up a new value — rebuild first:
  ```bash
  nano ~/abharanam/.env.local
  cd ~/abharanam && npm run build
  pm2 restart abharanam-web
  ```
- Everything else (e.g. `BACKEND_URL`) is read server-side at request time,
  so `pm2 restart abharanam-web` alone is enough. Rebuilding is always safe
  if you're not sure which kind a variable is.

On this t3.micro (1 GB RAM), avoid running `npm run build` while both
processes are still live — see the OOM note in `update.sh`. A plain
`pm2 restart abharanam-api` for a backend-only change doesn't need that care;
only a frontend rebuild does.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Missing required environment variable(s)` | `backend/.env` absent or a value blank |
| API up, pages 502 | `next build` was OOM-killed — check `free -h`, confirm the swapfile is on |
| Login succeeds then every request is anonymous | `NODE_ENV=production` without HTTPS, or nginx not forwarding `X-Forwarded-Proto` |
| Atlas connection timeout | Elastic IP not in Network Access |
| Image upload fails in browser only | S3 CORS rule missing or wrong origin |
| `/api/*` returns Next 404 HTML | API process down — `pm2 status`, `pm2 logs abharanam-api` |

## Cost (ap-south-1, rough)

**First 12 months on a new AWS account**, t3.micro is free-tier eligible
(750 instance-hours/month covers one instance running full-time):

| Item | Monthly |
|---|---|
| t3.micro | $0 (free tier) |
| 20 GB gp3 | $0 (free tier covers 30 GB) |
| Elastic IP (while associated) | $0 |
| S3 + egress at low traffic | ~$1 |
| **Total** | **~$1** |

**After the free tier expires** (or on an account that's already used it),
t3.micro on-demand runs ~$0.0112/hr ≈ **$8/month**, plus ~$1.60 for storage
and ~$1 for S3/egress — **~$11 total**. Resizing later to t3.small roughly
doubles the compute line.
