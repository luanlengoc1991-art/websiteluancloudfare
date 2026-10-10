'use client';
/* Quỹ căn 360° (new design): HD master plan with a small price tag on every unit of the inventory.
 * Visitors: pan/zoom, see how many units are left, click a tag → unit page. Admins: place / drag / remove tags.
 * Light: the first view loads a ~3000 px copy; sharper tiles (half-size, then full-size crops) load only for the visible
 * area when zoomed. Pan/zoom gestures move the layer on the GPU; ~140 ms after the gesture the plan is re-laid out at
 * its real size, so codes are drawn at native resolution instead of a stretched bitmap. */
import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Check, Crosshair, Locate, MapPin, Minus, Pencil, Plus, Search, Trash2, X} from 'lucide-react';
import {toast} from 'sonner';
import type {Project, Unit} from '@/lib/catalog';
import {fundFromGroup, pinId, type UnitPin} from '@/lib/plan-funds';
import {unitPlanPath} from '@/lib/project-routes';
import {sized} from '@/lib/img';

import {PLAN_MAPS} from '@/lib/plan-maps';

const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});
const tag = (n: number) => n ? (Math.round(n * 10) / 10).toLocaleString('en-US', {minimumFractionDigits: 1}) : '—';
const up = (s: string) => s.trim().toUpperCase();

export default function PlanMap360({project, units, pins, statusOf, canManage, onSaved}: {
  project: Project; units: Unit[]; pins: UnitPin[]; statusOf: (u: Unit) => string; canManage: boolean; onSaved: () => unknown;
}) {
  const cfg = PLAN_MAPS[project.id];
  const ratio = cfg.height / cfg.width;
  const view = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({w: 1200, h: 800});
  const [t, setT] = useState({s: 1, x: 0, y: 0});
  type View = {s: number; x: number; y: number};
  // Live view during a gesture is written straight to the DOM (no React render per frame), then committed to state.
  const live = useRef<View>(t), shown = useRef<View>(t), canvas = useRef<HTMLDivElement>(null), settle = useRef(0), frame = useRef(0);
  shown.current = t;
  const commit = (n: View) => {live.current = n; window.clearTimeout(settle.current); setT(n);};
  const preview = (n: View) => {
    live.current = n;
    if (!frame.current) frame.current = requestAnimationFrame(() => {
      frame.current = 0; const el = canvas.current; if (!el) return;
      const L = live.current, k = L.s / shown.current.s;
      el.style.transform = `translate(${L.x}px,${L.y}px) scale(${k})`; el.style.setProperty('--k', String(1 / k));
    });
    window.clearTimeout(settle.current); settle.current = window.setTimeout(() => setT(live.current), 140);
  };
  useLayoutEffect(() => {const el = canvas.current; if (!el) return; el.style.transform = `translate(${t.x}px,${t.y}px)`; el.style.setProperty('--k', '1');}, [t]);
  useEffect(() => () => {window.clearTimeout(settle.current); cancelAnimationFrame(frame.current);}, []);
  const [dpr, setDpr] = useState(1);
  useEffect(() => setDpr(Math.min(window.devicePixelRatio || 1, 2)), []);
  const [local, setLocal] = useState<UnitPin[]>(pins);
  useEffect(() => setLocal(pins), [pins]);
  const [edit, setEdit] = useState(false), [placing, setPlacing] = useState(''), [q, setQ] = useState(''), [only, setOnly] = useState('');
  const [hover, setHover] = useState(''), [flash, setFlash] = useState('');
  // Two modes: visitors' view by default; the administrator switches to "Quản trị viên" to place tags.
  const [admin, setAdmin] = useState(false), [notes, setNotes] = useState(false);
  const showNotes = canManage && admin && notes;
  const pinOf = useMemo(() => new Map(local.map(p => [up(p.code), p])), [local]);
  // content size at scale 1 = image fitted inside the viewport
  const baseW = Math.min(box.w, box.h / ratio), baseH = baseW * ratio;
  const fit = () => commit({s: 1, x: (box.w - baseW) / 2, y: (box.h - baseH) / 2});
  useEffect(() => {
    const el = view.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox({w: el.clientWidth, h: el.clientHeight}));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(fit, [box.w, box.h]); // eslint-disable-line react-hooks/exhaustive-deps
  const zoomAt = (k: number, cx: number, cy: number, now = false) => {
    const o = live.current, s = Math.min(14, Math.max(1, o.s * k)), f = s / o.s, n = {s, x: cx - (cx - o.x) * f, y: cy - (cy - o.y) * f};
    if (now) commit(n); else preview(n);
  };
  useEffect(() => {
    const el = view.current; if (!el) return;
    const wheel = (e: WheelEvent) => {e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX - r.left, e.clientY - r.top);};
    el.addEventListener('wheel', wheel, {passive: false}); return () => el.removeEventListener('wheel', wheel);
  }, []);
  const flyTo = (p: {x: number; y: number}, code?: string) => {
    const s = Math.max(live.current.s, 5);
    commit({s, x: box.w / 2 - p.x / 100 * baseW * s, y: box.h / 2 - p.y / 100 * baseH * s});
    if (code) {setFlash(code); setTimeout(() => setFlash(c => c === code ? '' : c), 2600);}
  };
  // drag to pan; a click without moving places the selected code (admin)
  const moved = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY, o = live.current; moved.current = false;
    const move = (ev: PointerEvent) => {const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!moved.current && Math.hypot(dx, dy) < 5) return; moved.current = true; preview({...o, x: o.x + dx, y: o.y + dy});};
    const upH = () => {window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', upH);};
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', upH);
  };
  const toPct = (cx: number, cy: number) => {const r = view.current!.getBoundingClientRect(), L = live.current; return {x: Math.round(((cx - r.left - L.x) / (baseW * L.s)) * 10000) / 100, y: Math.round(((cy - r.top - L.y) / (baseH * L.s)) * 10000) / 100};};

  async function send(body: object) {
    const r = await fetch('/api/action', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
    if (!r.ok) throw Error((await r.json().catch(() => ({}))).error || 'Không lưu được.');
  }
  async function place(code: string, x: number, y: number) {
    const u = units.find(v => up(v.code) === code);
    const pin: UnitPin = {projectId: project.id, code, layer: 'map', x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)), fund: pinOf.get(code)?.fund || fundFromGroup(u?.group), ...(pinOf.get(code)?.callout ? {callout: pinOf.get(code)!.callout} : {})};
    setLocal(l => [...l.filter(p => up(p.code) !== code), pin]);
    try {await send({action: 'save', kind: 'pin', id: pinId(project.id, code, 'map'), data: pin}); onSaved();} catch (e) {toast.error(e instanceof Error ? e.message : 'Không lưu được vị trí.');}
  }
  async function remove(code: string) {
    setLocal(l => l.filter(p => up(p.code) !== code));
    try {await send({action: 'delete', kind: 'pin', id: pinId(project.id, code, 'map')}); onSaved(); toast.success(`Đã gỡ ${code} khỏi mặt bằng.`);} catch (e) {toast.error(e instanceof Error ? e.message : 'Không gỡ được.');}
  }
  // Info cards (admin): drag the arrow out of a tag, or drag a card to move it; saved with the unit's map pin.
  async function saveCallout(code: string, c?: {x: number; y: number}) {
    const p = pinOf.get(code); if (!p) return;
    const {callout: _old, ...rest} = p; const next: UnitPin = {...rest, layer: 'map', ...(c ? {callout: c} : {})};
    setLocal(l => l.map(v => up(v.code) === code ? next : v));
    try {await send({action: 'save', kind: 'pin', id: pinId(project.id, code, 'map'), data: next}); onSaved();} catch (e) {toast.error(e instanceof Error ? e.message : 'Không lưu được thẻ thông tin.');}
  }
  const dragCallout = (e: React.PointerEvent, code: string) => {
    e.stopPropagation(); e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY; let last = {x: x0, y: y0}, did = false;
    const move = (ev: PointerEvent) => {last = {x: ev.clientX, y: ev.clientY}; if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 3) did = true; if (did) {const c = toPct(ev.clientX, ev.clientY); setLocal(l => l.map(v => up(v.code) === code ? {...v, callout: c} : v));}};
    const upH = () => {window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', upH); if (did) {const c = toPct(last.x, last.y); saveCallout(code, {x: Math.min(100, Math.max(0, c.x)), y: Math.min(100, Math.max(0, c.y))});}};
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', upH);
  };
  const dragPin = (e: React.PointerEvent, code: string) => {
    if (!edit) return;
    e.stopPropagation(); e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY; let last = {x: x0, y: y0}, did = false;
    const move = (ev: PointerEvent) => {last = {x: ev.clientX, y: ev.clientY}; if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 3) did = true; if (did) {const p = toPct(ev.clientX, ev.clientY); setLocal(l => l.map(v => up(v.code) === code ? {...v, x: p.x, y: p.y} : v));}};
    const upH = () => {window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', upH); if (did) {const p = toPct(last.x, last.y); place(code, p.x, p.y);}};
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', upH);
  };

  // Plan laid out at its real on-screen size; only the tiles of the needed sharpness inside the viewport are loaded.
  const W = baseW * t.s, H = baseH * t.s, need = W * dpr;
  const cells = (n: number) => {
    const out: {r: number; c: number}[] = [], cw = W / n, ch = H / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {const lx = t.x + c * cw, ly = t.y + r * ch; if (lx < box.w && lx + cw > 0 && ly < box.h && ly + ch > 0) out.push({r, c});}
    return out;
  };
  const hw = Math.floor(cfg.tileW / 2), hh = Math.floor(cfg.tileH / 2), n2 = cfg.grid * 2;
  const mid = need > cfg.viewW * 1.15 ? cells(cfg.grid) : [], fine = need > cfg.grid * hw * 1.15 ? cells(n2) : [];
  const fineSrc = (r: number, c: number) => `/api/img?v=4&w=${hw}&q=74&c=${(c % 2) * hw},${(r % 2) * hh},${hw},${hh}&src=${encodeURIComponent(cfg.tilePrefix + (r >> 1) + (c >> 1))}`;
  const cell = (r: number, c: number, n: number) => ({left: `${c * 100 / n}%`, top: `${r * 100 / n}%`, width: `${100 / n}%`, height: `${100 / n}%`});
  const free = units.filter(u => statusOf(u) === 'Còn hàng'), held = units.filter(u => statusOf(u) === 'Đang giữ chỗ'), sold = units.filter(u => statusOf(u) === 'Đã bán');
  const list = units.filter(u => (!q.trim() || u.code.toLowerCase().includes(q.trim().toLowerCase())) && (!only || statusOf(u) === only))
    .sort((a, b) => (pinOf.has(up(a.code)) ? 0 : 1) - (pinOf.has(up(b.code)) ? 0 : 1) || a.code.localeCompare(b.code, 'vi', {numeric: true}));
  const unplaced = units.filter(u => !pinOf.has(up(u.code))).length;

  return <div className={'pm' + (edit ? ' is-edit' : '') + (placing ? ' is-placing' : '') + (showNotes ? ' is-notes' : '')}>
    <div ref={view} className="pm-view" onPointerDown={onDown} onClick={e => {
      if (moved.current || !edit || !placing) return;
      const p = toPct(e.clientX, e.clientY); place(placing, p.x, p.y); toast.success(`Đã đặt ${placing}.`); setPlacing('');
    }}>
      <div ref={canvas} className="pm-canvas" style={{width: W, height: H}}>
        <img className="pm-img" src={cfg.image} alt={`Mặt bằng ${cfg.title}`} decoding="async" draggable={false}/>
        {mid.map(({r, c}) => <img key={'m' + r + c} className="pm-tile" src={sized(`${cfg.tilePrefix}${r}${c}`, hw)} alt="" decoding="async" draggable={false} style={cell(r, c, cfg.grid)}/>)}
        {fine.map(({r, c}) => <img key={'f' + r + '-' + c} className="pm-tile" src={fineSrc(r, c)} alt="" decoding="async" draggable={false} style={cell(r, c, n2)}/>)}
        {showNotes && <svg className="pm-notes" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
          <defs><marker id="pm-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#fde047"/></marker></defs>
          {local.filter(p => p.callout).map(p => {
            const x1 = p.callout!.x * W / 100, y1 = p.callout!.y * H / 100, cx = p.x * W / 100, cy = p.y * H / 100 - 14;
            // stop where the line meets the tag box (half size 24 × 15 incl. a 2 px gap)
            const dx = x1 - cx, dy = y1 - cy, f = Math.min(Math.abs(dx) > 1e-6 ? 24 / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? 15 / Math.abs(dy) : Infinity, 1);
            return <line key={p.code} x1={x1} y1={y1} x2={cx + dx * f} y2={cy + dy * f} markerEnd="url(#pm-arrow)"/>;
          })}
        </svg>}
        {showNotes && local.filter(p => p.callout).map(p => {
          const u = units.find(v => up(v.code) === up(p.code)); if (!u) return null;
          const st = statusOf(u), code = up(p.code), known = (v?: string) => !!v && v !== 'Đang cập nhật';
          const rows: [string, string | undefined][] = [['Loại hình', u.type], ['Phân khu', u.zone], ['DT đất', u.area ? fmt(u.area) + ' m²' : undefined], ['DTXD', u.builtArea ? fmt(u.builtArea) + ' m²' : undefined], ['Hướng', u.direction], ['TCBG', u.group]];
          return <div key={'n' + code} className={'pm-note' + (st === 'Còn hàng' ? '' : st === 'Đã bán' ? ' is-sold' : ' is-held')} style={{left: p.callout!.x + '%', top: p.callout!.y + '%'}}
            onPointerDown={e => dragCallout(e, code)} onClick={e => e.stopPropagation()}>
            <button type="button" className="pm-note-x" title="Gỡ thẻ thông tin" onPointerDown={e => e.stopPropagation()} onClick={e => {e.stopPropagation(); saveCallout(code);}}><X size={12}/></button>
            <strong>{u.code}</strong>
            <dl>{rows.filter(([, v]) => known(v)).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <p><b>{u.price ? fmt(u.price) + ' tỷ' : 'Liên hệ'}</b><span>{st}</span></p>
          </div>;
        })}
        {local.map(p => {
          const u = units.find(v => up(v.code) === up(p.code)); if (!u) return null;
          const st = statusOf(u), code = up(p.code);
          if (only && st !== only) return null;
          return <a key={code} href={edit || showNotes ? undefined : unitPlanPath(u)} className={'pm-tag' + (st === 'Còn hàng' ? '' : st === 'Đã bán' ? ' is-sold' : ' is-held') + (flash === code || hover === code ? ' is-hot' : '')}
            style={{left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-100%) scale(var(--k,1))'}}
            onPointerDown={e => {if (edit) dragPin(e, code); else if (showNotes) dragCallout(e, code); else e.stopPropagation();}} onClick={e => {e.stopPropagation(); if (edit || showNotes) e.preventDefault();}}
            onMouseEnter={() => setHover(code)} onMouseLeave={() => setHover(h => h === code ? '' : h)}>
            <b>{tag(u.price)}</b>
            {(hover === code || flash === code) && <span className="pm-tip"><strong>{u.code}</strong><em>{u.type} · {u.area ? fmt(u.area) + ' m²' : '—'}</em><em>{u.price ? fmt(u.price) + ' tỷ' : 'Liên hệ'} · {st}</em>{!edit && <i>Bấm để xem mặt bằng căn</i>}</span>}
          </a>;
        })}
      </div>
    </div>

    <aside className="pm-panel" onPointerDown={e => e.stopPropagation()}>
      <header><small>Quỹ căn 360°</small><h3>{cfg.title}</h3></header>
      {canManage && <div className="pm-mode" role="group" aria-label="Chế độ xem">
        <button type="button" className={admin ? '' : 'is-on'} onClick={() => {setAdmin(false); setEdit(false); setPlacing('');}}>Khách</button>
        <button type="button" className={admin ? 'is-on' : ''} onClick={() => setAdmin(true)}><Pencil size={13}/>Quản trị viên</button></div>}
      <div className="pm-stats">
        <button type="button" className={only === 'Còn hàng' ? 'is-on' : ''} onClick={() => setOnly(only === 'Còn hàng' ? '' : 'Còn hàng')}><b>{free.length}</b><span>Còn hàng</span></button>
        <button type="button" className={only === 'Đang giữ chỗ' ? 'is-on' : ''} onClick={() => setOnly(only === 'Đang giữ chỗ' ? '' : 'Đang giữ chỗ')}><b>{held.length}</b><span>Giữ chỗ</span></button>
        <button type="button" className={only === 'Đã bán' ? 'is-on' : ''} onClick={() => setOnly(only === 'Đã bán' ? '' : 'Đã bán')}><b>{sold.length}</b><span>Đã bán</span></button>
      </div>
      <label className="pm-search"><Search size={15}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã căn…"/></label>
      {canManage && admin && <div className="pm-admin">
        <button type="button" className={edit ? 'is-on' : ''} onClick={() => {setEdit(!edit); setPlacing('');}}>{edit ? <><Check size={14}/>Xong chỉnh vị trí</> : <><Pencil size={14}/>Chỉnh vị trí căn</>}</button>
        <span>{local.length}/{units.length} căn đã gắn{unplaced ? ` · ${unplaced} chưa gắn` : ''}</span>
        <button type="button" className={notes ? 'is-on' : ''} onClick={() => setNotes(!notes)} title="Kéo tag giá ra để hiện thẻ thông tin đầy đủ của căn">{notes ? 'Thẻ thông tin: Bật' : 'Thẻ thông tin: Tắt'} · {local.filter(p => p.callout).length}</button>
        {notes && <p>Kéo tag giá ra vị trí tuỳ ý để hiện thẻ thông tin (mũi tên tự nối về căn); kéo thẻ để dời, ✕ để gỡ.{edit ? ' Đang bật "Chỉnh vị trí căn": tắt nó để kéo thẻ.' : ''}</p>}
        {edit && <p>{placing ? `Bấm lên mặt bằng để đặt ${placing}` : 'Chọn mã căn bên dưới rồi bấm lên mặt bằng. Kéo tag để dời vị trí.'}</p>}
      </div>}
      <div className="pm-list">{list.map(u => {
        const code = up(u.code), p = pinOf.get(code), st = statusOf(u);
        return <div key={u.id} className={'pm-row' + (placing === code ? ' is-placing' : '') + (st === 'Còn hàng' ? '' : st === 'Đã bán' ? ' is-sold' : ' is-held')}
          onMouseEnter={() => setHover(code)} onMouseLeave={() => setHover(h => h === code ? '' : h)}>
          <button type="button" className="pm-row-main" onClick={() => {if (p) flyTo(p, code); else if (edit) setPlacing(code); else window.location.assign(unitPlanPath(u));}}>
            <i/><b>{u.code}</b><span>{u.price ? fmt(u.price) + ' tỷ' : 'Liên hệ'}</span>{p ? <Locate size={14}/> : admin ? <small>chưa gắn</small> : null}</button>
          {edit && <span className="pm-row-tools">
            <button type="button" title="Đặt / đặt lại vị trí" onClick={() => setPlacing(placing === code ? '' : code)}><Crosshair size={14}/></button>
            {p && <button type="button" title="Gỡ khỏi mặt bằng" onClick={() => remove(code)}><Trash2 size={14}/></button>}</span>}
        </div>;
      })}{!list.length && <p className="pm-empty">Không có căn phù hợp.</p>}</div>
      <div className="pm-legend"><span><i/>Còn hàng</span><span><i className="is-held"/>Giữ chỗ</span><span><i className="is-sold"/>Đã bán</span></div>
    </aside>

    <div className="pm-zoom" onPointerDown={e => e.stopPropagation()}>
      <button type="button" aria-label="Phóng to" onClick={() => zoomAt(1.4, box.w / 2, box.h / 2, true)}><Plus size={18}/></button>
      <span>{Math.round(t.s * 100)}%</span>
      <button type="button" aria-label="Thu nhỏ" onClick={() => zoomAt(1 / 1.4, box.w / 2, box.h / 2, true)}><Minus size={18}/></button>
      <button type="button" aria-label="Xem toàn bộ" onClick={fit}><MapPin size={16}/></button>
    </div>
    {placing && <button type="button" className="pm-cancel" onClick={() => setPlacing('')}><X size={14}/>Huỷ đặt {placing}</button>}
  </div>;
}
