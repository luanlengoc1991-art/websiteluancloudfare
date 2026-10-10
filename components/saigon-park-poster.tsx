'use client';
/* Vinhomes Saigon Park unit poster (1512 × 2044), the owner's former studio layout rebuilt natively: every layer is an R2 image
 * + live text from the Google Sheet. Everyone gets the filter list and JPEG download; only admins see the editing tools. */
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, ChevronRight, Clock, Download, Expand, FileArchive, ImagePlus, Images, MapPin, Pencil, RotateCcw, Save, Search, SlidersHorizontal, X} from 'lucide-react';
import {toast} from 'sonner';
import type {Asset, Project, Unit} from '@/lib/catalog';
import {type CardSpot, type UnitCard, cardId, mergeCard} from '@/lib/unit-card';
import {saigonParkModelColor, saigonParkModelImage} from '@/lib/saigon-park-models';
import {sized} from '@/lib/img';
import {SAIGON_PARK_STREETS} from '@/lib/saigon-park-streets';
import {PLAN_MAPS, SGP_MAP, SGP_MAP_W, SGP_MAP_H, planPieces, loadLots, lotsReady, lotOf, type PlanArea} from '@/lib/plan-maps';

const F = (id: string) => `/api/files/${id}`;
/** Master plan sgp-map-v4 (owner's vector PDF). Spots saved on the older plans (sgp-map-new, sgp-map-v3) are replaced
 *  by the lot position read from the PDF. */
const MAP = SGP_MAP;
const fmt = (n: number) => n.toLocaleString('en-US', {maximumFractionDigits: 2});
const vn = (n: number) => n.toLocaleString('vi-VN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const when = (t?: number) => t ? new Date(t).toLocaleString('vi-VN', {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'}) : '';
/** Small frame shows ~1/16 of the plan width: 5–6 rows of lots around the unit with street names readable. */
const defaultPlan: CardSpot = {src: MAP, x: 50, y: 50, zoom: 16};
const defaultPin: CardSpot = {src: F('sgp-aerial-v2'), x: 43.3, y: 82.3, zoom: 1};
type Slot = 'house' | 'plan';
/** Where the unit point sits inside the small plan frame (% of the frame). */
// Pin head (round icon) in the middle of the frame: the tip sits 51% of the marker height (≈44% of the frame) below it.
const PIN_X = 50, PIN_Y = 72.4;
/** Locator icon (owner's file): the label is filled with the unit code; the pin tip marks the spot. */
const Marker = ({code, className = '', style, onPointerDown, onClick}: {code: string; className?: string; style?: React.CSSProperties; onPointerDown?: React.PointerEventHandler; onClick?: React.MouseEventHandler}) =>
  <span className={'spm ' + className} style={style} onPointerDown={onPointerDown} onClick={onClick}><img src={F('sgp-marker-v2')} alt="" draggable={false}/><b>{code}</b></span>;
const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;

/* sgp-map-v4 is drawn light: a 2560 px base, then only the pieces inside the visible area at the sharpness the zoom
 * needs (lib/plan-maps.ts planPieces) – the same pyramid as Quỹ căn 360°. */
const MAP_RATIO = SGP_MAP_H / SGP_MAP_W, MAP_BASE = MAP, PYRAMID = PLAN_MAPS['saigon-park'];
type Area = PlanArea;
function MapTiles({area, need}: {area: Area; need: number}) {
  return <>{planPieces(PYRAMID, need, area).map(q => <img key={q.key} className="spp-tl" src={q.src} alt="" decoding="async" draggable={false} style={{left: q.left, top: q.top, width: q.width, height: q.height}}/>)}</>;
}
/** Small plan frame on the poster: 92.9% × 21.5% of a 1512 × 2044 poster. */
const FRAME_W = .929 * 1512, FRAME_RATIO = (.215 * 2044) / FRAME_W;

const auto = (code: string) => {const at = lotOf(code, lotsReady()); return at ? {x: at[0], y: at[1]} : {};};

/** Resolved poster content for one unit. */
function resolve(unit: Unit, base?: UnitCard, own?: UnitCard) {
  const card = mergeCard(base, own), f = card.fields || {};
  return {
    card, f,
    plan: {...defaultPlan, ...(card.plan?.src === MAP && own?.plan ? card.plan : {zoom: card.plan?.src === MAP && card.plan.zoom ? card.plan.zoom : defaultPlan.zoom}), ...auto(unit.code)},
    pin: own?.master?.src?.includes('sgp-aerial-v2') ? {...defaultPin, ...own.master} : defaultPin,
    house: own?.perspective || saigonParkModelImage(f.model || unit.model) || card.perspective || F('sgp-model-16'),
  };
}

/** Pointer drag helper: reports the movement as a fraction of the given element's size. */
function useDrag(onMove: (fx: number, fy: number, done: boolean) => void) {
  return (e: React.PointerEvent<HTMLElement>, box: HTMLElement) => {
    e.preventDefault(); e.stopPropagation();
    const r = box.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY;
    const move = (ev: PointerEvent) => onMove((ev.clientX - x0) / r.width, (ev.clientY - y0) / r.height, false);
    const up = (ev: PointerEvent) => {window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); onMove((ev.clientX - x0) / r.width, (ev.clientY - y0) / r.height, true);};
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
}

/** The poster itself (also rendered off-screen for the ZIP export and as the live preview in the editor).
 *  Small plan: the unit point sits under the pin (frame centre); dragging the pin moves the point on the plan. */
function PosterArt({unit, status, data, tool, onPoster, onPlan, onHouse, onPlanPoint, onPin}: {
  unit: Unit; status: string; data: ReturnType<typeof resolve>; tool?: string | null;
  onPoster?: (x: number, y: number) => void; onPlan?: () => void; onHouse?: () => void;
  onPlanPoint?: (x: number, y: number) => void; onPin?: (x: number, y: number) => void;
}) {
  const {f, plan, pin, house} = data;
  const [ghost, setGhost] = useState<{dx: number; dy: number} | null>(null), [pinGhost, setPinGhost] = useState<{dx: number; dy: number} | null>(null);
  const planBox = useRef<HTMLButtonElement>(null), posterBox = useRef<HTMLDivElement>(null);
  const dragPlan = useDrag((fx, fy, done) => {
    if (!done) {setGhost({dx: fx, dy: fy}); return;}
    setGhost(null);
    // frame fraction → plan percent: the plan image is `zoom` frames wide; its height follows the image ratio (≈ 0.516 of its width).
    const box = planBox.current, im = box?.querySelector('img'); if (!onPlanPoint || !box || !im || !(fx || fy)) return;
    const imgRatio = im.naturalHeight / im.naturalWidth || .5165, frameRatio = box.clientHeight / box.clientWidth;
    onPlanPoint(clamp(plan.x + fx * 100 / plan.zoom), clamp(plan.y + fy * 100 * frameRatio / (plan.zoom * imgRatio)));
  });
  const dragPin = useDrag((fx, fy, done) => {
    if (!done) {setPinGhost({dx: fx, dy: fy}); return;}
    setPinGhost(null);
    if (onPin && (fx || fy)) onPin(clamp(pin.x + fx * 100), clamp(pin.y + fy * 100));
  });
  const price = f.price || (unit.price ? fmt(unit.price) : '');
  const facts: [string, string][] = [
    ['Loại hình:', f.type || unit.type], ['TCBG:', f.group || unit.group],
    ['DT Đất:', f.area || (unit.area ? fmt(unit.area) + ' m²' : '')], ['DTXD:', f.builtArea || (unit.builtArea ? fmt(unit.builtArea) + ' m²' : '')],
  ];
  return <div ref={posterBox} className={'spp' + (tool === 'pin' ? ' is-pinning' : '') + (onPlanPoint ? ' is-editable' : '')} onClick={e => {
    if (tool !== 'pin' || !onPoster) return;
    const r = e.currentTarget.getBoundingClientRect();
    onPoster(Math.round((e.clientX - r.left) / r.width * 1000) / 10, Math.round((e.clientY - r.top) / r.height * 1000) / 10);
  }}>
    <img className="spp-aerial2" src={sized(F('sgp-aerial-v2'), 1520)} alt="Phối cảnh tổng Vinhomes Saigon Park"/>
    <button type="button" className="spp-house" onClick={e => {if (tool !== 'pin' && onHouse) {e.stopPropagation(); onHouse();}}} aria-label="Xem ảnh nhà lớn"><img src={sized(house, 1520)} alt={`Mẫu nhà ${unit.model || ''}`}/></button>
    <img className="spp-strip2" src={sized(F('sgp-strip-v2'), 1520)} alt=""/>
    <span className="spp-script">{f.title || 'Mã căn'}</span>
    <b className="spp-code">{unit.code}</b>
    {facts.map(([k, v], i) => <span key={k} className={'spp-fact is-' + i}><i>{k}</i><em>{v || 'Đang cập nhật'}</em></span>)}
    <div className="spp-price"><img src={F('sgp-price-bg')} alt=""/><small>GIÁ BÁN<br/>(CHƯA VAT + KPBT)</small>
      {price ? <b>{price}<sup>TỶ</sup></b> : <b className="is-contact">LIÊN HỆ</b>}</div>
    <button type="button" ref={planBox} className="spp-plan" onClick={e => {if (tool !== 'pin' && onPlan) {e.stopPropagation(); onPlan();}}} aria-label="Xem mặt bằng lớn">
      {plan.src === MAP ? <div className="spp-planmap" style={{left: PIN_X + '%', top: PIN_Y + '%', width: `${plan.zoom * 100}%`, transform: `translate(-${plan.x}%, -${plan.y}%)`}}>
        <img className="spp-tl-base" src={MAP_BASE} alt={`Mặt bằng chỉ căn ${unit.code}`} draggable={false}/>
        <MapTiles need={plan.zoom * FRAME_W} area={{u0: plan.x / 100 - PIN_X / 100 / plan.zoom, u1: plan.x / 100 + (1 - PIN_X / 100) / plan.zoom,
          v0: plan.y / 100 - PIN_Y / 100 * FRAME_RATIO / (plan.zoom * MAP_RATIO), v1: plan.y / 100 + (1 - PIN_Y / 100) * FRAME_RATIO / (plan.zoom * MAP_RATIO)}}/>
      </div>
      : <img src={plan.zoom > 1.6 ? plan.src : sized(plan.src, 2560)} alt={`Mặt bằng chỉ căn ${unit.code}`} draggable={false} style={{left: PIN_X + '%', top: PIN_Y + '%', width: `${plan.zoom * 100}%`, transform: `translate(-${plan.x}%, -${plan.y}%)`}}/>}
      <Marker code={unit.code} className={'is-inset' + (onPlanPoint ? ' is-drag' : '')} style={{left: `calc(${PIN_X}% + ${(ghost?.dx || 0) * 100}%)`, top: `calc(${PIN_Y}% + ${(ghost?.dy || 0) * 100}%)`}}
        onPointerDown={onPlanPoint ? e => dragPlan(e as React.PointerEvent<HTMLElement>, planBox.current!) : undefined} onClick={onPlanPoint ? e => e.stopPropagation() : undefined}/>
      {onPlan && !onPlanPoint && <span className="spp-zoomhint"><Expand size={12}/>Xem lớn</span>}
    </button>
    <Marker code={unit.code} className={'is-aerial' + (onPin ? ' is-drag' : '')} style={{left: `calc(${pin.x}% + ${(pinGhost?.dx || 0) * 100}%)`, top: `calc(${pin.y}% + ${(pinGhost?.dy || 0) * 100}%)`}}
      onPointerDown={onPin ? e => dragPin(e as React.PointerEvent<HTMLElement>, posterBox.current!) : undefined}/>
    {status !== 'Còn hàng' && <span className="spp-sold">{status}</span>}
    {tool === 'pin' && <span className="spp-hint">Bấm hoặc kéo ghim để đặt vị trí {unit.code} trên phối cảnh</span>}
  </div>;
}

/** Big plan: mouse wheel zooms around the cursor, buttons zoom around the unit; click or drag the pin to place it. */
/** Big plan: wheel zooms around the cursor, buttons zoom around the centre; drag = pan; click or drag the pin to place it.
 *  Gestures move the layer on the GPU and the plan is re-laid out at its real size ~140 ms after they stop (sharp, no
 *  per-tick re-render). Zoom stops at the plan's native resolution, so it never magnifies past what the image holds. */
function BigPlan({plan, code, editable, onPoint}: {plan: CardSpot; code: string; editable: boolean; onPoint: (x: number, y: number) => void}) {
  type View = {s: number; x: number; y: number};
  const box = useRef<HTMLDivElement>(null), img = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState(''), [focus, setFocus] = useState<{x: number; y: number; name: string} | null>(null);
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/^tl\s*(?=\d)/, 'tuong lai ').replace(/^as\s*(?=\d)/, 'anh sang ').replace(/^dlcv\s*(?=\d)/, 'dai lo cong vien ').replace(/\s+/g, ' ').trim();
  const hits = q.trim() ? SAIGON_PARK_STREETS.filter(st => (norm(st.name) + ' ').includes(norm(q) + (/\d$/.test(q.trim()) ? ' ' : ''))).slice(0, 12) : [];
  const isMap = plan.src === MAP;
  const [size, setSize] = useState({w: 0, h: 0}), [dpr, setDpr] = useState(1), [shape, setShape] = useState(.75), [nat, setNat] = useState(2560);
  const ratio = isMap ? MAP_RATIO : shape, bw = size.w, bh = size.h;
  const maxS = bw ? Math.max(2, (isMap ? SGP_MAP_W : nat) / (bw * dpr)) : 10, maxRef = useRef(maxS); maxRef.current = maxS;
  const [t, setT] = useState<View>({s: 2, x: 0, y: 0});
  const live = useRef<View>(t), shown = useRef<View>(t), settle = useRef(0), frame = useRef(0), ready = useRef(false);
  shown.current = t;
  const commit = (n: View) => {live.current = n; window.clearTimeout(settle.current); setT(n);};
  const preview = (n: View) => {
    live.current = n;
    if (!frame.current) frame.current = requestAnimationFrame(() => {
      frame.current = 0; const el = img.current; if (!el) return;
      const L = live.current, k = L.s / shown.current.s;
      el.style.transform = `translate(${L.x}px,${L.y}px) scale(${k})`; el.style.setProperty('--k', String(1 / k));
    });
    window.clearTimeout(settle.current); settle.current = window.setTimeout(() => setT(live.current), 140);
  };
  useLayoutEffect(() => {const el = img.current; if (!el) return; el.style.transform = `translate(${t.x}px,${t.y}px)`; el.style.setProperty('--k', '1');}, [t]);
  useEffect(() => {
    const b = box.current; if (!b) return;
    setDpr(Math.min(window.devicePixelRatio || 1, 2));
    const ro = new ResizeObserver(() => setSize({w: b.clientWidth, h: b.clientHeight})); ro.observe(b);
    return () => {ro.disconnect(); window.clearTimeout(settle.current); cancelAnimationFrame(frame.current);};
  }, []);
  /** View with the plan point (x, y in %) in the middle of the box at scale s. */
  const around = (s: number, x: number, y: number): View => ({s, x: bw / 2 - x / 100 * bw * s, y: bh / 2 - y / 100 * bw * s * ratio});
  useEffect(() => {if (bw && !ready.current) {ready.current = true; commit(around(Math.min(2, maxS), plan.x, plan.y));}}, [bw, bh]); // eslint-disable-line react-hooks/exhaustive-deps
  const centre = () => commit(around(live.current.s, plan.x, plan.y));
  const goTo = (st: {x: number; y: number; name: string}) => {setFocus(st); setQ(''); commit(around(Math.min(maxS, Math.max(4, live.current.s)), st.x, st.y)); setTimeout(() => setFocus(f => f === st ? null : f), 4000);};
  const zoomAt = (k: number, cx: number, cy: number, now = false) => {
    const o = live.current, s = Math.min(maxRef.current, Math.max(1, o.s * k)), f = s / o.s, n = {s, x: cx - (cx - o.x) * f, y: cy - (cy - o.y) * f};
    if (now) commit(n); else preview(n);
  };
  useEffect(() => {
    const b = box.current; if (!b) return;
    const wheel = (e: WheelEvent) => {e.preventDefault(); const r = b.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX - r.left, e.clientY - r.top);};
    b.addEventListener('wheel', wheel, {passive: false});
    return () => b.removeEventListener('wheel', wheel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [ghost, setGhost] = useState<{dx: number; dy: number} | null>(null);
  const drag = useDrag((fx, fy, done) => {if (!done) {setGhost({dx: fx, dy: fy}); return;} setGhost(null); if (fx || fy) onPoint(clamp(plan.x + fx * 100), clamp(plan.y + fy * 100));});
  // Hold and move = pan the map; a click without moving = place the unit.
  const moved = useRef(false), [panning, setPanning] = useState(false);
  const pan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY, o = live.current;
    moved.current = false;
    const move = (ev: PointerEvent) => {const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!moved.current && Math.hypot(dx, dy) < 5) return; if (!moved.current) setPanning(true); moved.current = true; preview({...o, x: o.x + dx, y: o.y + dy});};
    const up = () => {window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setPanning(false);};
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };
  const place = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editable || moved.current || !bw) return;
    const r = box.current!.getBoundingClientRect(), L = live.current;
    onPoint(Math.round((e.clientX - r.left - L.x) / (bw * L.s) * 1000) / 10, Math.round((e.clientY - r.top - L.y) / (bw * L.s * ratio) * 1000) / 10);
  };
  const W = bw * t.s, H = W * ratio, need = W * dpr;
  const area: Area = W ? {u0: -t.x / W, u1: (bw - t.x) / W, v0: -t.y / H, v1: (bh - t.y) / H} : {u0: 0, u1: 0, v0: 0, v1: 0};
  return <div className="spp-big">
    <div className="spp-big-zoom"><button type="button" onClick={() => zoomAt(1 / 1.4, bw / 2, bh / 2, true)} aria-label="Thu nhỏ">−</button><span>{Math.round(t.s * 100)}%</span><button type="button" onClick={() => zoomAt(1.4, bw / 2, bh / 2, true)} aria-label="Phóng to" disabled={t.s >= maxS - .01}>+</button><button type="button" onClick={centre}>Về vị trí căn</button>
      <div className="spp-street"><Search size={14}/><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => {if (e.key === 'Enter' && hits[0]) goTo(hits[0]);}} placeholder="Tìm tên đường… (VD: Tương Lai 12, AS57)" aria-label="Tìm tên đường"/>
        {hits.length > 0 && <ul>{hits.map((st, k) => <li key={k}><button type="button" onClick={() => goTo(st)}>{st.name}</button></li>)}</ul>}
        {q.trim() && !hits.length && <ul><li className="is-empty">Không thấy tên đường</li></ul>}</div><small>Lăn chuột: phóng to / thu nhỏ · Giữ chuột kéo: di chuyển bản đồ{editable ? ' · Bấm: đặt vị trí căn' : ''}</small></div>
    <div ref={box} className={'spp-light-map is-gpu' + (editable ? ' is-edit' : '') + (panning ? ' is-panning' : '')} onPointerDown={pan} onClick={place}>
      <div ref={img} className="spp-big-canvas" style={{width: W, height: H}}>
        {isMap ? <><img className="spp-big-base" src={MAP_BASE} alt="" draggable={false}/><MapTiles area={area} need={need}/></>
          : <><img className="spp-big-base" src={sized(plan.src, 2560)} alt="" draggable={false} onLoad={e => {const i = e.currentTarget; if (i.naturalWidth) setShape(i.naturalHeight / i.naturalWidth);}}/>
            {need > 2560 * 1.15 && <img className="spp-tl" src={plan.src} alt="" draggable={false} style={{left: 0, top: 0, width: '100%', height: '100%'}} onLoad={e => setNat(e.currentTarget.naturalWidth || 2560)}/>}</>}
        {focus && <span className="spp-street-focus" style={{left: focus.x + '%', top: focus.y + '%', scale: 'var(--k,1)'}}><b>{focus.name}</b></span>}
        <Marker code={code} className={'is-big' + (editable ? ' is-drag' : '')} style={{left: `calc(${plan.x}% + ${(ghost?.dx || 0) * 100}%)`, top: `calc(${plan.y}% + ${(ghost?.dy || 0) * 100}%)`, scale: 'var(--k,1)'}}
          onPointerDown={editable ? e => drag(e as React.PointerEvent<HTMLElement>, img.current!) : undefined} onClick={e => e.stopPropagation()}/>
      </div>
    </div>
  </div>;
}

async function snapshot(node: HTMLElement) {
  const {toJpeg} = await import('html-to-image');
  await Promise.all([...node.querySelectorAll('img')].map(i => i.complete && i.naturalWidth ? null : new Promise(r => {i.onload = i.onerror = r;})));
  await document.fonts?.ready;
  return toJpeg(node, {quality: .92, pixelRatio: 1512 / node.clientWidth, cacheBust: false, backgroundColor: '#0b2a22'});
}
const save = (url: string, name: string) => {const a = document.createElement('a'); a.href = url; a.download = name; a.click();};

export default function SaigonParkPoster({project, unit, units, status, statusOf, cards, files, isAdmin, onSaved, onEnableEdit}: {
  project: Project; unit: Unit; units: Unit[]; status: string; statusOf: (u: Unit) => string; cards: Record<string, UnitCard>;
  files: Asset[]; isAdmin: boolean; onSaved: () => unknown; onEnableEdit?: () => void;
}) {
  // Lot positions from the PDF place every unit on the plan; render again once they are loaded.
  const [, setLotsLoaded] = useState(!!lotsReady());
  useEffect(() => {if (!lotsReady()) loadLots().then(() => setLotsLoaded(true));}, []);
  const autoPinned = auto(unit.code).x !== undefined;
  const base = cards[project.id + '|*'], own = cards[cardId(project.id, unit.code)];
  const [edit, setEdit] = useState(false), [busy, setBusy] = useState(''), [tool, setTool] = useState<'pin' | null>(null);
  const [view, setView] = useState<Slot | null>(null), [pick, setPick] = useState<Slot | null>(null);
  const [draft, setDraft] = useState<UnitCard>(mergeCard(base, own));
  useEffect(() => {if (!edit) setDraft(mergeCard(base, own));}, [own, base, edit, unit.id]);
  const data = edit ? (() => {const d = resolve(unit, undefined, {...draft, perspective: draft.perspective !== base?.perspective ? draft.perspective : undefined}); return {...d, plan: {...defaultPlan, ...(draft.plan?.src === MAP ? draft.plan : {zoom: draft.plan?.src === MAP && draft.plan.zoom ? draft.plan.zoom : defaultPlan.zoom}), ...auto(unit.code)}};})() : resolve(unit, base, own);
  const posterRef = useRef<HTMLDivElement>(null), fileInput = useRef<HTMLInputElement>(null), uploadSlot = useRef<Slot>('house');
  const [batch, setBatch] = useState<Unit | null>(null), batchRef = useRef<HTMLDivElement>(null);

  /** Closing the big view saves the admin edits automatically. */
  const closeView = () => {if (isAdmin && edit) saveUnit(); else setView(null);};
  const startEdit = () => {if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);}};
  const setPlan = (p: Partial<CardSpot>) => setDraft(d => ({...d, plan: {...data.plan, ...p}}));
  const setImage = (slot: Slot, url: string) => slot === 'house' ? setDraft(d => ({...d, perspective: url})) : setPlan({src: url});
  async function post(body: object, ok: string) {
    setBusy('save');
    try {
      const r = await fetch('/api/unit-cards', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({projectId: project.id, ...body})});
      const d = await r.json(); if (!r.ok) throw Error(d.error);
      toast.success(ok); await onSaved(); return true;
    } catch (e) {toast.error(e instanceof Error ? e.message : 'Không lưu được.'); return false;} finally {setBusy('');}
  }
  const saveUnit = async () => {
    const fields = Object.fromEntries(Object.entries(draft.fields || {}).filter(([, v]) => v?.trim()));
    if (await post({code: unit.code, card: {...draft, perspective: draft.perspective !== base?.perspective ? draft.perspective : undefined, plan: data.plan, master: data.pin, fields}}, `Đã lưu phiếu ${unit.code}.`)) {setEdit(false); setTool(null); setView(null);}
  };
  const saveDefault = () => post({code: '*', card: {...base, plan: {...data.plan, x: base?.plan?.x ?? 50, y: base?.plan?.y ?? 50, src: MAP}}}, 'Đã lưu độ zoom làm mặc định dự án.');
  const reset = async () => {if (confirm(`Xoá chỉnh sửa riêng của ${unit.code}?`) && await post({code: unit.code, card: null}, 'Đã khôi phục theo Sheet.')) setEdit(false);};

  async function downloadOne() {
    if (!posterRef.current) return;
    setBusy('jpg');
    try {save(await snapshot(posterRef.current.querySelector('.spp') as HTMLElement), `${unit.code}.jpg`);} catch {toast.error('Không tạo được ảnh, thử lại.');} finally {setBusy('');}
  }
  async function downloadAll() {
    setBusy('zip');
    const JSZip = (await import('jszip')).default, zip = new JSZip();
    try {
      for (const [i, u] of units.entries()) {
        setBatch(u); toast.loading(`Đang tạo ${i + 1}/${units.length}: ${u.code}`, {id: 'zip'});
        await new Promise(r => setTimeout(r, 120));
        const node = batchRef.current?.querySelector('.spp') as HTMLElement;
        const url = await snapshot(node);
        zip.file(`${u.code}.jpg`, url.split(',')[1], {base64: true});
      }
      save(URL.createObjectURL(await zip.generateAsync({type: 'blob'})), `Saigon-Park-${units.length}-ma-can.zip`);
      toast.success(`Đã tải ${units.length} ảnh.`, {id: 'zip'});
    } catch {toast.error('Không tạo được file ZIP.', {id: 'zip'});} finally {setBatch(null); setBusy('');}
  }

  return <div className={'spp-wrap' + (edit ? ' is-edit' : '')}>
    <div className="spp-toolbar">
      <button type="button" className="uc-btn is-dark" disabled={!!busy} onClick={downloadOne}><Download size={15}/>{busy === 'jpg' ? 'Đang tạo ảnh…' : 'Tải JPEG căn này'}</button>
      {isAdmin && <button type="button" className="uc-btn" disabled={!!busy} onClick={downloadAll}><FileArchive size={15}/>{busy === 'zip' ? 'Đang tạo ZIP…' : `Tải tất cả ${units.length} JPEG (.ZIP)`}</button>}
      {isAdmin && !edit && <button type="button" className="uc-btn is-gold" onClick={() => {setDraft(mergeCard(base, own)); setEdit(true);}}><Pencil size={15}/>Vẽ căn</button>}
      {isAdmin && <span className="spp-saved"><Clock size={13}/>{own?.updatedAt ? `Lưu lần cuối ${when(own.updatedAt)}${own.updatedBy ? ' · ' + own.updatedBy : ''}` : 'Chưa định vị riêng'}</span>}
    </div>
    {isAdmin && edit && <div className="uc-admin">
      <button type="button" className="uc-btn" onClick={() => setView('plan')}><MapPin size={15}/>Chỉ căn trên mặt bằng</button>
      <button type="button" className={'uc-btn' + (tool === 'pin' ? ' is-dark' : '')} onClick={() => setTool(tool === 'pin' ? null : 'pin')}>Đặt ghim phối cảnh</button>
      <button type="button" className="uc-btn" onClick={() => setView('house')}><ImagePlus size={15}/>Ảnh nhà</button>
      <button type="button" className="uc-btn is-dark" disabled={!!busy} onClick={saveUnit}><Save size={15}/>Lưu căn này</button>
      <button type="button" className="uc-btn" disabled={!!busy} onClick={saveDefault} title="Độ zoom mặt bằng dùng cho mọi căn"><Check size={15}/>Zoom mặc định</button>
      {own && <button type="button" className="uc-btn" disabled={!!busy} onClick={reset}><RotateCcw size={15}/>Khôi phục</button>}
      <button type="button" className="uc-btn" onClick={() => {setEdit(false); setTool(null);}}><X size={15}/>Huỷ</button>
    </div>}

    <div ref={posterRef}><PosterArt unit={unit} status={status} data={data} tool={edit ? tool : null}
      onPlanPoint={isAdmin && edit && !autoPinned ? (x, y) => setPlan({x, y}) : undefined} onPin={isAdmin && edit ? (x, y) => setDraft(d => ({...d, master: {...data.pin, src: F('sgp-aerial-v2'), x, y}})) : undefined}
      onPoster={(x, y) => setDraft(d => ({...d, master: {...data.pin, src: F('sgp-aerial-v2'), x, y}}))} onPlan={() => setView('plan')} onHouse={() => setView('house')}/></div>

    {isAdmin && edit && <div className="uc-form">
      {([['title', 'Dòng chữ'], ['type', 'Loại hình'], ['group', 'TCBG'], ['model', 'Mẫu nhà'], ['area', 'DT Đất'], ['builtArea', 'DTXD'], ['price', 'Giá (tỷ)'], ['note', 'Ghi chú']] as const).map(([k, l]) =>
        <label key={k} className="uc-in"><span>{l}</span><input value={draft.fields?.[k] || ''} placeholder={String((unit as Record<string, unknown>)[k] || '')} onChange={e => setDraft(d => ({...d, fields: {...d.fields, [k]: e.target.value}}))}/></label>)}
      <p>Ô để trống = lấy theo Google Sheet. Ảnh nhà tự lấy theo cột Mẫu nhà.</p>
    </div>}

    {view && createPortal(<div className="spp-light" role="dialog" aria-label="Xem ảnh lớn" onClick={closeView}>
      <div onClick={e => e.stopPropagation()}>
        <header><b>{view === 'plan' ? `Mặt bằng chỉ căn ${unit.code}` : `Ảnh nhà · ${unit.model || unit.code}`}</b>
          {isAdmin && <span>
            <button type="button" className="uc-btn" onClick={() => {uploadSlot.current = view; if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);} fileInput.current?.click();}}><ImagePlus size={14}/>Thay ảnh</button>
            <button type="button" className="uc-btn" onClick={() => {if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);} setPick(view);}}><Images size={14}/>Thư viện</button>
            {edit && <button type="button" className="uc-btn is-dark" disabled={!!busy} onClick={saveUnit}><Save size={14}/>Lưu</button>}</span>}
          {!isAdmin && onEnableEdit && view === 'plan' && <button type="button" className="uc-btn is-gold" onClick={onEnableEdit} title="Hiện poster xem trước có phối cảnh 3D để kéo ghim định vị"><MapPin size={14}/>Bật định vị căn</button>}
          <button type="button" className="spp-close" onClick={closeView} aria-label="Đóng (tự lưu)"><X size={20}/></button></header>
        {view === 'plan' ? <div className={'spp-light-body' + (isAdmin ? ' has-side' : '')}>
          <BigPlan plan={data.plan} code={unit.code} editable={isAdmin && !autoPinned} onPoint={(x, y) => {startEdit(); setPlan({x, y});}}/>
          {isAdmin && <div className="spp-light-side"><p>{autoPinned ? `Ghim tự động: ${unit.code} được định vị theo đúng lô trên mặt bằng (đọc từ file PDF), không cần đặt tay. Chỉnh độ phóng khung nhỏ bên dưới.` : 'Mã căn này không có trên mặt bằng PDF – bấm hoặc kéo ghim trên mặt bằng lớn, hoặc kéo ghim trên poster để đặt vị trí.'}</p>
            <label className="uc-zoom"><span>Độ phóng khung nhỏ {data.plan.zoom.toFixed(1)}×</span><input type="range" min={8} max={60} step={1} value={data.plan.zoom} onChange={e => {startEdit(); setPlan({zoom: Number(e.target.value)});}}/></label>
            <div className="spp-light-preview"><PosterArt unit={unit} status={status} data={data} onPlanPoint={(x, y) => {startEdit(); setPlan({x, y});}} onPin={(x, y) => {startEdit(); setDraft(d => ({...d, master: {...data.pin, src: F('sgp-aerial-v2'), x, y}}));}}/></div></div>}
        </div> : <div className="spp-light-img"><img src={sized(data.house, 2560)} alt=""/></div>}
      </div>
    </div>, document.body)}
    <input ref={fileInput} type="file" accept="image/*" hidden onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      setBusy('upload');
      try {const form = new FormData(); form.append('file', file); form.append('projectId', project.id); form.append('kind', 'image');
        const r = await fetch('/api/upload', {method: 'POST', body: form}); const d = await r.json(); if (!r.ok) throw Error(d.error);
        setImage(uploadSlot.current, d.url); toast.success('Đã tải ảnh – bấm Lưu để áp dụng.');} catch (err) {toast.error(err instanceof Error ? err.message : 'Lỗi tải ảnh.');} finally {setBusy('');}
    }}/>
    {pick && createPortal(<div className="uc-picker" role="dialog" onClick={() => setPick(null)}><div onClick={e => e.stopPropagation()}>
      <header><b>Chọn {pick === 'plan' ? 'ảnh mặt bằng' : 'ảnh nhà'}</b><button type="button" onClick={() => setPick(null)} aria-label="Đóng"><X size={18}/></button></header>
      <div className="uc-picker-grid">{files.filter(a => a.projectId === project.id && ['model', 'gallery', 'image', 'plan'].includes(a.kind) && !/sgp-(pin|strip|loc|price|logo|marker|map-v3-t)/.test(a.url)).map(a =>
        <button type="button" key={a.url} onClick={() => {setImage(pick, a.url); setPick(null);}}><img src={sized(a.url, 360)} alt="" loading="lazy"/><span>{a.name}</span></button>)}</div>
    </div></div>, document.body)}
    {batch && <div className="spp-offscreen" ref={batchRef} aria-hidden><PosterArt unit={batch} status={statusOf(batch)} data={resolve(batch, base, cards[cardId(project.id, batch.code)])}/></div>}
  </div>;
}

/** Left panel: the studio's unit list with filters (visible to everyone). */
export function SgpFilter({units, code, onPick, statusOf, edited}: {units: Unit[]; code?: string; onPick: (code: string) => void; statusOf: (u: Unit) => string; edited?: Record<string, number>}) {
  const blank = {q: '', status: '', type: '', min: '', max: '', street: '', amin: '', amax: '', dir: '', sort: 'new', done: ''};
  const [v, setV] = useState(blank), [more, setMore] = useState(false);
  const set = (k: keyof typeof blank, x: string) => setV(s => ({...s, [k]: x}));
  const opt = (f: (u: Unit) => string | undefined) => [...new Set(units.map(f).filter((x): x is string => !!x && x !== 'Đang cập nhật'))].sort((a, b) => a.localeCompare(b, 'vi', {numeric: true}));
  const list = useMemo(() => {
    const n = (s: string) => s === '' ? NaN : Number(s.replace(',', '.'));
    const out = units.filter(u => (!v.q || u.code.toLowerCase().includes(v.q.trim().toLowerCase()))
      && (!v.status || statusOf(u) === v.status) && (!v.type || u.type === v.type) && (!v.street || u.tower === v.street) && (!v.dir || u.direction === v.dir)
      && (!v.done || !edited || (v.done === 'yes') === !!edited[u.code]) && !(n(v.min) > u.price) && !(n(v.max) < u.price) && !(n(v.amin) > u.area) && !(n(v.amax) < u.area));
    if (v.sort === 'asc') out.sort((a, b) => (a.price || 1e9) - (b.price || 1e9));
    if (v.sort === 'desc') out.sort((a, b) => b.price - a.price);
    if (v.sort === 'edit' && edited) out.sort((a, b) => (edited[b.code] || 0) - (edited[a.code] || 0));
    if (v.sort === 'az') out.sort((a, b) => a.code.localeCompare(b.code, 'vi', {numeric: true}));
    return out;
  }, [units, v, statusOf, edited]);
  const on = useRef<HTMLButtonElement>(null);
  useEffect(() => {on.current?.scrollIntoView({block: 'nearest'});}, [code]);
  return <aside className="sgf">
    <div className="sgf-head"><span>Quản lý sản phẩm</span><h3>Danh sách mã căn</h3><em>{list.length}/{units.length} mã</em></div>
    <label className="sgf-search"><Search size={16}/><input value={v.q} onChange={e => set('q', e.target.value)} placeholder="Tìm mã căn…"/></label>
    <div className="sgf-row">
      <select value={v.status} onChange={e => set('status', e.target.value)} aria-label="Trạng thái"><option value="">Tất cả trạng thái</option><option>Còn hàng</option><option>Đang giữ chỗ</option><option>Đã bán</option></select>
      <select value={v.type} onChange={e => set('type', e.target.value)} aria-label="Loại căn"><option value="">Tất cả loại căn</option>{opt(u => u.type).map(t => <option key={t}>{t}</option>)}</select>
    </div>
    <div className="sgf-row is-3"><input value={v.min} onChange={e => set('min', e.target.value)} placeholder="Giá từ" inputMode="decimal"/><input value={v.max} onChange={e => set('max', e.target.value)} placeholder="Đến" inputMode="decimal"/>
      <button type="button" className={more ? 'is-on' : ''} onClick={() => setMore(!more)}><SlidersHorizontal size={14}/>Bộ lọc</button></div>
    {more && <div className="sgf-more">
      <label>Dãy / Đường<select value={v.street} onChange={e => set('street', e.target.value)}><option value="">Tất cả dãy / đường</option>{opt(u => u.tower).map(t => <option key={t}>{t}</option>)}</select></label>
      <div className="sgf-row"><label>Diện tích từ (m²)<input value={v.amin} onChange={e => set('amin', e.target.value)} placeholder="0" inputMode="decimal"/></label><label>Đến (m²)<input value={v.amax} onChange={e => set('amax', e.target.value)} placeholder="Không giới hạn" inputMode="decimal"/></label></div>
      <label>Hướng<select value={v.dir} onChange={e => set('dir', e.target.value)}><option value="">Tất cả hướng</option>{opt(u => u.direction).map(t => <option key={t}>{t}</option>)}</select></label>
    </div>}
    <div className="sgf-count"><b>{list.length}</b><span>căn phù hợp</span><button type="button" onClick={() => setV(blank)}>Xoá lọc</button></div>
    <select className="sgf-sort" value={v.sort} onChange={e => set('sort', e.target.value)} aria-label="Sắp xếp"><option value="new">Mới cập nhật</option><option value="asc">Giá thấp đến cao</option><option value="desc">Giá cao đến thấp</option><option value="az">Mã căn A-Z</option>{edited && <option value="edit">Vừa chỉnh sửa</option>}</select>
    {edited && <div className="sgf-admin"><b>Chỉnh sửa (quản trị)</b><span>{Object.keys(edited).length}/{units.length} căn đã định vị</span>
      <select value={v.done} onChange={e => set('done', e.target.value)} aria-label="Lọc theo định vị"><option value="">Tất cả mã</option><option value="yes">Đã định vị</option><option value="no">Chưa định vị</option></select></div>}
    <div className="sgf-list">{list.map(u => <button type="button" key={u.id} ref={u.code === code ? on : undefined} className={(u.code === code ? 'is-on' : '') + (statusOf(u) === 'Còn hàng' ? '' : ' is-sold')} onClick={() => onPick(u.code)}>
      <i style={{background: saigonParkModelColor(u.model)}}/><b>{u.code}{edited?.[u.code] ? <small className="sgf-done" title={'Lưu lần cuối ' + when(edited[u.code])}>✓</small> : null}</b><span>{u.price ? vn(u.price) + ' tỷ' : 'Liên hệ'}</span><ChevronRight size={15}/></button>)}
      {!list.length && <p>Không có căn phù hợp.</p>}</div>
  </aside>;
}
