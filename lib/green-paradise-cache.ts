import {getCloudflareContext} from '@opennextjs/cloudflare';

/* Edge copy of /api/green-paradise. Reading the Google Sheet takes 1–3 s, so visitors always get the stored copy at
 * once; a copy older than FRESH is refreshed in the background. Saving the studio (vinh-tien api/state) drops it. */
export const FRESH = 30_000;
const edge = () => (globalThis as unknown as {caches?: {default?: Cache}}).caches?.default;
const keyOf = (url: string) => new Request(new URL('/api/green-paradise?edge=1', url).toString());

export async function cachedGreenParadise(url: string, build: () => Promise<Response>) {
  const cache = edge(), key = keyOf(url);
  const keep = async () => {
    const res = await build();
    if (cache && res.ok) {
      const copy = new Response(res.clone().body, res);
      copy.headers.set('Cache-Control', 'public, s-maxage=86400');
      copy.headers.set('X-Built-At', String(Date.now()));
      await cache.put(key, copy);
    }
    return res;
  };
  const hit = await cache?.match(key);
  if (!hit) return keep();
  if (Date.now() - Number(hit.headers.get('X-Built-At') || 0) > FRESH) {
    try {getCloudflareContext().ctx.waitUntil(keep().catch(() => undefined));} catch {}
  }
  const res = new Response(hit.body, hit);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.delete('X-Built-At');
  return res;
}

export async function dropGreenParadise(url: string) {
  await edge()?.delete(keyOf(url));
}
