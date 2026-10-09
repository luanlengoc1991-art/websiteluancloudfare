'use client';
/* Vinhomes Saigon Park unit poster (1512 × 2044), the owner's former studio layout rebuilt natively: every layer is an R2 image
 * + live text from the Google Sheet. Everyone gets the filter list and JPEG download; only admins see the editing tools. */
import {useEffect, useMemo, useRef, useState} from 'react';
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
const defaultPin: CardSpot = {src: F('sgp-aerial-2026'), x: 49, y: 68, zoom: 1};
type Slot = 'house' | 'plan';

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

/** The poster itself (also rendered off-screen for the ZIP export). */
function PosterArt({unit, status, data, tool, onPoster, onPlan, onHouse}: {
  unit: Unit; status: string; data: ReturnType<typeof resolve>; tool?: string | null;
  onPoster?: (x: number, y: number) => void; onPlan?: () => void; onHouse?: () => void;
}) {
  const {f, plan, pin, house} = data;
  const price = f.price || (unit.price ? fmt(unit.price) : '');
  const facts: [string, string][] = [
    ['Loại hình:', f.type || unit.type], ['TCBG:', f.group || unit.group],
    ['DT Đất:', f.area || (unit.area ? fmt(unit.area) + ' m²' : '')], ['DTXD:', f.builtArea || (unit.builtArea ? fmt(unit.builtArea) + ' m²' : '')],
  ];
  return <div className={'spp' + (tool === 'pin' ? ' is-pinning' : '')} onClick={e => {
    if (tool !== 'pin' || !onPoster) return;
    const r = e.currentTarget.getBoundingClientRect();
    onPoster(Math.round((e.clientX - r.left) / r.width * 1000) / 10, Math.round((e.clientY - r.top) / r.height * 1000) / 10);
  }}>
    <img className="spp-bg" src={sized(F('sgp-poster-bg'), 1600)} alt=""/>
    <div className="spp-aerial"><img src={sized(F('sgp-aerial-2026'), 2000)} alt="Phối cảnh tổng Vinhomes Saigon Park"/></div>
    <button type="button" className="spp-house" onClick={e => {if (tool !== 'pin' && onHouse) {e.stopPropagation(); onHouse();}}} aria-label="Xem ảnh nhà lớn"><img src={sized(house, 1600)} alt={`Mẫu nhà ${unit.model || ''}`}/></button>
    <img className="spp-strip" src={F('sgp-strip')} alt=""/>
    <img className="spp-logo" src={F('sgp-logo')} alt="Vinhomes Saigon Park"/>
    <span className="spp-script">{f.title || 'Mã căn'}</span>
    <b className="spp-code">{unit.code}</b>
    {facts.map(([k, v], i) => <span key={k} className={'spp-fact is-' + i}><i>{k}</i><em>{v || 'Đang cập nhật'}</em></span>)}
    <div className="spp-price"><img src={F('sgp-price-bg')} alt=""/><small>GIÁ BÁN<br/>(CHƯA VAT + KPBT)</small>
      {price ? <b>{price}<sup>TỶ</sup></b> : <b className="is-contact">LIÊN HỆ</b>}</div>
    <button type="button" className="spp-plan" onClick={e => {if (tool !== 'pin' && onPlan) {e.stopPropagation(); onPlan();}}} aria-label="Xem mặt bằng lớn">
      <img src={plan.zoom > 1.6 ? plan.src : sized(plan.src, 2560)} alt={`Mặt bằng chỉ căn ${unit.code}`} style={{width: `${plan.zoom * 100}%`, transform: `translate(-${plan.x}%, -${plan.y}%)`}}/>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden><path d="M58 62 Q50 60 41.5 51" stroke="#e11d2a" strokeWidth="2.4" fill="none" vectorEffect="non-scaling-stroke"/><path d="M40.6 49.6 L44.5 50 L42.4 53.4 z" fill="#e11d2a"/></svg>
      <span className="spp-tag is-inset"><img src={F('sgp-pin')} alt=""/><b>{unit.code}</b></span>
      {onPlan && <span className="spp-zoomhint"><Expand size={12}/>Xem lớn</span>}
    </button>
    <img className="spp-loc" src={F('sgp-loc-title')} alt="Sơ đồ vị trí"/>
    <span className="spp-tag is-aerial" style={{left: `${pin.x}%`, top: `${pin.y}%`}}><img src={F('sgp-pin')} alt=""/><b>{unit.code}</b></span>
    {status !== 'Còn hàng' && <span className="spp-sold">{status}</span>}
    {tool === 'pin' && <span className="spp-hint">Bấm lên phối cảnh để đặt ghim {unit.code}</span>}
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
      onPoster={(x, y) => setDraft(d => ({...d, master: {...data.pin, src: F('sgp-aerial-2026'), x, y}}))} onPlan={() => setView('plan')} onHouse={() => setView('house')}/></div>

    {isAdmin && edit && <div className="uc-form">
      {([['title', 'Dòng chữ'], ['type', 'Loại hình'], ['group', 'TCBG'], ['model', 'Mẫu nhà'], ['area', 'DT Đất'], ['builtArea', 'DTXD'], ['price', 'Giá (tỷ)'], ['note', 'Ghi chú']] as const).map(([k, l]) =>
        <label key={k} className="uc-in"><span>{l}</span><input value={draft.fields?.[k] || ''} placeholder={String((unit as Record<string, unknown>)[k] || '')} onChange={e => setDraft(d => ({...d, fields: {...d.fields, [k]: e.target.value}}))}/></label>)}
      <p>Ô để trống = lấy theo Google Sheet. Ảnh nhà tự lấy theo cột Mẫu nhà.</p>
    </div>}

    {view && <div className="spp-light" role="dialog" aria-label="Xem ảnh lớn" onClick={() => setView(null)}>
      <div onClick={e => e.stopPropagation()}>
        <header><b>{view === 'plan' ? `Mặt bằng chỉ căn ${unit.code}` : `Ảnh nhà · ${unit.model || unit.code}`}</b>
          {isAdmin && <span>
            <button type="button" className="uc-btn" onClick={() => {uploadSlot.current = view; if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);} fileInput.current?.click();}}><ImagePlus size={14}/>Thay ảnh</button>
            <button type="button" className="uc-btn" onClick={() => {if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);} setPick(view);}}><Images size={14}/>Thư viện</button>
            {edit && <button type="button" className="uc-btn is-dark" disabled={!!busy} onClick={saveUnit}><Save size={14}/>Lưu</button>}</span>}
          <button type="button" className="spp-close" onClick={() => setView(null)} aria-label="Đóng"><X size={20}/></button></header>
        {view === 'plan' ? <>
          <div className={'spp-light-map' + (isAdmin ? ' is-edit' : '')} onClick={e => {
            if (!isAdmin) return;
            if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);}
            const r = e.currentTarget.getBoundingClientRect(); setPlan({x: Math.round((e.clientX - r.left) / r.width * 1000) / 10, y: Math.round((e.clientY - r.top) / r.height * 1000) / 10});
          }}><img src={sized(data.plan.src, 2560)} alt=""/><span style={{left: `${data.plan.x}%`, top: `${data.plan.y}%`}}><b>{unit.code}</b></span></div>
          {isAdmin && <div className="spp-light-tools"><span>Bấm lên mặt bằng để chỉ đúng lô {unit.code}</span>
            <label className="uc-zoom"><span>Zoom khung nhỏ {data.plan.zoom.toFixed(1)}×</span><input type="range" min={2} max={20} step={0.5} value={data.plan.zoom} onChange={e => {if (!edit) {setDraft(mergeCard(base, own)); setEdit(true);} setPlan({zoom: Number(e.target.value)});}}/></label>
            <div className="spp-light-preview"><PosterArt unit={unit} status={status} data={data}/></div></div>}
        </> : <div className="spp-light-img"><img src={sized(data.house, 2560)} alt=""/></div>}
      </div>
    </div>}
    <input ref={fileInput} type="file" accept="image/*" hidden onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      setBusy('upload');
      try {const form = new FormData(); form.append('file', file); form.append('projectId', project.id); form.append('kind', 'image');
        const r = await fetch('/api/upload', {method: 'POST', body: form}); const d = await r.json(); if (!r.ok) throw Error(d.error);
        setImage(uploadSlot.current, d.url); toast.success('Đã tải ảnh – bấm Lưu để áp dụng.');} catch (err) {toast.error(err instanceof Error ? err.message : 'Lỗi tải ảnh.');} finally {setBusy('');}
    }}/>
    {pick && <div className="uc-picker" role="dialog" onClick={() => setPick(null)}><div onClick={e => e.stopPropagation()}>
      <header><b>Chọn {pick === 'plan' ? 'ảnh mặt bằng' : 'ảnh nhà'}</b><button type="button" onClick={() => setPick(null)} aria-label="Đóng"><X size={18}/></button></header>
      <div className="uc-picker-grid">{files.filter(a => a.projectId === project.id && ['model', 'gallery', 'image', 'plan'].includes(a.kind) && !/sgp-(pin|strip|loc|price|logo|marker)/.test(a.url)).map(a =>
        <button type="button" key={a.url} onClick={() => {setImage(pick, a.url); setPick(null);}}><img src={sized(a.url, 360)} alt="" loading="lazy"/><span>{a.name}</span></button>)}</div>
    </div></div>}
    {batch && <div className="spp-offscreen" ref={batchRef} aria-hidden><PosterArt unit={batch} status={statusOf(batch)} data={resolve(batch, base, cards[cardId(project.id, batch.code)])}/></div>}
  </div>;
}

/** Left panel: the studio's unit list with filters (visible to everyone). */
export function SgpFilter({units, code, onPick, statusOf}: {units: Unit[]; code?: string; onPick: (code: string) => void; statusOf: (u: Unit) => string}) {
  const blank = {q: '', status: '', type: '', min: '', max: '', street: '', amin: '', amax: '', dir: '', sort: 'new'};
  const [v, setV] = useState(blank), [more, setMore] = useState(false);
  const set = (k: keyof typeof blank, x: string) => setV(s => ({...s, [k]: x}));
  const opt = (f: (u: Unit) => string | undefined) => [...new Set(units.map(f).filter((x): x is string => !!x && x !== 'Đang cập nhật'))].sort((a, b) => a.localeCompare(b, 'vi', {numeric: true}));
  const list = useMemo(() => {
    const n = (s: string) => s === '' ? NaN : Number(s.replace(',', '.'));
    const out = units.filter(u => (!v.q || u.code.toLowerCase().includes(v.q.trim().toLowerCase()))
      && (!v.status || statusOf(u) === v.status) && (!v.type || u.type === v.type) && (!v.street || u.tower === v.street) && (!v.dir || u.direction === v.dir)
      && !(n(v.min) > u.price) && !(n(v.max) < u.price) && !(n(v.amin) > u.area) && !(n(v.amax) < u.area));
    if (v.sort === 'asc') out.sort((a, b) => (a.price || 1e9) - (b.price || 1e9));
    if (v.sort === 'desc') out.sort((a, b) => b.price - a.price);
    if (v.sort === 'az') out.sort((a, b) => a.code.localeCompare(b.code, 'vi', {numeric: true}));
    return out;
  }, [units, v, statusOf]);
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
    <select className="sgf-sort" value={v.sort} onChange={e => set('sort', e.target.value)} aria-label="Sắp xếp"><option value="new">Mới cập nhật</option><option value="asc">Giá thấp đến cao</option><option value="desc">Giá cao đến thấp</option><option value="az">Mã căn A-Z</option></select>
    <div className="sgf-list">{list.map(u => <button type="button" key={u.id} ref={u.code === code ? on : undefined} className={(u.code === code ? 'is-on' : '') + (statusOf(u) === 'Còn hàng' ? '' : ' is-sold')} onClick={() => onPick(u.code)}>
      <i style={{background: saigonParkModelColor(u.model)}}/><b>{u.code}</b><span>{u.price ? vn(u.price) + ' tỷ' : 'Liên hệ'}</span><ChevronRight size={15}/></button>)}
      {!list.length && <p>Không có căn phù hợp.</p>}</div>
  </aside>;
}
