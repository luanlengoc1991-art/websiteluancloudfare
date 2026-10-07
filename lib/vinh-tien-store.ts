import {bucket, database} from '@/db/store';
import {VINH_TIEN_ORIGIN} from '@/lib/green-paradise';
import {purgeUnusedFiles} from '@/lib/media-storage';

/* "Mặt bằng căn" (Vịnh Tiên poster studio) data lives on the owner's Cloudflare:
 * - editor state  → D1 records (kind 'vinh-tien', id 'state'); seeded once from the old chatgpt.site app,
 * - price sheet   → read from the old app (it proxies Google Sheets), last good copy kept in D1 (id 'sheet'),
 * - static images → mirrored into R2 under vinh-tien/<path> on first request. */
const KIND = 'vinh-tien';
async function readRecord<T>(id: string): Promise<T | null> {
  const row = await database().prepare("SELECT payload FROM records WHERE owner='admin' AND kind=? AND id=?").bind(KIND, id).first<{payload: string}>();
  return row ? JSON.parse(row.payload) as T : null;
}
async function writeRecord(id: string, data: unknown) {
  await database().prepare('INSERT INTO records(owner,kind,id,payload,updated) VALUES(?,?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET payload=excluded.payload,updated=excluded.updated')
    .bind('admin', KIND, id, JSON.stringify(data), Date.now()).run();
}
const fromOrigin = async (path: string) => {
  const r = await fetch(VINH_TIEN_ORIGIN + path, {cache: 'no-store', signal: AbortSignal.timeout(15000)});
  if (!r.ok) throw new Error('Source unavailable');
  return r.json();
};

/** Saved editor state ({state, updatedAt}); imported from the old app the first time. */
export async function readVinhTienState(): Promise<{state: unknown; updatedAt?: string}> {
  const saved = await readRecord<{state: unknown; updatedAt?: string}>('state');
  if (saved) return saved;
  const imported = await fromOrigin('/api/state') as {state: unknown; updatedAt?: string};
  await writeRecord('state', imported);
  return imported;
}
export async function writeVinhTienState(state: unknown) {
  const before = JSON.stringify(await readRecord('state') ?? '');
  const data = {state, updatedAt: new Date().toISOString()};
  await writeRecord('state', data);
  // Replaced studio uploads are deleted from R2/D1 once nothing references them.
  const after = JSON.stringify(data), ids = (t: string) => new Set([...t.matchAll(/\/api\/files\/([\w-]{8,64})/g)].map(m => m[1]));
  const gone = [...ids(before)].filter(id => !ids(after).has(id));
  if (gone.length) await purgeUnusedFiles(gone.map(id => '/api/files/' + id)).catch(() => {});
  return data;
}

/** Price sheet from Google Sheets (via the old app); falls back to the last copy saved in D1. */
export async function readVinhTienSheet(search = ''): Promise<Record<string, unknown>> {
  try {
    const sheet = await fromOrigin('/api/sheet' + search) as Record<string, unknown>;
    if (!search) await writeRecord('sheet', sheet).catch(() => {});
    return sheet;
  } catch (error) {
    const saved = await readRecord<Record<string, unknown>>('sheet');
    if (saved) return {...saved, stale: true};
    throw error;
  }
}

/** Static studio image: R2 mirror first, otherwise fetch from the old app and keep a copy. */
export async function vinhTienImage(path: string): Promise<{body: ReadableStream | ArrayBuffer; type: string} | null> {
  const key = 'vinh-tien/' + path;
  const object = await bucket().get(key);
  if (object) return {body: object.body as unknown as ReadableStream, type: object.httpMetadata?.contentType || 'image/jpeg'};
  const r = await fetch(VINH_TIEN_ORIGIN + '/' + path, {signal: AbortSignal.timeout(25000)});
  if (!r.ok) return null;
  const bytes = await r.arrayBuffer(), type = r.headers.get('content-type') || 'image/jpeg';
  if (bytes.byteLength > 0 && /^image\//.test(type)) await bucket().put(key, bytes, {httpMetadata: {contentType: type}});
  return {body: bytes, type};
}
