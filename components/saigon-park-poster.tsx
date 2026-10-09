'use client';
/* Vinhomes Saigon Park unit poster (1512 × 2044), the layout of the owner's studio mat-bang-saigon-park.lengocluan.chatgpt.site
 * rebuilt natively: every layer is an R2 image + live text, so it stays light and follows the Google Sheet.
 * Admins place the unit on the zoomed plan and on the aerial view, change the house picture and override text. */
import {useEffect, useRef, useState} from 'react';
import {Check, Clock, ImagePlus, Images, Pencil, RotateCcw, Save, X} from 'lucide-react';
import {toast} from 'sonner';
import type {Asset, Project, Unit} from '@/lib/catalog';
import {type CardSpot, type UnitCard, mergeCard} from '@/lib/unit-card';
import {saigonParkModelImage} from '@/lib/saigon-park-models';
import {sized} from '@/lib/img';

const F = (id: string) => `/api/files/${id}`;
const MAP = F('sgp-map-new');
const fmt = (n: number) => n.toLocaleString('en-US', {maximumFractionDigits: 2});
const when = (t?: number) => t ? new Date(t).toLocaleString('vi-VN', {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'}) : '';
const defaultPlan: CardSpot = {src: MAP, x: 50, y: 50, zoom: 9};
const defaultPin: CardSpot = {src: F('sgp-aerial-2026'), x: 49, y: 68, zoom: 1};

export default function SaigonParkPoster({project, unit, status, own, base, files, isAdmin, onSaved}: {
  project: Project; unit: Unit; status: string; own?: UnitCard; base?: UnitCard; files: Asset[]; isAdmin: boolean; onSaved: () => unknown;
}) {
  const saved = mergeCard(base, own);
  const [edit, setEdit] = useState(false), [busy, setBusy] = useState(false), [tool, setTool] = useState<'plan' | 'pin' | null>(null), [pick, setPick] = useState(false);
  const [draft, setDraft] = useState<UnitCard>(saved);
  useEffect(() => {if (!edit) setDraft(mergeCard(base, own));}, [own, base, edit, unit.id]);
  const card = edit ? draft : saved, f = card.fields || {};
  const plan = {...defaultPlan, ...card.plan, src: card.plan?.src || MAP};
  const pin = card.master?.src?.includes('sgp-aerial') || card.master?.src === undefined ? {...defaultPin, ...card.master} : defaultPin;
  const house = own?.perspective || (edit && draft.perspective !== base?.perspective ? draft.perspective : '') || saigonParkModelImage(f.model || unit.model) || card.perspective || F('sgp-model-16');
  const price = f.price || (unit.price ? fmt(unit.price) : '');
  const facts: [string, string][] = [
    ['Loại hình:', f.type || unit.type], ['TCBG:', f.group || unit.group],
    ['DT Đất:', f.area || (unit.area ? fmt(unit.area) + ' m²' : '')], ['DTXD:', f.builtArea || (unit.builtArea ? fmt(unit.builtArea) + ' m²' : '')],
  ];
  const fileInput = useRef<HTMLInputElement>(null);
  const setField = (k: keyof NonNullable<UnitCard['fields']>, v: string) => setDraft(d => ({...d, fields: {...d.fields, [k]: v}}));
  const at = (e: React.MouseEvent<HTMLElement>) => {const r = e.currentTarget.getBoundingClientRect(); return {x: Math.round((e.clientX - r.left) / r.width * 1000) / 10, y: Math.round((e.clientY - r.top) / r.height * 1000) / 10};};

  async function post(body: object, ok: string) {
    setBusy(true);
    try {
      const r = await fetch('/api/unit-cards', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({projectId: project.id, ...body})});
      const d = await r.json(); if (!r.ok) throw Error(d.error);
      toast.success(ok); await onSaved(); return true;
    } catch (e) {toast.error(e instanceof Error ? e.message : 'Không lưu được.'); return false;} finally {setBusy(false);}
  }
  const fields = () => Object.fromEntries(Object.entries(draft.fields || {}).filter(([, v]) => v?.trim()));
  const saveUnit = async () => {if (await post({code: unit.code, card: {...draft, perspective: draft.perspective !== base?.perspective ? draft.perspective : undefined, plan, master: pin, fields: fields()}}, `Đã lưu phiếu ${unit.code}.`)) {setEdit(false); setTool(null);}};
  const saveDefault = () => post({code: '*', card: {perspective: base?.perspective, plan: {...plan, x: base?.plan?.x ?? 50, y: base?.plan?.y ?? 50}, master: base?.master, nearby: base?.nearby}}, 'Đã lưu độ zoom mặt bằng làm mặc định dự án.');
  const reset = async () => {if (confirm(`Xoá chỉnh sửa riêng của ${unit.code}?`) && await post({code: unit.code, card: null}, 'Đã khôi phục theo Sheet.')) setEdit(false);};

  return <div className={'spp-wrap' + (edit ? ' is-edit' : '')}>
    {isAdmin && <div className="uc-admin">
      {!edit ? <><button type="button" className="uc-btn is-dark" onClick={() => {setDraft(saved); setEdit(true);}}><Pencil size={15}/>Vẽ căn</button>
        <span><Clock size={13}/>{own?.updatedAt ? `Lưu lần cuối ${when(own.updatedAt)}${own.updatedBy ? ' · ' + own.updatedBy : ''}` : 'Chưa định vị riêng – đang dùng vị trí mặc định'}</span></>
        : <><button type="button" className={'uc-btn' + (tool === 'plan' ? ' is-dark' : '')} onClick={() => setTool(tool === 'plan' ? null : 'plan')}>Chỉ căn trên mặt bằng</button>
          <button type="button" className={'uc-btn' + (tool === 'pin' ? ' is-dark' : '')} onClick={() => setTool(tool === 'pin' ? null : 'pin')}>Đặt ghim phối cảnh</button>
          <button type="button" className="uc-btn" onClick={() => fileInput.current?.click()}><ImagePlus size={15}/>Ảnh nhà</button>
          <button type="button" className="uc-btn" onClick={() => setPick(true)}><Images size={15}/>Thư viện</button>
          <button type="button" className="uc-btn is-dark" disabled={busy} onClick={saveUnit}><Save size={15}/>Lưu căn này</button>
          <button type="button" className="uc-btn" disabled={busy} onClick={saveDefault} title="Độ zoom mặt bằng dùng cho mọi căn"><Check size={15}/>Zoom mặc định</button>
          {own && <button type="button" className="uc-btn" disabled={busy} onClick={reset}><RotateCcw size={15}/>Khôi phục</button>}
          <button type="button" className="uc-btn" onClick={() => {setEdit(false); setTool(null);}}><X size={15}/>Huỷ</button></>}
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
        setBusy(true);
        try {const form = new FormData(); form.append('file', file); form.append('projectId', project.id); form.append('kind', 'image');
          const r = await fetch('/api/upload', {method: 'POST', body: form}); const d = await r.json(); if (!r.ok) throw Error(d.error);
          setDraft(x => ({...x, perspective: d.url})); toast.success('Đã tải ảnh nhà.');} catch (err) {toast.error(err instanceof Error ? err.message : 'Lỗi tải ảnh.');} finally {setBusy(false);}
      }}/>
    </div>}

    <div className="spp" onClick={e => {if (tool === 'pin') {const p = at(e); setDraft(d => ({...d, master: {...pin, x: p.x, y: p.y}}));}}}>
      <img className="spp-bg" src={sized(F('sgp-poster-bg'), 1600)} alt=""/>
      <div className="spp-aerial"><img src={sized(F('sgp-aerial-2026'), 2000)} alt="Phối cảnh tổng Vinhomes Saigon Park"/></div>
      <div className="spp-house"><img src={sized(house, 1600)} alt={`Mẫu nhà ${unit.model || ''}`}/></div>
      <img className="spp-strip" src={F('sgp-strip')} alt=""/>
      <img className="spp-logo" src={F('sgp-logo')} alt="Vinhomes Saigon Park"/>
      <span className="spp-script">{f.title || 'Mã căn'}</span>
      <b className="spp-code">{unit.code}</b>
      {facts.map(([k, v], i) => <span key={k} className={'spp-fact is-' + i}><i>{k}</i><em>{v || 'Đang cập nhật'}</em></span>)}
      <div className="spp-price"><img src={F('sgp-price-bg')} alt=""/><small>GIÁ BÁN<br/>(CHƯA VAT + KPBT)</small>
        {price ? <b>{price}<sup>TỶ</sup></b> : <b className="is-contact">LIÊN HỆ</b>}</div>
      <div className="spp-plan" onClick={e => {if (tool === 'plan') e.stopPropagation();}}>
        <img src={plan.zoom > 1.6 ? plan.src : sized(plan.src, 2560)} alt={`Mặt bằng chỉ căn ${unit.code}`} style={{width: `${plan.zoom * 100}%`, transform: `translate(-${plan.x}%, -${plan.y}%)`}}/>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden><defs><marker id="spp-ah" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#e11d2a"/></marker></defs><path d="M58 62 Q50 60 41.5 51" stroke="#e11d2a" strokeWidth="1.1" fill="none" vectorEffect="non-scaling-stroke" markerEnd="url(#spp-ah)"/></svg>
        <span className="spp-tag is-inset"><img src={F('sgp-pin')} alt=""/><b>{unit.code}</b></span>
      </div>
      <img className="spp-loc" src={F('sgp-loc-title')} alt="Sơ đồ vị trí"/>
      <span className="spp-tag is-aerial" style={{left: `${pin.x}%`, top: `${pin.y}%`}}><img src={F('sgp-pin')} alt=""/><b>{unit.code}</b></span>
      {status !== 'Còn hàng' && <span className="spp-sold">{status}</span>}
      {tool === 'pin' && <span className="spp-hint">Bấm lên phối cảnh để đặt ghim {unit.code}</span>}
    </div>

    {edit && tool === 'plan' && <div className="spp-editor">
      <p>Bấm lên mặt bằng tổng để chỉ đúng vị trí <b>{unit.code}</b>, kéo thanh để chỉnh độ zoom của khung mặt bằng.</p>
      <div className="spp-map" onClick={e => {const p = at(e); setDraft(d => ({...d, plan: {...plan, x: p.x, y: p.y}}));}}>
        <img src={sized(MAP, 2560)} alt="Mặt bằng tổng"/><span style={{left: `${plan.x}%`, top: `${plan.y}%`}}/></div>
      <label className="uc-zoom"><span>Zoom {plan.zoom.toFixed(1)}×</span><input type="range" min={2} max={20} step={0.5} value={plan.zoom} onChange={e => setDraft(d => ({...d, plan: {...plan, zoom: Number(e.target.value)}}))}/></label>
    </div>}
    {edit && <div className="uc-form">
      {([['title', 'Dòng chữ'], ['type', 'Loại hình'], ['group', 'TCBG'], ['model', 'Mẫu nhà'], ['area', 'DT Đất'], ['builtArea', 'DTXD'], ['price', 'Giá (tỷ)'], ['note', 'Ghi chú']] as const).map(([k, l]) =>
        <label key={k} className="uc-in"><span>{l}</span><input value={draft.fields?.[k] || ''} placeholder={String((unit as Record<string, unknown>)[k] || '')} onChange={e => setField(k, e.target.value)}/></label>)}
      <p>Ô để trống = lấy theo Google Sheet. Ảnh nhà tự lấy theo cột Mẫu nhà.</p>
    </div>}
    {pick && <div className="uc-picker" role="dialog" onClick={() => setPick(false)}><div onClick={e => e.stopPropagation()}>
      <header><b>Chọn ảnh nhà</b><button type="button" onClick={() => setPick(false)} aria-label="Đóng"><X size={18}/></button></header>
      <div className="uc-picker-grid">{files.filter(a => a.projectId === project.id && ['model', 'gallery', 'image'].includes(a.kind) && !/sgp-(pin|strip|loc|price|logo|marker)/.test(a.url)).map(a =>
        <button type="button" key={a.url} onClick={() => {setDraft(d => ({...d, perspective: a.url})); setPick(false);}}><img src={sized(a.url, 360)} alt="" loading="lazy"/><span>{a.name}</span></button>)}</div>
    </div></div>}
  </div>;
}
