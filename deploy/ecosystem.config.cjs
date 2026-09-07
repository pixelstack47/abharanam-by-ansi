/**
 * pm2 process definitions for the single-EC2 deployment (see ./README.md).
 *
 * Both processes run from the repo checkout on the box. The API stays bound to
 * localhost:5000 — only Next.js is exposed, and next.config.ts rewrites
 * /api/* to it, so the browser sees one origin and the auth cookie
 * (sameSite: "lax") keeps working without any CORS handling.
 *
 * Start:  pm2 start deploy/ecosystem.config.cjs
 * Reload: pm2 reload all
 */
const path = require("node:path");

// deploy/ lives inside the Next app root.
const APP_ROOT = path.resolve(__dirname, "..");
const API_ROOT = path.join(APP_ROOT, "backend");

module.exports = {
  apps: [
    {
      name: "abharanam-api",
      cwd: API_ROOT,
      // `npm start` -> node --env-file=.env src/index.ts (native TS stripping).
      // interpreter: "none" makes pm2 exec npm itself rather than feeding the
      // script to node.
      script: "npm",
      args: "start",
      interpreter: "none",
      // PORT and the secrets come from backend/.env via --env-file. NODE_ENV
      // deliberately is NOT set here: backend/.env is the single source of
      // truth for it, because config.ts's isProduction flag (NODE_ENV ===
      // "production") controls whether the auth cookie is marked Secure.
      // Setting NODE_ENV=production here — even just as a "safety net" —
      // would force Secure on the cookie regardless of what .env says, which
      // silently breaks login on a host that isn't serving HTTPS yet. Put
      // NODE_ENV=production in backend/.env once TLS is live, not here.
      max_restarts: 10,
      restart_delay: 2000,
    },
    {
      name: "abharanam-web",
      cwd: APP_ROOT,
      // `npm start` -> next start. Reads .env.local for BACKEND_URL. NODE_ENV
      // here only affects Next's own optimizations, not the cookie, so it's
      // safe to force production for this process.
      script: "npm",
      args: "start",
      interpreter: "none",
      env: { NODE_ENV: "production", PORT: 3000 },
      max_restarts: 10,
      restart_delay: 2000,
    },
  ],
};
