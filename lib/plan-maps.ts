/** HD master plans used by the new Quỹ căn 360° tab (components/plan-map-360.tsx). */
export type PlanMapConfig = {image: string; tilePrefix: string; grid: number; width: number; height: number; title: string};
export const PLAN_MAPS: Record<string, PlanMapConfig> = {
  'green-paradise': {image: '/api/files/gp-map', tilePrefix: '/api/files/gp-map-t', grid: 4, width: 15000, height: 10610, title: 'The Haven Bay – Vịnh Tiên'},
};

