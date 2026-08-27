/** Resolves a product image reference to a URL the browser can load. */
export function imageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/api/public/img/${url}`;
}
