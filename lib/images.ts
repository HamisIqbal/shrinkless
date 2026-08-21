import { cloudinaryUrl } from '@/lib/cloudinary/url';

/**
 * The one seam between placeholder photography and real uploads.
 *
 * Product images are Cloudinary public IDs. Editorial and seeded placeholder
 * images are absolute URLs. Rather than teach every component the difference,
 * anything that already looks like a URL is passed through untouched and
 * everything else goes to Cloudinary exactly as before — so replacing the
 * placeholders with real uploads is a data change, not a code change.
 */
export function imageUrl(publicIdOrUrl: string, transform?: string): string {
  if (/^https?:\/\//i.test(publicIdOrUrl)) return publicIdOrUrl;

  return cloudinaryUrl(publicIdOrUrl, transform);
}

export function isRemoteImage(publicIdOrUrl: string): boolean {
  return /^https?:\/\//i.test(publicIdOrUrl);
}
