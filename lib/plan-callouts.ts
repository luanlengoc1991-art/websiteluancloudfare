/** Info-card helpers for the Saigon Park 360° plan: cards may sit outside the plan, an automatic layout that keeps the
 *  arrows from crossing, and a clean JPEG export (plan + price tags + cards + red arrows, no site chrome). */
import type {Unit} from './catalog';
import type {UnitPin} from './plan-funds';

/** Projects whose cards may be dragged outside the plan, with red arrows and the export button. */
export const CALLOUT_OUTSIDE = new Set(['saigon-park']);
export const CALLOUT_MIN = -80, CALLOUT_MAX = 180;
/** On-screen card size (px) used for the layout. */
export const CARD_W = 210, CARD_H = 150, GAP = 14;

/** Reference plan width (px) the layout and the downloaded image are computed for: cards keep this proportion. */
export const LAYOUT_W = 1800;
type Pt = {code: string; x: number; y: number};
/** Cards on rings of slots around the plan. Units and slots are both sorted by their angle around the plan centre and
 *  matched in that order (DP, least total arrow length), so neighbouring units get neighbouring cards and arrows do not
 *  cross. A further ring opens only when the first one is full. Returns % of the plan. */
export function arrangeCallouts(pts: Pt[], planW = LAYOUT_W, planH = LAYOUT_W * .7): Record<string, {x: number; y: number}> {
  const W = planW, H = planH, cx = W / 2, cy = H / 2, slots: {x: number; y: number}[] = [];
  for (let k = 0; slots.length < pts.length || k === 0; k++) {
    const ox = GAP + CARD_W / 2 + k * (CARD_W + GAP), oy = GAP + CARD_H / 2 + k * (CARD_H + GAP);
    const nx = Math.max(1, Math.floor((W + 2 * k * (CARD_W + GAP)) / (CARD_W + GAP))), ny = Math.max(1, Math.floor((H + 2 * k * (CARD_H + GAP)) / (CARD_H + GAP)));
    const xs = (n: number) => Array.from({length: n}, (_, i) => -k * (CARD_W + GAP) + (i + .5) * (W + 2 * k * (CARD_W + GAP)) / n);
    const ys = (n: number) => Array.from({length: n}, (_, i) => -k * (CARD_H + GAP) + (i + .5) * (H + 2 * k * (CARD_H + GAP)) / n);
    for (const x of xs(nx)) slots.push({x, y: -oy}, {x, y: H + oy});
    for (const y of ys(ny)) slots.push({x: -ox, y}, {x: W + ox, y});
    for (const [sx, sy] of [[-ox, -oy], [W + ox, -oy], [-ox, H + oy], [W + ox, H + oy]]) slots.push({x: sx, y: sy});
    if (k > 6) break;
  }
  const ang = (x: number, y: number) => Math.atan2(y - cy, x - cx);
  const P = pts.map(p => ({...p, px: p.x / 100 * W, py: p.y / 100 * H})).map(p => ({...p, a: ang(p.px, p.py)}));
  const S = slots.map(s => ({...s, a: ang(s.x, s.y)}));
  // try every rotation of the slot circle and keep the cheapest order-preserving match
  P.sort((a, b) => a.a - b.a); S.sort((a, b) => a.a - b.a);
  const n = P.length, m = S.length, d = (i: number, j: number) => Math.hypot(P[i].px - S[j].x, P[i].py - S[j].y);
  let best: number[] = [], bestCost = Infinity;
  const steps = Math.min(m, 24);
  for (let r = 0; r < steps; r++) {
    const off = Math.round(r * m / steps), sj = (j: number) => (j + off) % m;
    const dp = Array.from({length: n + 1}, () => new Float64Array(m + 1).fill(Infinity)), ch = Array.from({length: n + 1}, () => new Int8Array(m + 1));
    for (let j = 0; j <= m; j++) dp[0][j] = 0;
    for (let i = 1; i <= n; i++) for (let j = i; j <= m; j++) {
      const skip = dp[i][j - 1], take = dp[i - 1][j - 1] + d(i - 1, sj(j - 1));
      if (take <= skip) {dp[i][j] = take; ch[i][j] = 1;} else dp[i][j] = skip;
    }
    if (dp[n][m] < bestCost) {
      bestCost = dp[n][m]; const pick: number[] = []; let i = n, j = m;
      while (i > 0) {if (ch[i][j]) {pick[i - 1] = sj(j - 1); i--;} j--;}
      best = pick;
    }
  }
  // untangle: swap the cards of two arrows that cross whenever that lowers the number of crossings
  const segOf = (i: number, j: number) => {const e = edgePoint(S[j].x, S[j].y, P[i].px, P[i].py, CARD_W / 2, CARD_H / 2); return [e.x, e.y, P[i].px, P[i].py];};
  const side = (p: number[], q: number[], r: number[]) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const hits = (u: number[], v: number[]) => {const [a, b, c, e] = [[u[0], u[1]], [u[2], u[3]], [v[0], v[1]], [v[2], v[3]]]; return side(a, b, c) * side(a, b, e) < 0 && side(c, e, a) * side(c, e, b) < 0;};
  const crossCount = (i: number) => {let k = 0; const si = segOf(i, best[i]); for (let j = 0; j < n; j++) if (j !== i && hits(si, segOf(j, best[j]))) k++; return k;};
  for (let pass = 0; pass < 30; pass++) {
    let changed = false;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (!hits(segOf(i, best[i]), segOf(j, best[j]))) continue;
      const before = crossCount(i) + crossCount(j);
      [best[i], best[j]] = [best[j], best[i]];
      if (crossCount(i) + crossCount(j) < before) changed = true; else [best[i], best[j]] = [best[j], best[i]];
    }
    if (!changed) break;
  }
  const out: Record<string, {x: number; y: number}> = {};
  P.forEach((p, i) => {const s = S[best[i]]; out[p.code] = {x: clamp(s.x / W * 100), y: clamp(s.y / H * 100)};});
  return out;
}
const clamp = (n: number) => Math.round(Math.min(CALLOUT_MAX, Math.max(CALLOUT_MIN, n)) * 100) / 100;

/** Point where the segment from (x1,y1) towards (cx,cy) leaves a box of half size hw × hh centred on (x1,y1). */
export function edgePoint(x1: number, y1: number, cx: number, cy: number, hw: number, hh: number) {
  const dx = cx - x1, dy = cy - y1, f = Math.min(Math.abs(dx) > 1e-6 ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? hh / Math.abs(dy) : Infinity, 1);
  return {x: x1 + dx * f, y: y1 + dy * f};
}

type Tone = '' | 'red' | 'green' | 'blue' | 'held' | 'sold';
const TAG: Record<Tone, [string, string]> = {'': ['#b88a2c', '#8d6614'], red: ['#ef4444', '#b91c1c'], green: ['#22c55e', '#15803d'], blue: ['#3b82f6', '#1d4ed8'], held: ['#ef4444', '#b91c1c'], sold: ['#94a3b8', '#94a3b8']};
const loadImg = (src: string) => new Promise<HTMLImageElement>((ok, no) => {const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src;});
const round = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {c.beginPath(); c.roundRect(x, y, w, h, r);};

export type ExportTag = {pin: UnitPin; unit: Unit; tone: Tone; price: string};
export type ExportCard = {pin: UnitPin; unit: Unit; rows: [string, string][]; price: string; status: string};
/** Draws the plan (one tile level), the arrows, the price tags and the cards on a canvas and returns a JPEG blob.
 *  planPx = plan width in the image; screenPlanW = plan width on screen at fit (cards keep their on-screen proportion). */
export async function exportPlanImage(o: {
  tiles: {grid: number; src: (r: number, c: number) => string}; ratio: number; planPx: number; screenPlanW: number;
  tags: ExportTag[]; cards: ExportCard[]; title: string;
}): Promise<Blob> {
  const PW = o.planPx, PH = Math.round(PW * o.ratio), u = PW / o.screenPlanW; // screen px → image px
  const cw = CARD_W * u, ch = CARD_H * u, pad = 30 * u;
  let x0 = 0, y0 = 0, x1 = PW, y1 = PH;
  for (const c of o.cards) {const cx = c.pin.callout!.x / 100 * PW, cy = c.pin.callout!.y / 100 * PH; x0 = Math.min(x0, cx - cw / 2); x1 = Math.max(x1, cx + cw / 2); y0 = Math.min(y0, cy - ch / 2); y1 = Math.max(y1, cy + ch / 2);}
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const cv = document.createElement('canvas'); cv.width = Math.round(x1 - x0); cv.height = Math.round(y1 - y0);
  const c = cv.getContext('2d')!; c.fillStyle = '#eef3f1'; c.fillRect(0, 0, cv.width, cv.height); c.translate(-x0, -y0);
  // plan tiles
  const n = o.tiles.grid, jobs: Promise<void>[] = [];
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) jobs.push(loadImg(o.tiles.src(r, k)).then(img => {c.drawImage(img, k * PW / n, r * PH / n, PW / n + 1, PH / n + 1);}));
  await Promise.all(jobs);
  const font = (w: number, px: number) => `${w} ${px * u}px Manrope, Mulish, Arial, sans-serif`;
  // arrows
  c.strokeStyle = '#e11d2a'; c.fillStyle = '#e11d2a'; c.lineWidth = 2.2 * u; c.lineCap = 'round';
  for (const d of o.cards) {
    const ax = d.pin.callout!.x / 100 * PW, ay = d.pin.callout!.y / 100 * PH, tx = d.pin.x / 100 * PW, ty = d.pin.y / 100 * PH - 14 * u;
    const s = edgePoint(ax, ay, tx, ty, cw / 2, ch / 2), e = edgePoint(tx, ty, ax, ay, 24 * u, 15 * u);
    c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(e.x, e.y); c.stroke();
    const ang = Math.atan2(e.y - s.y, e.x - s.x), L = 11 * u;
    c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x - L * Math.cos(ang - .45), e.y - L * Math.sin(ang - .45)); c.lineTo(e.x - L * Math.cos(ang + .45), e.y - L * Math.sin(ang + .45)); c.closePath(); c.fill();
  }
  // price tags
  for (const t of o.tags) {
    const x = t.pin.x / 100 * PW, y = t.pin.y / 100 * PH; c.font = font(800, 12);
    const w = c.measureText(t.price).width + 14 * u, h = 20 * u, [a, b] = TAG[t.tone];
    const g = c.createLinearGradient(0, y - h - 6 * u, 0, y - 6 * u); g.addColorStop(0, a); g.addColorStop(1, b);
    c.fillStyle = g; round(c, x - w / 2, y - h - 6 * u, w, h, 7 * u); c.fill();
    c.strokeStyle = '#f4d78b'; c.lineWidth = 1.5 * u; c.stroke();
    c.beginPath(); c.moveTo(x - 5 * u, y - 6 * u); c.lineTo(x + 5 * u, y - 6 * u); c.lineTo(x, y); c.closePath(); c.fillStyle = b; c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t.price, x, y - 6 * u - h / 2);
  }
  // cards
  for (const d of o.cards) {
    const cx = d.pin.callout!.x / 100 * PW, cy = d.pin.callout!.y / 100 * PH, x = cx - cw / 2, y = cy - ch / 2;
    c.fillStyle = '#04261cf2'; round(c, x, y, cw, ch, 14 * u); c.fill(); c.strokeStyle = '#e11d2a'; c.lineWidth = 1.5 * u; c.stroke();
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#8ef0c4'; c.font = font(900, 17); c.fillText(d.unit.code, x + 14 * u, y + 26 * u);
    let ry = y + 46 * u;
    for (const [k, v] of d.rows.slice(0, 4)) {
      c.font = font(500, 11.5); c.fillStyle = '#a7c9bb'; c.textAlign = 'left'; c.fillText(k, x + 14 * u, ry);
      c.font = font(700, 11.5); c.fillStyle = '#fff'; c.textAlign = 'right'; c.fillText(v, x + cw - 14 * u, ry); ry += 17 * u;
    }
    c.strokeStyle = '#ffffff22'; c.lineWidth = u; c.beginPath(); c.moveTo(x + 14 * u, y + ch - 30 * u); c.lineTo(x + cw - 14 * u, y + ch - 30 * u); c.stroke();
    c.textAlign = 'left'; c.font = font(800, 15); c.fillStyle = '#fde047'; c.fillText(d.price, x + 14 * u, y + ch - 11 * u);
    c.textAlign = 'right'; c.font = font(800, 12); c.fillStyle = d.status === 'Còn hàng' ? '#8ef0c4' : d.status === 'Đã bán' ? '#cbd5e1' : '#fca5a5'; c.fillText(d.status, x + cw - 14 * u, y + ch - 11 * u);
  }
  return new Promise((ok, no) => cv.toBlob(b => b ? ok(b) : no(new Error('Không tạo được ảnh.')), 'image/jpeg', 0.9));
}
