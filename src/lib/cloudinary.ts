/**
 * Returns a Cloudinary URL with transformation params applied.
 * Falls back to the original URL if it's not a Cloudinary URL.
 *
 * @param url      Raw Cloudinary secure_url stored in the DB
 * @param width    Target width in pixels (height scales proportionally)
 */
export function cloudinaryUrl(url: string, width: number): string {
  if (!url.includes('res.cloudinary.com')) return url;
  // Insert transformation segment after /upload/
  return url.replace(
    '/upload/',
    `/upload/f_auto,q_auto,w_${width},c_limit/`,
  );
}
