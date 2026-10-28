import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Media uploads are validated again in the action (8 MB images / 80 MB video).
      // This transport limit must be slightly larger than the largest accepted file.
      bodySizeLimit: "82mb",
    },
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
