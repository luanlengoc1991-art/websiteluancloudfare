/** HD master plans used by the new Quỹ căn 360° tab (components/plan-map-360.tsx). */
/** image = first view (~3000 px); tiles = grid×grid full-resolution pieces of tileW×tileH px. The viewer adds a half-size
 *  level and 2×2 crops of each tile through /api/img, so it only downloads the sharpness the current zoom needs. */
export type PlanMapConfig = {image: string; tilePrefix: string; grid: number; tileW: number; tileH: number; width: number; height: number; title: string};
export const PLAN_MAPS: Record<string, PlanMapConfig> = {
  'green-paradise': {image: '/api/files/gp-map-view', tilePrefix: '/api/files/gp-map-t', grid: 4, tileW: 3750, tileH: 2652, width: 15000, height: 10610, title: 'The Haven Bay – Vịnh Tiên'},
};

