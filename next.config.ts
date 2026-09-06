import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` emits a plain HTML/CSS/JS site into `dist/`,
  // deployable to any static host (Netlify, GitHub Pages, S3) with no Node
  // server. Note this rules out route handlers, cookies, server actions and
  // redirects/rewrites — none of which this site uses.
  output: "export",
  distDir: "dist",

  // Emit `/shop/index.html` rather than `/shop.html`, so static hosts resolve
  // clean URLs without per-host rewrite rules.
  trailingSlash: true,

  images: {
    // A static export has no image optimization server, so we supply our own
    // loader that leans on Unsplash's URL parameters. See ./image-loader.ts.
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
