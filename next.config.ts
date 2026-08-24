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

    // KNOWN ISSUE, not yet fixed. Several Unsplash originals in
    // lib/brand/images.ts are 4640x6960, and a cold transform of one takes
    // 10-35 seconds. Next gives an upstream 7 seconds, so the optimizer
    // returns 500 and that frame renders blank until Unsplash has the
    // rendition cached. Measured, not guessed: the same URLs fetch in under a
    // second once warm.
    //
    // Halving the requested widths (below, in `frame()`) makes cold
    // transforms much cheaper and is already in. The fuller fix is to stop
    // double-optimising — both sources are transforming CDNs and every URL
    // this app builds already carries its own size instructions — but
    // `unoptimized: true` was not verified before this was written down, so it
    // is deliberately NOT enabled here.
  },
};

export default nextConfig;
