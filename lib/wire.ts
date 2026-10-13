/* Data APIs (/api/state, /api/green-paradise) answer with a scrambled binary body instead of readable JSON, so the
 * project data cannot be opened in a tab or copied out of the Network panel and pasted into an AI. Format:
 * 8-byte random nonce + gzip(JSON) XOR a keystream seeded from the nonce. This is obfuscation, not encryption:
 * the browser must be able to read it, so the decoder ships to the client (its bundle is obfuscated at build time). */
const SEED = 0x4c75616e; // "Luan"

function mask(bytes: Uint8Array, nonce: Uint8Array) {
  let s = SEED;
  for (const b of nonce) s = Math.imul(s ^ b, 0x9e3779b1) >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    bytes[i] ^= s & 255;
  }
  return bytes;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  return new Uint8Array(await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer());
}

/** Server: JSON value → scrambled response. */
export async function wireResponse(data: unknown, init: ResponseInit = {}) {
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(data)), new CompressionStream('gzip'));
  const nonce = crypto.getRandomValues(new Uint8Array(8));
  const body = new Uint8Array(8 + packed.length);
  body.set(nonce); body.set(mask(packed, nonce), 8);
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/octet-stream');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  return new Response(body, {...init, headers});
}

/** Client: scrambled response → JSON text (errors come back as plain JSON and pass through unchanged). */
export async function wireText(r: Response) {
  if (!(r.headers.get('content-type') || '').includes('octet-stream')) return r.text();
  const body = new Uint8Array(await r.arrayBuffer());
  const packed = mask(body.slice(8), body.subarray(0, 8));
  return new TextDecoder().decode(await pipe(packed, new DecompressionStream('gzip')));
}
