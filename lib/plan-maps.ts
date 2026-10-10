/** HD master plans used by the new Quỹ căn 360° tab (components/plan-map-360.tsx).
 *  image = first view (viewW px wide); tiles = grid×grid full-resolution pieces of tileW×tileH px. The viewer adds a
 *  half-size level and 2×2 crops of each tile through /api/img, so it only downloads the sharpness the current zoom needs.
 *  cardSrc: unit positions already placed with "Vẽ căn" on this same plan (unit-card plan spot) become price tags too. */
export type PlanMapConfig = {image: string; viewW: number; tilePrefix: string; grid: number; tileW: number; tileH: number; width: number; height: number; title: string; cardSrc?: string};
export const PLAN_MAPS: Record<string, PlanMapConfig> = {
  'green-paradise': {image: '/api/files/gp-map-view', viewW: 3000, tilePrefix: '/api/files/gp-map-t', grid: 4, tileW: 3750, tileH: 2652, width: 15000, height: 10610, title: 'The Haven Bay – Vịnh Tiên'},
  'saigon-park': {image: '/api/img?v=4&w=2560&q=70&src=%2Fapi%2Ffiles%2Fsgp-map-v3', viewW: 2560, tilePrefix: '/api/files/sgp-map-v3-t', grid: 4, tileW: 3832, tileH: 3018, width: 15332, height: 12072, title: 'Vinhomes Sài Gòn Park', cardSrc: '/api/files/sgp-map-v3'},
};

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
