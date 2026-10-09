'use client';
/* "Phiếu căn" for /mat-bang-can (all projects except the Green Paradise studio): perspective + unit code + specs + price,
 * a zoomed plan with the unit pointed out, the master plan with a pin, and nearby amenities.
 * Numbers come from the Google Sheet; admins draw the card (images, pins, zoom, text overrides) and save it. */
import {useEffect, useRef, useState} from 'react';
import {Check, Clock, ImagePlus, Images, MapPin, Move, Pencil, Plus, RotateCcw, Save, Trash2, X} from 'lucide-react';
import {toast} from 'sonner';
import type {Asset, Project, Unit} from '@/lib/catalog';
import {type CardSpot, type UnitCard, mergeCard} from '@/lib/unit-card';
import {sized} from '@/lib/img';

type Slot = 'perspective' | 'plan' | 'master';
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 3});
const when = (t?: number) => t ? new Date(t).toLocaleString('vi-VN', {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'}) : '';

async function upload(file: File, projectId: string) {
  const form = new FormData();
  form.append('file', file); form.append('projectId', projectId); form.append('kind', 'image');
  const r = await fetch('/api/upload', {method: 'POST', body: form});
  const d = await r.json();
  if (!r.ok) throw Error(d.error || 'Không tải được ảnh.');
  return d.url as string;
}

/** Zoomed crop: point (x,y) of the image sits in the middle of the frame. */
function Crop({spot, code}: {spot: CardSpot; code: string}) {
  return <div className="uc-crop">
    <img src={spot.zoom > 1.6 ? spot.src : sized(spot.src, 2560)} alt={`Mặt bằng chỉ căn ${code}`} decoding="async" style={{width: `${spot.zoom * 100}%`, transform: `translate(-${spot.x}%, -${spot.y}%)`}}/>
    <span className="uc-crop-pin"><b>{code}</b><i/></span>
  </div>;
}

/** Whole image with a pin; in edit mode a click moves the pin. */
function Pinned({spot, code, edit, onPin}: {spot: CardSpot; code: string; edit: boolean; onPin: (x: number, y: number) => void}) {
  return <div className={'uc-pinned' + (edit ? ' is-edit' : '')} onClick={e => {
    if (!edit) return;
    const r = e.currentTarget.getBoundingClientRect();
    onPin(Math.round((e.clientX - r.left) / r.width * 1000) / 10, Math.round((e.clientY - r.top) / r.height * 1000) / 10);
  }}>
    <img src={sized(spot.src, 2560)} alt=""/>
    <span className="uc-pin" style={{left: `${spot.x}%`, top: `${spot.y}%`}}><b>{code}</b><i/></span>
  </div>;
}

export default function UnitCardView({project, unit, status, own, base, files, fallbackPin, defaultNearby, isAdmin, onSaved, autoPerspective}: {
  project: Project; unit: Unit; status: string; own?: UnitCard; base?: UnitCard; files: Asset[];
  fallbackPin?: {x: number; y: number}; defaultNearby: string[]; isAdmin: boolean; onSaved: () => unknown; autoPerspective?: string;
}) {
  const saved = mergeCard(base, own);
  const [edit, setEdit] = useState(false), [busy, setBusy] = useState(false), [pickFor, setPickFor] = useState<Slot | null>(null);
  const [draft, setDraft] = useState<UnitCard>(saved);
  useEffect(() => {if (!edit) setDraft(mergeCard(base, own));}, [own, base, edit, unit.id]);
  const card = edit ? draft : saved;
  const f = card.fields || {};
  const plans = files.filter(a => a.projectId === project.id && a.kind === 'plan');
  const perspective = (edit ? draft.perspective !== base?.perspective && draft.perspective : own?.perspective) || autoPerspective || card.perspective || unit.posterUrl || files.find(a => a.projectId === project.id && a.kind === 'model')?.url || project.image;
  const master: CardSpot = card.master || {src: project.image, x: fallbackPin?.x ?? 50, y: fallbackPin?.y ?? 50, zoom: 1};
  const plan: CardSpot | undefined = card.plan || (plans[0] ? {src: plans[0].url, x: 50, y: 50, zoom: 2.5} : undefined);
  const nearby = card.nearby?.length ? card.nearby : defaultNearby.map(name => ({name, distance: ''}));
  const price = f.price || (unit.price ? fmt(unit.price) : '');
  const specs = [
    ['Loại hình', f.type || unit.type],
    ['TCBG', f.group || unit.group],
    ['DT đất', f.area || (unit.area ? fmt(unit.area) : ''), 'm²'],
    ['DTXD', f.builtArea || (unit.builtArea ? fmt(unit.builtArea) : ''), 'm²'],
  ] as const;
  const set = (patch: Partial<UnitCard>) => setDraft(d => ({...d, ...patch}));
  const setField = (k: keyof NonNullable<UnitCard['fields']>, v: string) => setDraft(d => ({...d, fields: {...d.fields, [k]: v}}));
  const setSpot = (slot: 'plan' | 'master', patch: Partial<CardSpot>) => setDraft(d => ({...d, [slot]: {...(slot === 'plan' ? plan : master)!, ...d[slot], ...patch}}));
  const setImage = (slot: Slot, src: string) => slot === 'perspective' ? set({perspective: src}) : setSpot(slot, {src});
  const fileInput = useRef<HTMLInputElement>(null), uploadSlot = useRef<Slot>('perspective');
  const chooseFile = (slot: Slot) => {uploadSlot.current = slot; fileInput.current?.click();};

  async function save(scope: 'unit' | 'project') {
    setBusy(true);
    try {
      const body = scope === 'unit'
        ? {projectId: project.id, code: unit.code, card: {...draft, fields: Object.fromEntries(Object.entries(draft.fields || {}).filter(([, v]) => v?.trim()))}}
        : {projectId: project.id, code: '*', card: {perspective: draft.perspective, plan: draft.plan && {...draft.plan}, master: draft.master && {...draft.master}, nearby: draft.nearby}};
      const r = await fetch('/api/unit-cards', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
      const d = await r.json(); if (!r.ok) throw Error(d.error);
      toast.success(scope === 'unit' ? `Đã lưu phiếu căn ${unit.code}.` : 'Đã lưu ảnh & tiện ích làm mặc định cho cả dự án.');
      await onSaved(); if (scope === 'unit') setEdit(false);
    } catch (e) {toast.error(e instanceof Error ? e.message : 'Không lưu được.');} finally {setBusy(false);}
  }
  async function reset() {
    if (!confirm(`Xoá chỉnh sửa riêng của ${unit.code}? Phiếu sẽ dùng lại số liệu Sheet và ảnh mặc định của dự án.`)) return;
    setBusy(true);
    try {
      const r = await fetch('/api/unit-cards', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({projectId: project.id, code: unit.code, card: null})});
      if (!r.ok) throw Error((await r.json()).error);
      toast.success('Đã khôi phục theo Sheet.'); await onSaved(); setEdit(false);
    } catch (e) {toast.error(e instanceof Error ? e.message : 'Không khôi phục được.');} finally {setBusy(false);}
  }

  const imageTools = (slot: Slot) => edit ? <div className="uc-tools">
    <button type="button" onClick={() => chooseFile(slot)}><ImagePlus size={14}/>Tải ảnh</button>
    <button type="button" onClick={() => setPickFor(slot)}><Images size={14}/>Thư viện</button>
  </div> : null;
  const input = (k: keyof NonNullable<UnitCard['fields']>, label: string) => <label key={k} className="uc-in"><span>{label}</span>
    <input value={draft.fields?.[k] || ''} placeholder={String({type: unit.type, group: unit.group, model: unit.model || '', area: unit.area || '', builtArea: unit.builtArea || '', price: unit.price || '', title: 'Mã căn', note: ''}[k] ?? '')} onChange={e => setField(k, e.target.value)}/></label>;

  return <article className={'uc' + (edit ? ' is-edit' : '')}>
    {isAdmin && <div className="uc-admin">
      {!edit ? <><button type="button" className="uc-btn is-dark" onClick={() => {setDraft(saved); setEdit(true);}}><Pencil size={15}/>Vẽ căn</button>
        <span><Clock size={13}/>{own?.updatedAt ? `Lưu lần cuối ${when(own.updatedAt)}${own.updatedBy ? ' · ' + own.updatedBy : ''}` : base?.updatedAt ? `Đang dùng mặc định dự án (${when(base.updatedAt)})` : 'Chưa vẽ – đang dùng ảnh dự án và số liệu Sheet'}</span></>
        : <><button type="button" className="uc-btn is-dark" disabled={busy} onClick={() => save('unit')}><Save size={15}/>Lưu căn này</button>
          <button type="button" className="uc-btn" disabled={busy} onClick={() => save('project')} title="Ảnh phối cảnh, 2 mặt bằng và tiện ích dùng chung cho các căn chưa vẽ riêng"><Check size={15}/>Lưu làm mặc định dự án</button>
          {own && <button type="button" className="uc-btn" disabled={busy} onClick={reset}><RotateCcw size={15}/>Khôi phục theo Sheet</button>}
          <button type="button" className="uc-btn" onClick={() => setEdit(false)}><X size={15}/>Huỷ</button></>}
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
        setBusy(true); try {setImage(uploadSlot.current, await upload(file, project.id)); toast.success('Đã tải ảnh lên.');} catch (err) {toast.error(err instanceof Error ? err.message : 'Lỗi tải ảnh.');} finally {setBusy(false);}
      }}/>
    </div>}

    <header className="uc-hero">
      <img className="uc-hero-img" src={sized(perspective, 2560)} alt={`Phối cảnh ${unit.code}`}/>
      {imageTools('perspective')}
      <div className="uc-hero-copy">
        <span className="uc-script">{f.title || 'Mã căn'}</span>
        <h2>{unit.code}</h2>
        {(f.model || unit.model) && <p className="uc-model">{f.model || unit.model}</p>}
      </div>
      <div className="uc-hero-foot">
        <dl className="uc-specs">{specs.map(([k, v, u]) => <div key={k}><dt>{k}</dt><dd>{v ? <>{v}{u && <small> {u}</small>}</> : 'Đang cập nhật'}</dd></div>)}</dl>
        <div className="uc-price"><span>Giá bán<small>Chưa VAT + KPBT</small></span><b>{price ? <>{price}<em>tỷ</em></> : 'Liên hệ'}</b><i className={status === 'Còn hàng' ? 'is-free' : ''}>{status}</i></div>
      </div>
    </header>
    {edit && <div className="uc-form">
      {input('title', 'Dòng chữ trên mã căn')}{input('type', 'Loại hình')}{input('group', 'TCBG')}{input('model', 'Mẫu nhà')}
      {input('area', 'DT đất (m²)')}{input('builtArea', 'DTXD (m²)')}{input('price', 'Giá bán (tỷ)')}{input('note', 'Ghi chú')}
      <p>Ô để trống = lấy theo Google Sheet.</p>
    </div>}

    <section className="uc-map">
      <div className="uc-map-head"><span className="uc-tag"><MapPin size={15}/>Sơ đồ vị trí</span>{edit && <small><Move size={13}/>Bấm lên ảnh để đặt vị trí căn</small>}</div>
      <div className="uc-map-grid">
        <figure className="uc-fig is-plan">
          <figcaption>Mặt bằng chỉ căn</figcaption>
          {plan ? edit ? <Pinned spot={plan} code={unit.code} edit onPin={(x, y) => setSpot('plan', {x, y})}/> : <Crop spot={plan} code={unit.code}/>
            : <div className="uc-empty">{isAdmin ? 'Chưa có mặt bằng – bấm Vẽ căn để thêm ảnh.' : 'Mặt bằng đang cập nhật'}</div>}
          {imageTools('plan')}
          {edit && plan && <label className="uc-zoom"><span>Độ zoom {(draft.plan?.zoom ?? plan.zoom).toFixed(1)}×</span><input type="range" min={1} max={8} step={0.1} value={draft.plan?.zoom ?? plan.zoom} onChange={e => setSpot('plan', {zoom: Number(e.target.value)})}/></label>}
          {edit && plan && <div className="uc-preview"><small>Xem trước</small><Crop spot={{...plan, ...draft.plan}} code={unit.code}/></div>}
        </figure>
        <figure className="uc-fig is-master">
          <figcaption>Mặt bằng tổng · {project.name}</figcaption>
          <Pinned spot={master} code={unit.code} edit={edit} onPin={(x, y) => setSpot('master', {x, y})}/>
          {imageTools('master')}
        </figure>
      </div>
    </section>

    {(nearby.length > 0 || edit) && <section className="uc-near">
      <span className="uc-tag"><MapPin size={15}/>Tiện ích lân cận</span>
      {!edit ? <ul>{nearby.map(n => <li key={n.name}><b>{n.name}</b>{n.distance && <span>{n.distance}</span>}</li>)}</ul>
        : <div className="uc-near-edit">{(draft.nearby?.length ? draft.nearby : nearby).map((n, i, all) => <div key={i}>
          <input value={n.name} placeholder="Tên tiện ích" onChange={e => set({nearby: all.map((m, j) => j === i ? {...m, name: e.target.value} : m)})}/>
          <input value={n.distance} placeholder="Khoảng cách" onChange={e => set({nearby: all.map((m, j) => j === i ? {...m, distance: e.target.value} : m)})}/>
          <button type="button" aria-label="Xoá" onClick={() => set({nearby: all.filter((_, j) => j !== i)})}><Trash2 size={14}/></button></div>)}
          <button type="button" className="uc-btn" onClick={() => set({nearby: [...(draft.nearby?.length ? draft.nearby : nearby), {name: '', distance: ''}]})}><Plus size={14}/>Thêm tiện ích</button></div>}
    </section>}
    {(f.note || unit.note) && !edit && <p className="uc-note">{f.note || unit.note}</p>}

    {pickFor && <div className="uc-picker" role="dialog" aria-label="Chọn ảnh từ thư viện" onClick={() => setPickFor(null)}>
      <div onClick={e => e.stopPropagation()}>
        <header><b>Chọn ảnh · {project.name}</b><button type="button" onClick={() => setPickFor(null)} aria-label="Đóng"><X size={18}/></button></header>
        <div className="uc-picker-grid">{[{url: project.image, name: 'Ảnh dự án', kind: 'cover'}, ...files.filter(a => a.projectId === project.id && !/\.pdf$/i.test(a.name))].map(a => <button type="button" key={a.url} onClick={() => {setImage(pickFor, a.url); setPickFor(null);}}>
          <img src={sized(a.url, 360)} alt="" loading="lazy"/><span>{a.name}</span></button>)}</div>
      </div>
    </div>}
  </article>;
}
