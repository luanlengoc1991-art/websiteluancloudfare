import type {Unit} from './catalog';

/** Per-project unit list synced from a Google Sheet (admin only). Stored in D1:
 *  - kind 'unit-sheet'     id=<projectId>  public  {syncedAt, count, units}
 *  - kind 'unit-sheet-src' id=<projectId>  private {url, gid}
 *  A project with a 'unit-sheet' record shows exactly the sheet's units on the website. */
export type UnitSheet = {syncedAt: number; count: number; units: Unit[]};

/** Any Google Sheets link (edit/view/share, optional #gid) → CSV export URL. */
export function sheetCsvUrl(input: string) {
  const url = new URL(input.trim());
  if (url.hostname !== 'docs.google.com') throw Error('Chỉ nhận link Google Sheets (docs.google.com).');
  const id = url.pathname.match(/\/spreadsheets\/d\/([\w-]{20,})/)?.[1];
  if (!id) throw Error('Link Google Sheets không hợp lệ.');
  const gid = url.hash.match(/gid=(\d+)/)?.[1] || url.searchParams.get('gid') || '0';
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {cell += '"'; i++;}
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {row.push(cell); cell = '';}
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) {row.push(cell); rows.push(row);}
  return rows.filter(r => r.some(v => v.trim()));
}

const plain = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Column header aliases (accents/case ignored). First match wins. */
const columns: [keyof Unit, string[]][] = [
  ['code', ['ma can', 'ma', 'ma san pham', 'can', 'code', 'unit', 'unit code', 'so can']],
  ['zone', ['phan khu', 'khu', 'zone', 'phan khu khu']],
  ['tower', ['toa', 'block', 'tower', 'day']],
  ['type', ['loai hinh', 'loai', 'loai can', 'san pham', 'type', 'product type', 'loai san pham']],
  ['group', ['quy', 'nhom', 'quy can', 'group', 'ban giao', 'tieu chuan ban giao']],
  ['direction', ['huong', 'huong cua', 'huong ban cong', 'direction']],
  ['area', ['dien tich', 'dien tich dat', 'dt dat', 'dt', 'area', 'dien tich m2', 'dien tich tim tuong', 'dt tim tuong']],
  ['builtArea', ['dien tich xay dung', 'dt xay dung', 'dien tich san', 'dt san', 'dt thong thuy', 'dien tich thong thuy', 'built area']],
  ['price', ['gia', 'gia ban', 'tong gia', 'gia ty', 'gia ban ty', 'tong gia tri', 'price', 'gia sau ck', 'gia sau chiet khau']],
  ['pricePerMeter', ['don gia', 'gia m2', 'don gia m2']],
  ['status', ['trang thai', 'tinh trang', 'status']],
  ['floor', ['tang', 'so tang', 'floor']],
  ['beds', ['phong ngu', 'so phong ngu', 'pn', 'beds']],
  ['note', ['ghi chu', 'note', 'mo ta']],
  ['gift', ['uu dai', 'qua tang', 'chinh sach']],
  ['layoutUrl', ['link mat bang', 'mat bang', 'layout', 'link layout']],
  ['posterUrl', ['link anh', 'anh', 'poster', 'hinh anh']],
];

const number = (v: string) => {
  const t = v.trim().replace(/\s/g, '');
  if (!t) return 0;
  // 1.234.567 (vi thousands) / 1,5 (vi decimal) / 1,234.5 (en)
  const n = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? Number(t.replace(/\./g, '').replace(',', '.'))
    : /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) ? Number(t.replace(/,/g, ''))
    : Number(t.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
export const PENDING = 'Đang cập nhật';
const status = (v: string) => {
  const p = plain(v);
  if (!p) return PENDING;
  if (/da ban|sold|ban roi|het hang/.test(p)) return 'Đã bán';
  if (/giu|lock|coc|booking|dat cho/.test(p)) return 'Đang giữ chỗ';
  return 'Còn hàng';
};

/** Sheet rows → units of one project. The header row is the first row that contains a "mã căn" column. */
export function mapSheetUnits(projectId: string, category: string, table: string[][]): Unit[] {
  const headerAt = table.findIndex(r => r.some(c => ['ma can', 'ma', 'code', 'unit code', 'ma san pham'].includes(plain(c))));
  if (headerAt < 0) throw Error('Không tìm thấy cột "Mã căn" trong Sheet.');
  const head = table[headerAt].map(plain);
  const index = new Map<keyof Unit, number>();
  const pick = (names: string[]) => {const exact = head.findIndex((h, i) => names.includes(h) && !Array.from(index.values()).includes(i)); return exact >= 0 ? exact : head.findIndex((h, i) => names.some(n => h.startsWith(n + ' ')) && !Array.from(index.values()).includes(i));};
  for (const [field, names] of columns) {const i = pick(names); if (i >= 0 && !Array.from(index.values()).includes(i)) index.set(field, i);}
  const get = (row: string[], f: keyof Unit) => {const i = index.get(f); return i === undefined ? '' : (row[i] || '').trim();};
  const seen = new Set<string>();
  return table.slice(headerAt + 1).flatMap((row, n) => {
    const code = get(row, 'code').toUpperCase().slice(0, 60);
    if (!code || seen.has(code)) return [];
    seen.add(code);
    let price = number(get(row, 'price'));
    if (price >= 1e6) price = price / 1e9; // VND → tỷ
    const unit: Unit = {
      id: `sheet-${projectId}-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, code, projectId, category,
      zone: get(row, 'zone') || PENDING, tower: get(row, 'tower') || PENDING, type: get(row, 'type') || PENDING,
      group: get(row, 'group'), direction: get(row, 'direction') || PENDING,
      area: number(get(row, 'area')), builtArea: number(get(row, 'builtArea')), price: Math.round(price * 1000) / 1000,
      status: status(get(row, 'status')), beds: number(get(row, 'beds')), floor: number(get(row, 'floor')),
      x: 10 + (n % 8) * 11, y: 15 + Math.floor(n / 8) % 7 * 11,
      note: get(row, 'note').slice(0, 500), gift: get(row, 'gift') || undefined,
      pricePerMeter: get(row, 'pricePerMeter') || undefined,
      layoutUrl: /^https:\/\//.test(get(row, 'layoutUrl')) ? get(row, 'layoutUrl') : undefined,
      posterUrl: /^https:\/\//.test(get(row, 'posterUrl')) ? get(row, 'posterUrl') : undefined,
      sourceLabel: 'Google Sheet',
    };
    return [unit];
  }).slice(0, 2000);
}

/** Sheet units replace a project's units but keep what only the website knows for the same code
 *  (Vịnh Tiên drawing, poster/layout images, unit id used by holds and pins). */
export function withSiteData(sheetUnits: Unit[], base: Unit[]): Unit[] {
  const byCode = new Map(base.map(u => [u.projectId + '|' + u.code.trim().toUpperCase(), u]));
  return sheetUnits.map(u => {
    const old = byCode.get(u.projectId + '|' + u.code);
    if (!old) return u;
    return {...u, id: old.id, drawing: old.drawing, posterUrl: u.posterUrl || old.posterUrl, layoutUrl: u.layoutUrl || old.layoutUrl, x: old.x, y: old.y};
  });
}
