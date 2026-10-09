import {bucket, database} from '@/db/store';
import {VINH_TIEN_SHEET} from '@/lib/green-paradise';
import {parseCsv, sheetCsvUrl} from '@/lib/unit-sheet';
import {purgeUnusedFiles} from '@/lib/media-storage';

/* "Mặt bằng căn" (Vịnh Tiên poster studio) data lives on the owner's Cloudflare:
 * - editor state  → D1 records (kind 'vinh-tien', id 'state'),
 * - price sheet   → read straight from Google Sheets, last good copy kept in D1 (id 'sheet'),
 * - static images → R2 under vinh-tien/<path>.
 * Since 09/10/2026 nothing is read from the old chatgpt.site app any more. */
const KIND = 'vinh-tien';
async function readRecord<T>(id: string): Promise<T | null> {
  const row = await database().prepare("SELECT payload FROM records WHERE owner='admin' AND kind=? AND id=?").bind(KIND, id).first<{payload: string}>();
  return row ? JSON.parse(row.payload) as T : null;
}
async function writeRecord(id: string, data: unknown) {
  await database().prepare('INSERT INTO records(owner,kind,id,payload,updated) VALUES(?,?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET payload=excluded.payload,updated=excluded.updated')
    .bind('admin', KIND, id, JSON.stringify(data), Date.now()).run();
}

/** Saved editor state ({state, updatedAt}); imported from the old app the first time. */
export async function readVinhTienState(): Promise<{state: unknown; updatedAt?: string}> {
  const saved = await readRecord<{state: unknown; updatedAt?: string}>('state');
  if (saved) return saved;
  return {state: {units: []}};
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

/** Price sheet read straight from Google Sheets (same shape the old app produced); falls back to the last copy in D1.
 *  Status and colour are not in the CSV export, so they are kept from the previous copy (default Còn hàng / white). */
export async function readVinhTienSheet(): Promise<Record<string, unknown>> {
  const saved = await readRecord<{units?: {unitCode: string; status?: string; color?: string; direction?: string; position?: string}[]}>('sheet');
  try {
    const r = await fetch(sheetCsvUrl(VINH_TIEN_SHEET), {redirect: 'follow', signal: AbortSignal.timeout(20000)});
    const text = r.ok ? await r.text() : '';
    if (!text || /^\s*<(!doctype|html)/i.test(text)) throw new Error('Sheet unavailable');
    const rows = parseCsv(text), head = rows.findIndex(x => x.some(c => /^mã căn$/i.test(c.trim())));
    if (head < 0) throw new Error('No unit column');
    const col = (re: RegExp) => rows[head].findIndex(c => re.test(c.replace(/\s+/g, ' ').trim()));
    const ic = {zone: col(/^khu$/i), code: col(/^mã căn$/i), type: col(/^loại hình/i), handover: col(/^tcbg/i), land: col(/^diện tích đất/i), built: col(/^diện tích xây/i), price: col(/^tổng giá/i), bank: col(/^stk$/i), date: col(/^ngày nhập/i), note: col(/^ghi chú/i), sign: col(/^ký cn/i), ten: col(/^tiền kq/i), tenDate: col(/^ngày kq/i), twenty: col(/^hđcn/i), ref: col(/^phiếu tính giá/i)};
    const prev = new Map((saved?.units || []).map(u => [u.unitCode, u]));
    const g = (row: string[], i: number) => i >= 0 ? (row[i] || '').trim() : '';
    const seen = new Set<string>();
    const units = rows.slice(head + 2).flatMap(row => {
      const code = g(row, ic.code).toUpperCase();
      if (!code || seen.has(code)) return [];
      seen.add(code);
      const p = ic.price, before = g(row, p), billions = Math.floor(Number(before.replace(/[^\d]/g, '')) / 1e7) / 100;
      const old = prev.get(code);
      return [{unitCode: code, productType: g(row, ic.type), handover: g(row, ic.handover), landArea: g(row, ic.land), builtArea: g(row, ic.built),
        price: billions ? billions.toFixed(2).replace('.', ',') : '', color: old?.color || '#FFFFFF', status: old?.status || 'Còn hàng', zone: g(row, ic.zone) || 'Vịnh Tiên',
        direction: old?.direction || '', position: old?.position || '', updatedAt: g(row, ic.date),
        pricing: {priceBeforeVat: before, vat: g(row, p + 1), maintenanceFee: g(row, p + 2), totalPrice: g(row, p + 3),
          constructionBeforeVat: g(row, p + 4), constructionVat: g(row, p + 5), constructionMaintenanceFee: g(row, p + 6), constructionTotal: g(row, p + 7),
          landBeforeVat: g(row, p + 8), landVat: g(row, p + 9), landMaintenanceFee: g(row, p + 10), landTotal: g(row, p + 11),
          bankAccount: g(row, ic.bank), inventoryDate: g(row, ic.date), note: g(row, ic.note), transferSigning: g(row, ic.sign), tenPercentAmount: g(row, ic.ten),
          tenPercentDate: g(row, ic.tenDate), twentyPercentContract: g(row, ic.twenty), pricingReference: g(row, ic.ref) || code}}];
    });
    if (!units.length) throw new Error('Empty sheet');
    const sheet = {units, syncedAt: new Date().toISOString(), stale: false};
    await writeRecord('sheet', sheet).catch(() => {});
    return sheet;
  } catch (error) {
    if (saved) return {...saved, stale: true};
    throw error;
  }
}

/** Static studio image, stored in R2 (all files were copied from the old app on 09/10/2026). */
export async function vinhTienImage(path: string): Promise<{body: ReadableStream | ArrayBuffer; type: string} | null> {
  const key = 'vinh-tien/' + path;
  const object = await bucket().get(key);
  if (object) return {body: object.body as unknown as ReadableStream, type: object.httpMetadata?.contentType || 'image/jpeg'};
  return null;
}
