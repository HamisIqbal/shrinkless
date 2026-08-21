import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product uploads come from Cloudinary. Editorial and placeholder
    // photography comes from Unsplash until real Shrinkless shots exist —
    // see lib/brand/images.ts. Nothing else is an allowed remote source.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
