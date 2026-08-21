import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product and editorial imagery is served straight from Cloudinary; nothing
    // else is allowed as a remote source.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
