/** Resized WebP for display: /api/img?w=&src= (Cloudflare Images, edge-cached). Unknown sources pass through. */
const RESIZABLE = /^(\/api\/files\/[\w-]{8,64}|\/images\/[\w./-]+\.(?:webp|png|jpe?g)|https:\/\/pub-[a-z0-9]+\.r2\.dev\/[\w./%-]+\.(?:webp|png|jpe?g))$/i;
export const canResize = (src?: string) => !!src && RESIZABLE.test(src);
export function sized(src: string | undefined, w: number) {
  if (!src || !canResize(src)) return src || '';
  return `/api/img?w=${Math.round(w)}&src=${encodeURIComponent(src)}`;
}
