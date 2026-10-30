import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Media and Visual Tour uploads (HTML/ZIP up to 100 MB).
      bodySizeLimit: "120mb",
    },
  },
  async headers() {
    return [
      {
        source: "/tours/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' blob: data: https:; frame-ancestors 'self' http://localhost:* https://localhost:*",
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    qualities: [75, 88, 92],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async redirects() {
    return [
      {
        source: "/:locale(en|ar)/developments",
        destination: "/:locale/projects",
        permanent: true,
      },
      {
        source: "/developments",
        destination: "/en/projects",
        permanent: true,
      },
      {
        source: "/:locale(en|ar)/developments/:slug",
        destination: "/:locale/projects/:slug",
        permanent: true,
      },
      {
        source: "/developments/:slug",
        destination: "/en/projects/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
