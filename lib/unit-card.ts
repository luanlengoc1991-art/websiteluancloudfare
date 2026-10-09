/** "Phiếu căn" drawn on /mat-bang-can for every project except the Green Paradise studio.
 *  D1 records kind 'unit-card', id '<projectId>|<CODE>' for one unit or '<projectId>|*' for the project default.
 *  Numbers come from the unit (Google Sheet); `fields` only override what the admin typed. */
export type CardSpot = {src: string; x: number; y: number; zoom: number};
export type CardFields = Partial<Record<'title' | 'type' | 'group' | 'model' | 'area' | 'builtArea' | 'price' | 'note', string>>;
export type UnitCard = {
  perspective?: string;
  plan?: CardSpot;
  master?: CardSpot;
  fields?: CardFields;
  nearby?: {name: string; distance: string}[];
  updatedAt?: number;
  updatedBy?: string;
};

export const cardId = (projectId: string, code: string) => `${projectId}|${code.trim().toUpperCase()}`;

const img = (v: unknown) => typeof v === 'string' && (/^\/api\/files\/[\w-]{8,64}$/.test(v) || /^https:\/\/[^\s"'<>]{4,1900}$/.test(v)) ? v : '';
const num = (v: unknown, min: number, max: number, d: number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
const txt = (v: unknown, n = 200) => typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, n) : '';
const spot = (v: any): CardSpot | undefined => {const src = img(v?.src); return src ? {src, x: num(v?.x, 0, 100, 50), y: num(v?.y, 0, 100, 50), zoom: num(v?.zoom, 1, 8, 2.5)} : undefined;};

/** Whitelist everything an admin can send. */
export function cleanCard(v: any): UnitCard {
  const fields: CardFields = {};
  for (const k of ['title', 'type', 'group', 'model', 'area', 'builtArea', 'price', 'note'] as const) {const t = txt(v?.fields?.[k], k === 'note' ? 600 : 120); if (t) fields[k] = t;}
  const nearby = Array.isArray(v?.nearby) ? v.nearby.slice(0, 12).map((n: any) => ({name: txt(n?.name, 80), distance: txt(n?.distance, 30)})).filter((n: {name: string}) => n.name) : undefined;
  const out: UnitCard = {perspective: img(v?.perspective) || undefined, plan: spot(v?.plan), master: spot(v?.master), fields: Object.keys(fields).length ? fields : undefined, nearby};
  return JSON.parse(JSON.stringify(out));
}

/** Unit card = project default + the unit's own card (unit wins field by field). */
export function mergeCard(base?: UnitCard, own?: UnitCard): UnitCard {
  return {
    ...base, ...own,
    plan: own?.plan || base?.plan, master: own?.master || base?.master, perspective: own?.perspective || base?.perspective,
    fields: {...base?.fields, ...own?.fields}, nearby: own?.nearby?.length ? own.nearby : base?.nearby,
  };
}
