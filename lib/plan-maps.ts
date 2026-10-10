/** HD master plans used by the Quỹ căn 360° tab (components/plan-map-360.tsx) and the Saigon Park poster plan.
 *  image = first view (viewW px wide). levels = sharper layers, each a grid of pieces covering the whole plan at a total
 *  width of w px; the viewer only loads the pieces inside the visible area of the one level the current zoom needs.
 *  cardSrc: unit positions placed with "Vẽ căn" on this same plan (unit-card plan spot) become price tags too.
 *  lots: every lot label position is known (read from the PDF), so units without a pin are placed automatically. */
export type PlanLevel = {w: number; grid: number; src: (r: number, c: number) => string};
export type PlanMapConfig = {image: string; viewW: number; levels: PlanLevel[]; width: number; height: number; title: string; cardSrc?: string; lots?: boolean};

const enc = encodeURIComponent;
const two = (n: number) => String(n).padStart(2, '0');
/** Files named <prefix><r><c> shown as they are. */
const files = (prefix: string, grid: number, w: number, name = (r: number, c: number) => `${r}${c}`): PlanLevel => ({w, grid, src: (r, c) => prefix + name(r, c)});
/** Same files resized to `px` wide through /api/img. */
const resized = (prefix: string, grid: number, px: number, name = (r: number, c: number) => `${r}${c}`, q = 80): PlanLevel =>
  ({w: grid * px, grid, src: (r, c) => `/api/img?v=4&w=${px}&q=${q}&src=${enc(prefix + name(r, c))}`});
/** Each file (tileW × tileH) cut in 2 × 2 crops through /api/img: twice the grid, full resolution. */
const crops = (prefix: string, grid: number, tileW: number, tileH: number, name = (r: number, c: number) => `${r}${c}`, q = 74): PlanLevel => {
  const hw = Math.floor(tileW / 2), hh = Math.floor(tileH / 2);
  return {w: grid * 2 * hw, grid: grid * 2, src: (r, c) => `/api/img?v=4&w=${hw}&q=${q}&c=${(c % 2) * hw},${(r % 2) * hh},${hw},${hh}&src=${enc(prefix + name(r >> 1, c >> 1))}`};
};
const n2 = (r: number, c: number) => two(r) + two(c);

/** Saigon Park master plan sgp-map-v4: rendered from the owner's vector PDF (61440 × 43456 px at the deepest level). */
export const SGP_MAP = '/api/files/sgp-map-v4-view';
export const SGP_MAP_W = 61440, SGP_MAP_H = 43456;

export const PLAN_MAPS: Record<string, PlanMapConfig> = {
  'green-paradise': {image: '/api/files/gp-map-view', viewW: 3000, width: 15000, height: 10610, title: 'The Haven Bay – Vịnh Tiên',
    levels: [resized('/api/files/gp-map-t', 4, 1875), crops('/api/files/gp-map-t', 4, 3750, 2652)]},
  'saigon-park': {image: SGP_MAP, viewW: 2560, width: SGP_MAP_W, height: SGP_MAP_H, title: 'Vinhomes Sài Gòn Park', cardSrc: SGP_MAP, lots: true,
    levels: [files('/api/files/sgp-map-v4-m', 4, 7680), resized('/api/files/sgp-map-v4-t', 16, 960, n2), resized('/api/files/sgp-map-v4-t', 16, 1920, n2), crops('/api/files/sgp-map-v4-t', 16, 3840, 2716, n2)]},
};

/** Visible part of the plan, as fractions of its width / height. */
export type PlanArea = {u0: number; u1: number; v0: number; v1: number};
export type PlanPiece = {key: string; src: string; left: string; top: string; width: string; height: string};
/** Pieces to draw for an on-screen plan width of `need` device px: the level that is sharp enough plus the one below it
 *  (shown underneath while the sharper pieces load). Only pieces inside `area` are returned. */
export function planPieces(cfg: Pick<PlanMapConfig, 'viewW' | 'levels'>, need: number, area: PlanArea): PlanPiece[] {
  let k = -1;
  for (let i = 0; i < cfg.levels.length; i++) if (need > (i ? cfg.levels[i - 1].w : cfg.viewW) * 1.15) k = i;
  const out: PlanPiece[] = [], m = .01;
  for (const i of k > 0 ? [k - 1, k] : k === 0 ? [0] : []) {
    const L = cfg.levels[i], n = L.grid;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if ((c + 1) / n < area.u0 - m || c / n > area.u1 + m || (r + 1) / n < area.v0 - m || r / n > area.v1 + m) continue;
      out.push({key: i + ':' + r + ':' + c, src: L.src(r, c), left: `${c * 100 / n}%`, top: `${r * 100 / n}%`, width: `${100 / n}%`, height: `${100 / n}%`});
    }
  }
  return out;
}

/** Lot positions read from the PDF, loaded once on demand (≈ 120 KB). Codes are matched case-insensitively, D ≡ Đ. */
let lots: Record<string, [number, number]> | null = null, loading: Promise<Record<string, [number, number]>> | null = null;
export const loadLots = () => lots ? Promise.resolve(lots) : (loading ||= import('./saigon-park-lots').then(m => (lots = m.SAIGON_PARK_LOTS)));
export const lotsReady = () => lots;
export function lotOf(code: string, table = lots): [number, number] | undefined {
  if (!table) return;
  const c = code.trim().toUpperCase();
  return table[c] || table[c.replace(/^D(?=LCV)/, 'Đ')] || table[c.replace(/^Đ/, 'D')];
}

import {fundFromGroup, type UnitPin} from './plan-funds';

/** Map-layer pins plus positions taken from unit cards drawn on the same plan (an explicit map pin wins). */
export function withCardPins(projectId: string, pins: UnitPin[], records: {kind: string; id: string; data: any}[]): UnitPin[] {
  const src = PLAN_MAPS[projectId]?.cardSrc; if (!src) return pins;
  const have = new Set(pins.filter(p => p.layer === 'map').map(p => p.code.trim().toUpperCase()));
  const extra = records.filter(r => r.kind === 'unit-card' && r.id.startsWith(projectId + '|') && !r.id.endsWith('|*') && r.data?.plan?.src === src)
    .map((r): UnitPin => ({projectId, code: r.id.slice(projectId.length + 1), layer: 'map', x: Number(r.data.plan.x), y: Number(r.data.plan.y), fund: fundFromGroup()}))
    .filter(p => !have.has(p.code) && Number.isFinite(p.x) && Number.isFinite(p.y));
  return [...pins, ...extra];
}
