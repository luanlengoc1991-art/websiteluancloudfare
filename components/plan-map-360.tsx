'use client';
/* Quỹ căn 360° (new design): HD master plan with a small price tag on every unit of the inventory.
 * Visitors: pan/zoom, see how many units are left, click a tag → unit page. Admins: place / drag / remove tags.
 * Light: the first view loads a ≤2560 px copy; full-resolution tiles load only for the visible area when zoomed. */
import {useEffect, useMemo, useRef, useState} from 'react';
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
  const [local, setLocal] = useState<UnitPin[]>(pins);
  useEffect(() => setLocal(pins), [pins]);
  const [edit, setEdit] = useState(false), [placing, setPlacing] = useState(''), [q, setQ] = useState(''), [only, setOnly] = useState('');
  const [hover, setHover] = useState(''), [flash, setFlash] = useState('');
  const pinOf = useMemo(() => new Map(local.map(p => [up(p.code), p])), [local]);
  // content size at scale 1 = image fitted inside the viewport
  const baseW = Math.min(box.w, box.h / ratio), baseH = baseW * ratio;
  const fit = () => setT({s: 1, x: (box.w - baseW) / 2, y: (box.h - baseH) / 2});
  useEffect(() => {
    const el = view.current; if (!el) return;
    const ro = new ResizeObserver(() => setBox({w: el.clientWidth, h: el.clientHeight}));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(fit, [box.w, box.h]); // eslint-disable-line react-hooks/exhaustive-deps
  const zoomAt = (k: number, cx: number, cy: number) => setT(o => {
    const s = Math.min(14, Math.max(1, o.s * k)), f = s / o.s;
    return {s, x: cx - (cx - o.x) * f, y: cy - (cy - o.y) * f};
  });
  useEffect(() => {
    const el = view.current; if (!el) return;
    const wheel = (e: WheelEvent) => {e.preventDefault(); const r = el.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX - r.left, e.clientY - r.top);};
    el.addEventListener('wheel', wheel, {passive: false}); return () => el.removeEventListener('wheel', wheel);
  }, []);
  const flyTo = (p: {x: number; y: number}, code?: string) => {
    const s = Math.max(t.s, 5);
    setT({s, x: box.w / 2 - p.x / 100 * baseW * s, y: box.h / 2 - p.y / 100 * baseH * s});
    if (code) {setFlash(code); setTimeout(() => setFlash(c => c === code ? '' : c), 2600);}
  };
  // drag to pan; a click without moving places the selected code (admin)
  const moved = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY, o = t; moved.current = false;
    const move = (ev: PointerEvent) => {const dx = ev.clientX - x0, dy = ev.clientY - y0; if (!moved.current && Math.hypot(dx, dy) < 5) return; moved.current = true; setT({...o, x: o.x + dx, y: o.y + dy});};
    const upH = () => {window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', upH);};
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', upH);
  };
  const toPct = (cx: number, cy: number) => {const r = view.current!.getBoundingClientRect(); return {x: Math.round(((cx - r.left - t.x) / (baseW * t.s)) * 10000) / 100, y: Math.round(((cy - r.top - t.y) / (baseH * t.s)) * 10000) / 100};};

  async function send(body: object) {
    const r = await fetch('/api/action', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
    if (!r.ok) throw Error((await r.json().catch(() => ({}))).error || 'Không lưu được.');
  }
  async function place(code: string, x: number, y: number) {
    const u = units.find(v => up(v.code) === code);
    const pin: UnitPin = {projectId: project.id, code, layer: 'map', x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)), fund: pinOf.get(code)?.fund || fundFromGroup(u?.group)};
    setLocal(l => [...l.filter(p => up(p.code) !== code), pin]);
    try {await send({action: 'save', kind: 'pin', id: pinId(project.id, code, 'map'), data: pin}); onSaved();} catch (e) {toast.error(e instanceof Error ? e.message : 'Không lưu được vị trí.');}
  }
  async function remove(code: string) {
    setLocal(l => l.filter(p => up(p.code) !== code));
    try {await send({action: 'delete', kind: 'pin', id: pinId(project.id, code, 'map')}); onSaved(); toast.success(`Đã gỡ ${code} khỏi mặt bằng.`);} catch (e) {toast.error(e instanceof Error ? e.message : 'Không gỡ được.');}
  }
  const dragPin = (e: React.PointerEvent, code: string) => {
    if (!edit) return;
    e.stopPropagation(); e.preventDefault();
    const x0 = e.clientX, y0 = e.clientY; let last = {x: x0, y: y0}, did = false;
    const move = (ev: PointerEvent) => {last = {x: ev.clientX, y: ev.clientY}; if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 3) did = true; if (did) {const p = toPct(ev.clientX, ev.clientY); setLocal(l => l.map(v => up(v.code) === code ? {...v, x: p.x, y: p.y} : v));}};
    const upH = () => {window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', upH); if (did) {const p = toPct(last.x, last.y); place(code, p.x, p.y);}};
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', upH);
  };

  // visible HD tiles only
  const tiles: {r: number; c: number}[] = [];
  if (t.s >= 1.8) for (let r = 0; r < cfg.grid; r++) for (let c = 0; c < cfg.grid; c++) {
    const tw = baseW * t.s / cfg.grid, th = baseH * t.s / cfg.grid, lx = t.x + c * tw, ly = t.y + r * th;
    if (lx < box.w && lx + tw > 0 && ly < box.h && ly + th > 0) tiles.push({r, c});
  }
  const free = units.filter(u => statusOf(u) === 'Còn hàng'), held = units.filter(u => statusOf(u) === 'Đang giữ chỗ'), sold = units.filter(u => statusOf(u) === 'Đã bán');
  const list = units.filter(u => (!q.trim() || u.code.toLowerCase().includes(q.trim().toLowerCase())) && (!only || statusOf(u) === only))
    .sort((a, b) => (pinOf.has(up(a.code)) ? 0 : 1) - (pinOf.has(up(b.code)) ? 0 : 1) || a.code.localeCompare(b.code, 'vi', {numeric: true}));
  const unplaced = units.filter(u => !pinOf.has(up(u.code))).length;

  return <div className={'pm' + (edit ? ' is-edit' : '') + (placing ? ' is-placing' : '')}>
    <div ref={view} className="pm-view" onPointerDown={onDown} onClick={e => {
      if (moved.current || !edit || !placing) return;
      const p = toPct(e.clientX, e.clientY); place(placing, p.x, p.y); toast.success(`Đã đặt ${placing}.`); setPlacing('');
    }}>
      <div className="pm-canvas" style={{width: baseW, height: baseH, transform: `translate(${t.x}px,${t.y}px) scale(${t.s})`}}>
        <img className="pm-img" src={sized(cfg.image, 2560)} alt={`Mặt bằng ${cfg.title}`} draggable={false}/>
        {tiles.map(({r, c}) => <img key={r + '-' + c} className="pm-tile" src={`${cfg.tilePrefix}${r}${c}`} alt="" draggable={false}
          style={{left: `${c * 100 / cfg.grid}%`, top: `${r * 100 / cfg.grid}%`, width: `${100 / cfg.grid}%`, height: `${100 / cfg.grid}%`}}/>)}
        {local.map(p => {
          const u = units.find(v => up(v.code) === up(p.code)); if (!u) return null;
          const st = statusOf(u), code = up(p.code);
          if (only && st !== only) return null;
          return <a key={code} href={edit ? undefined : unitPlanPath(u)} className={'pm-tag' + (st === 'Còn hàng' ? '' : st === 'Đã bán' ? ' is-sold' : ' is-held') + (flash === code || hover === code ? ' is-hot' : '')}
            style={{left: p.x + '%', top: p.y + '%', transform: `translate(-50%,-100%) scale(${1 / t.s})`}}
            onPointerDown={e => {if (edit) dragPin(e, code); else e.stopPropagation();}} onClick={e => {e.stopPropagation(); if (edit) e.preventDefault();}}
            onMouseEnter={() => setHover(code)} onMouseLeave={() => setHover(h => h === code ? '' : h)}>
            <b>{tag(u.price)}</b>
            {(hover === code || flash === code) && <span className="pm-tip"><strong>{u.code}</strong><em>{u.type} · {u.area ? fmt(u.area) + ' m²' : '—'}</em><em>{u.price ? fmt(u.price) + ' tỷ' : 'Liên hệ'} · {st}</em>{!edit && <i>Bấm để xem mặt bằng căn</i>}</span>}
          </a>;
        })}
      </div>
    </div>

    <aside className="pm-panel" onPointerDown={e => e.stopPropagation()}>
      <header><small>Quỹ căn 360°</small><h3>{cfg.title}</h3></header>
      <div className="pm-stats">
        <button type="button" className={only === 'Còn hàng' ? 'is-on' : ''} onClick={() => setOnly(only === 'Còn hàng' ? '' : 'Còn hàng')}><b>{free.length}</b><span>Còn hàng</span></button>
        <button type="button" className={only === 'Đang giữ chỗ' ? 'is-on' : ''} onClick={() => setOnly(only === 'Đang giữ chỗ' ? '' : 'Đang giữ chỗ')}><b>{held.length}</b><span>Giữ chỗ</span></button>
        <button type="button" className={only === 'Đã bán' ? 'is-on' : ''} onClick={() => setOnly(only === 'Đã bán' ? '' : 'Đã bán')}><b>{sold.length}</b><span>Đã bán</span></button>
      </div>
      <label className="pm-search"><Search size={15}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã căn…"/></label>
      {canManage && <div className="pm-admin">
        <button type="button" className={edit ? 'is-on' : ''} onClick={() => {setEdit(!edit); setPlacing('');}}>{edit ? <><Check size={14}/>Xong chỉnh vị trí</> : <><Pencil size={14}/>Chỉnh vị trí căn</>}</button>
        <span>{local.length}/{units.length} căn đã gắn{unplaced ? ` · ${unplaced} chưa gắn` : ''}</span>
        {edit && <p>{placing ? `Bấm lên mặt bằng để đặt ${placing}` : 'Chọn mã căn bên dưới rồi bấm lên mặt bằng. Kéo tag để dời vị trí.'}</p>}
      </div>}
      <div className="pm-list">{list.map(u => {
        const code = up(u.code), p = pinOf.get(code), st = statusOf(u);
        return <div key={u.id} className={'pm-row' + (placing === code ? ' is-placing' : '') + (st === 'Còn hàng' ? '' : st === 'Đã bán' ? ' is-sold' : ' is-held')}
          onMouseEnter={() => setHover(code)} onMouseLeave={() => setHover(h => h === code ? '' : h)}>
          <button type="button" className="pm-row-main" onClick={() => {if (p) flyTo(p, code); else if (edit) setPlacing(code); else window.location.assign(unitPlanPath(u));}}>
            <i/><b>{u.code}</b><span>{u.price ? fmt(u.price) + ' tỷ' : 'Liên hệ'}</span>{p ? <Locate size={14}/> : <small>chưa gắn</small>}</button>
          {edit && <span className="pm-row-tools">
            <button type="button" title="Đặt / đặt lại vị trí" onClick={() => setPlacing(placing === code ? '' : code)}><Crosshair size={14}/></button>
            {p && <button type="button" title="Gỡ khỏi mặt bằng" onClick={() => remove(code)}><Trash2 size={14}/></button>}</span>}
        </div>;
      })}{!list.length && <p className="pm-empty">Không có căn phù hợp.</p>}</div>
      <div className="pm-legend"><span><i/>Còn hàng</span><span><i className="is-held"/>Giữ chỗ</span><span><i className="is-sold"/>Đã bán</span></div>
    </aside>

    <div className="pm-zoom" onPointerDown={e => e.stopPropagation()}>
      <button type="button" aria-label="Phóng to" onClick={() => zoomAt(1.4, box.w / 2, box.h / 2)}><Plus size={18}/></button>
      <span>{Math.round(t.s * 100)}%</span>
      <button type="button" aria-label="Thu nhỏ" onClick={() => zoomAt(1 / 1.4, box.w / 2, box.h / 2)}><Minus size={18}/></button>
      <button type="button" aria-label="Xem toàn bộ" onClick={fit}><MapPin size={16}/></button>
    </div>
    {placing && <button type="button" className="pm-cancel" onClick={() => setPlacing('')}><X size={14}/>Huỷ đặt {placing}</button>}
  </div>;
}
