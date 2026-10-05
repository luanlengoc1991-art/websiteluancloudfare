/** Phân loại quỹ căn trên mặt bằng. Pin đổi màu theo loại quỹ; căn đã bán hiển thị xám. */
export type FundKey = 'exc' | 'share' | 'norm';

export const funds: {key: FundKey; label: string; color: string}[] = [
  {key: 'exc', label: 'Quỹ độc quyền', color: '#e0312b'},
  {key: 'share', label: 'Quỹ ăn chia', color: '#e8a400'},
  {key: 'norm', label: 'Quỹ thường', color: '#1fa45a'},
];

export const soldColor = '#8a93a6';
export const fundKeys = funds.map(f => f.key) as FundKey[];
export const fundMap = new Map(funds.map(f => [f.key, f]));
export const fundColor = (key: string) => fundMap.get(key as FundKey)?.color || funds[0].color;
export const fundLabel = (key: string) => fundMap.get(key as FundKey)?.label || funds[0].label;
export const isFundKey = (v: unknown): v is FundKey => typeof v === 'string' && fundKeys.includes(v as FundKey);

/** Lớp phủ vị trí + loại quỹ cho một mã căn, lưu trong records (kind='pin'). */
export type UnitPin = {projectId: string; code: string; x: number; y: number; fund: FundKey};
export const pinId = (projectId: string, code: string) => `${projectId}|${code.trim().toUpperCase()}`;

/** Suy ra loại quỹ mặc định từ trường group sẵn có của căn. */
export function fundFromGroup(group?: string): FundKey {
  const g = (group || '').toLowerCase();
  if (g.includes('độc quyền') || g.includes('doc quyen')) return 'exc';
  if (g.includes('ăn chia') || g.includes('an chia')) return 'share';
  return 'norm';
}
