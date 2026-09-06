import type { NextConfig } from "next";

// The standalone Express API (./backend, PORT 5000). Server components fetch
// it directly via src/lib/api.ts; browser code reaches it through the
// same-origin /api rewrite below.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  // Serve `/shop/` rather than `/shop` so URLs stay stable from the days of
  // the static export — old links keep resolving without per-host rules.
  trailingSlash: true,

  // Without this, the trailing-slash canonicalisation 308-redirects
  // `/api/products` → `/api/products/` BEFORE the rewrite runs, breaking API
  // calls (redirect replays are especially unwelcome on POSTs). Pages still
  // render under their trailing-slash URLs; we just skip the hard redirect.
  skipTrailingSlashRedirect: true,

  // Proxy same-origin `/api/...` calls to the separate Express backend. The
  // browser only ever sees relative URLs, so the httpOnly auth cookie flows
  // through automatically and no CORS dance is needed client-side.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

  images: {
    // Product imagery lives on Unsplash (and behind the backend's /api/images
    // proxy), so we keep our own loader that leans on Unsplash's URL
    // parameters instead of Next's optimizer. See ./image-loader.ts.
    loader: "custom",
    loaderFile: "./image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
