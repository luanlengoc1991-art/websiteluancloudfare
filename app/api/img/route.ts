import {getCloudflareContext} from '@opennextjs/cloudflare';
import {bucket, database} from '@/db/store';
import {canResize} from '@/lib/img';
type Images = {input(s: ReadableStream): {transform(o: object): {output(o: object): Promise<{response(): Response}>}}};
type Ctx = {env: {IMAGES?: Images}; ctx: {waitUntil(p: Promise<unknown>): void}};

/** Display-size WebP of a site image. Public images only; PDFs and unknown hosts are refused.
 *  Optional c=left,top,width,height crops a region first (map tiles) and q= sets WebP quality (50–90). */
export async function GET(req: Request) {
  const url = new URL(req.url), src = url.searchParams.get('src') || '', w = Math.round(Number(url.searchParams.get('w')));
  if (!canResize(src) || !(w >= 80 && w <= 2560)) return new Response('Bad request', {status: 400});
  const crop = (url.searchParams.get('c') || '').split(',').filter(Boolean).map(Number), q = Number(url.searchParams.get('q') || 84);
  if ((crop.length && (crop.length !== 4 || crop.some(n => !Number.isInteger(n) || n < 0 || n > 20000) || !crop[2] || !crop[3])) || !(q >= 50 && q <= 90)) return new Response('Bad request', {status: 400});
  const cache = (globalThis as unknown as {caches?: {default?: Cache}}).caches?.default;
  const key = new Request(url.toString(), {method: 'GET'});
  const hit = await cache?.match(key); if (hit) return hit;
  // A cropped tile must never fall back to the whole image (it would land in the wrong place).
  const fallback = () => crop.length ? new Response('Unavailable', {status: 502}) : Response.redirect(new URL(src, req.url).toString(), 302);
  try {
    let body: ReadableStream | null = null, size = 0;
    if (src.startsWith('/api/files/')) {
      const row = await database().prepare("SELECT mime,object_key FROM files WHERE owner='admin' AND id=?").bind(src.slice(11)).first<{mime: string; object_key: string}>();
      if (!row || !row.mime.startsWith('image/')) return new Response('Not found', {status: 404});
      const object = await bucket().get(row.object_key); if (!object) return new Response('Not found', {status: 404});
      body = object.body as unknown as ReadableStream; size = object.size;
    } else {
      const r = await fetch(new URL(src, req.url).toString(), {signal: AbortSignal.timeout(20000)});
      if (!r.ok || !r.body) return fallback();
      body = r.body as unknown as ReadableStream; size = Number(r.headers.get('content-length') || 0);
    }
    const cf = getCloudflareContext() as unknown as Ctx;
    if (!cf.env.IMAGES || !body) return fallback();
    const out = await (await cf.env.IMAGES.input(body).transform({...(crop.length ? {trim: {left: crop[0], top: crop[1], width: crop[2], height: crop[3]}} : {}), width: w, fit: 'scale-down'}).output({format: 'image/webp', quality: q})).response().arrayBuffer();
    // Never serve something heavier than the original: already-light photos keep their own file.
    if (!crop.length && size && out.byteLength >= size * 0.9) {const res = Response.redirect(new URL(src, req.url).toString(), 302); const keep = new Response(null, {status: 302, headers: {Location: res.headers.get('Location')!, 'Cache-Control': 'public, max-age=86400'}}); if (cache) (getCloudflareContext() as unknown as Ctx).ctx.waitUntil(cache.put(key, keep.clone())); return keep;}
    // Uploaded files can be replaced under the same id, so they refresh hourly; static sources keep a month.
    const maxAge = src.startsWith('/api/files/') ? 3600 : 2592000;
    const res = new Response(out, {headers: {'Content-Type': 'image/webp', 'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=86400`}});
    if (cache) cf.ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  } catch { return fallback(); }
}
