'use client';
/* Vinhomes Saigon Park unit poster (1512 × 2044), the owner's former studio layout rebuilt natively: every layer is an R2 image
 * + live text from the Google Sheet. Everyone gets the filter list and JPEG download; only admins see the editing tools. */
import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Check, ChevronRight, Clock, Download, Expand, FileArchive, ImagePlus, Images, MapPin, Pencil, RotateCcw, Save, Search, SlidersHorizontal, X} from 'lucide-react';
import {toast} from 'sonner';
import type {Asset, Project, Unit} from '@/lib/catalog';
import {type CardSpot, type UnitCard, cardId, mergeCard} from '@/lib/unit-card';
import {saigonParkModelColor, saigonParkModelImage} from '@/lib/saigon-park-models';
import {sized} from '@/lib/img';

const F = (id: string) => `/api/files/${id}`;
const MAP = F('sgp-map-new');
const fmt = (n: number) => n.toLocaleString('en-US', {maximumFractionDigits: 2});
const vn = (n: number) => n.toLocaleString('vi-VN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const when = (t?: number) => t ? new Date(t).toLocaleString('vi-VN', {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'}) : '';
const defaultPlan: CardSpot = {src: MAP, x: 50, y: 50, zoom: 9};
const defaultPin: CardSpot = {src: F('sgp-aerial-v2'), x: 43.3, y: 82.3, zoom: 1};
type Slot = 'house' | 'plan';
/** Where the unit point sits inside the small plan frame (% of the frame). */
const PIN_X = 43.3, PIN_Y = 88;
/** Locator icon (owner's file): the label is filled with the unit code; the pin tip marks the spot. */
const Marker = ({code, className = '', style, onPointerDown, onClick}: {code: string; className?: string; style?: React.CSSProperties; onPointerDown?: React.PointerEventHandler; onClick?: React.MouseEventHandler}) =>
  <span className={'spm ' + className} style={style} onPointerDown={onPointerDown} onClick={onClick}><img src={F('sgp-marker-v2')} alt="" draggable={false}/><b>{code}</b></span>;
const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 100) / 100;

/** Resolved poster content for one unit. */
function resolve(unit: Unit, base?: UnitCard, own?: UnitCard) {
  const card = mergeCard(base, own), f = card.fields || {};
  return {
    card, f,
    plan: {...defaultPlan, ...card.plan, src: card.plan?.src || MAP},
    pin: card.master?.src?.includes('sgp-aerial') ? {...defaultPin, ...card.master} : defaultPin,
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
    <img className="spp-aerial2" src={F('sgp-aerial-v2')} alt="Phối cảnh tổng Vinhomes Saigon Park"/>
    <button type="button" className="spp-house" onClick={e => {if (tool !== 'pin' && onHouse) {e.stopPropagation(); onHouse();}}} aria-label="Xem ảnh nhà lớn"><img src={sized(house, 1520)} alt={`Mẫu nhà ${unit.model || ''}`}/></button>
    <img className="spp-strip2" src={F('sgp-strip-v2')} alt=""/>
    <span className="spp-script">{f.title || 'Mã căn'}</span>
    <b className="spp-code">{unit.code}</b>
    {facts.map(([k, v], i) => <span key={k} className={'spp-fact is-' + i}><i>{k}</i><em>{v || 'Đang cập nhật'}</em></span>)}
    <div className="spp-price"><img src={F('sgp-price-bg')} alt=""/><small>GIÁ BÁN<br/>(CHƯA VAT + KPBT)</small>
      {price ? <b>{price}<sup>TỶ</sup></b> : <b className="is-contact">LIÊN HỆ</b>}</div>
    <button type="button" ref={planBox} className="spp-plan" onClick={e => {if (tool !== 'pin' && onPlan) {e.stopPropagation(); onPlan();}}} aria-label="Xem mặt bằng lớn">
      <img src={plan.zoom > 1.6 ? plan.src : sized(plan.src, 2560)} alt={`Mặt bằng chỉ căn ${unit.code}`} draggable={false} style={{left: PIN_X + '%', top: PIN_Y + '%', width: `${plan.zoom * 100}%`, transform: `translate(-${plan.x}%, -${plan.y}%)`}}/>
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

/** Big plan with zoom; click or drag the pin to place the unit. Same point as the small frame. */
function BigPlan({plan, code, editable, onPoint}: {plan: CardSpot; code: string; editable: boolean; onPoint: (x: number, y: number) => void}) {
  const [zoom, setZoom] = useState(2), box = useRef<HTMLDivElement>(null), img = useRef<HTMLDivElement>(null);
  const centre = () => {const b = box.current, i = img.current; if (b && i) b.scrollTo({left: i.offsetWidth * plan.x / 100 - b.clientWidth / 2, top: i.offsetHeight * plan.y / 100 - b.clientHeight / 2});};
  useEffect(() => {const t = setTimeout(centre, 60); return () => clearTimeout(t);}, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ghost, setGhost] = useState<{dx: number; dy: number} | null>(null);
  const drag = useDrag((fx, fy, done) => {if (!done) {setGhost({dx: fx, dy: fy}); return;} setGhost(null); if (fx || fy) onPoint(clamp(plan.x + fx * 100), clamp(plan.y + fy * 100));});
  return <div className="spp-big">
    <div className="spp-big-zoom"><button type="button" onClick={() => setZoom(z => Math.max(1, z - .5))} aria-label="Thu nhỏ">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(z => Math.min(8, z + .5))} aria-label="Phóng to">+</button><button type="button" onClick={centre}>Về vị trí căn</button></div>
    <div ref={box} className={'spp-light-map' + (editable ? ' is-edit' : '')} onWheel={e => {if (e.ctrlKey || e.metaKey) {e.preventDefault(); setZoom(z => Math.min(8, Math.max(1, z - Math.sign(e.deltaY) * .25)));}}}>
      <div ref={img} style={{width: `${zoom * 100}%`}} onClick={e => {if (!editable) return; const r = e.currentTarget.getBoundingClientRect(); onPoint(Math.round((e.clientX - r.left) / r.width * 1000) / 10, Math.round((e.clientY - r.top) / r.height * 1000) / 10);}}>
        <img src={zoom > 1.5 ? plan.src : sized(plan.src, 2560)} alt="" draggable={false}/>
        <Marker code={code} className={'is-big' + (editable ? ' is-drag' : '')} style={{left: `calc(${plan.x}% + ${(ghost?.dx || 0) * 100}%)`, top: `calc(${plan.y}% + ${(ghost?.dy || 0) * 100}%)`}}
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

export default function SaigonParkPoster({project, unit, units, status, statusOf, cards, files, isAdmin, onSaved}: {
  project: Project; unit: Unit; units: Unit[]; status: string; statusOf: (u: Unit) => string; cards: Record<string, UnitCard>;
  files: Asset[]; isAdmin: boolean; onSaved: () => unknown;
}) {
  const base = cards[project.id + '|*'], own = cards[cardId(project.id, unit.code)];
  const [edit, setEdit] = useState(false), [busy, setBusy] = useState(''), [tool, setTool] = useState<'pin' | null>(null);
  const [view, setView] = useState<Slot | null>(null), [pick, setPick] = useState<Slot | null>(null);
  const [draft, setDraft] = useState<UnitCard>(mergeCard(base, own));
  useEffect(() => {if (!edit) setDraft(mergeCard(base, own));}, [own, base, edit, unit.id]);
  const data = edit ? (() => {const d = resolve(unit, undefined, {...draft, perspective: draft.perspective !== base?.perspective ? draft.perspective : undefined}); return {...d, plan: {...defaultPlan, ...draft.plan, src: draft.plan?.src || MAP}, pin: draft.master?.src?.includes('sgp-aerial') ? {...defaultPin, ...draft.master} : d.pin};})() : resolve(unit, base, own);
  const posterRef = useRef<HTMLDivElement>(null), fileInput = useRef<HTMLInputElement>(null), uploadSlot = useRef<Slot>('house');
  const [batch, setBatch] = useState<Unit | null>(null), batchRef = useRef<HTMLDivElement>(null);

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
  const saveDefault = () => post({code: '*', card: {...base, plan: {...data.plan, x: base?.plan?.x ?? 50, y: base?.plan?.y ?? 50, src: base?.plan?.src || MAP}}}, 'Đã lưu độ zoom làm mặc định dự án.');
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
      onPlanPoint={isAdmin && edit ? (x, y) => setPlan({x, y}) : undefined} onPin={isAdmin && edit ? (x, y) => setDraft(d => ({...d, master: {...data.pin, src: F('sgp-aerial-v2'), x, y}})) : undefined}
      onPoster={(x, y) => setDraft(d => ({...d, master: {...data.pin, src: F('sgp-aerial-v2'), x, y}}))} onPlan={() => setView('plan')} onHouse={() => setView('house')}/></div>

    {isAdmin && edit && <div className="uc-form">
      {([['title', 'Dòng chữ'], ['type', 'Loại hình'], ['group', 'TCBG'], ['model', 'Mẫu nhà'], ['area', 'DT Đất'], ['builtArea', 'DTXD'], ['price', 'Giá (tỷ)'], ['note', 'Ghi chú']] as const).map(([k, l]) =>
        <label key={k} className="uc-in"><span>{l}</span><input value={draft.fields?.[k] || ''} placeholder={String((unit as Record<string, unknown>)[k] || '')} onChange={e => setDraft(d => ({...d, fields: {...d.fields, [k]: e.target.value}}))}/></label>)}
      <p>Ô để trống = lấy theo Google Sheet. Ảnh nhà tự lấy theo cột Mẫu nhà.</p>
    </div>}

    {view && createPortal(<div className="spp-light" role="dialog" aria-label="Xem ảnh lớn" onClick={() => setView(null)}>
      <div onClick={e => e.stopPropagation()}>
        <header><b>{view === 'plan' ? `Mặt bằng chỉ căn ${unit.code}` : `Ảnh nhà · ${unit.model || unit.code}`}</b>
          {isAdmin && <span>
            <button type="button" className="uc-btn" onClick={() => {uploadSlot.current = view; if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);} fileInput.current?.click();}}><ImagePlus size={14}/>Thay ảnh</button>
            <button type="button" className="uc-btn" onClick={() => {if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);} setPick(view);}}><Images size={14}/>Thư viện</button>
            {edit && <button type="button" className="uc-btn is-dark" disabled={!!busy} onClick={saveUnit}><Save size={14}/>Lưu</button>}</span>}
          <button type="button" className="spp-close" onClick={() => setView(null)} aria-label="Đóng"><X size={20}/></button></header>
        {view === 'plan' ? <div className={'spp-light-body' + (isAdmin ? ' has-side' : '')}>
          <BigPlan plan={data.plan} code={unit.code} editable={isAdmin} onPoint={(x, y) => {startEdit(); setPlan({x, y});}}/>
          {isAdmin && <div className="spp-light-side"><p>Bấm hoặc kéo ghim trên mặt bằng lớn, hoặc kéo ghim ngay trên poster bên dưới – hai nơi luôn cùng một vị trí.</p>
            <label className="uc-zoom"><span>Độ phóng khung nhỏ {data.plan.zoom.toFixed(1)}×</span><input type="range" min={2} max={20} step={0.5} value={data.plan.zoom} onChange={e => {startEdit(); setPlan({zoom: Number(e.target.value)});}}/></label>
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
      <div className="uc-picker-grid">{files.filter(a => a.projectId === project.id && ['model', 'gallery', 'image', 'plan'].includes(a.kind) && !/sgp-(pin|strip|loc|price|logo|marker)/.test(a.url)).map(a =>
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
