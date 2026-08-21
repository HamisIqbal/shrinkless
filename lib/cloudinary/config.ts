export const UPLOAD_FOLDER = 'shrinkless/products';

export function uploadEndpoint(cloudName: string): string {
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}
