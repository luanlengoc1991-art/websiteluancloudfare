'use client';
import {useEffect, useState} from 'react';
import {CheckCheck, ExternalLink, FileSpreadsheet, Link2Off, RefreshCw, Search} from 'lucide-react';
import {toast} from 'sonner';
import type {Project, Unit} from '@/lib/catalog';
import {projectPath} from '@/lib/project-routes';

type Info = {url?: string; syncedAt?: number; count?: number; error?: string};

/** Quản trị → Mã căn (Sheet): one Google Sheet per project. "Đồng bộ" reads the sheet and the website then shows
 *  exactly the sheet's units for that project. Admin only; visitors never see this. */
export default function AdminUnitSheets({projects, units, onRefresh}: {projects: Project[]; units: Unit[]; onRefresh: () => unknown}) {
  const [sheets, setSheets] = useState<Record<string, Info>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(''), [open, setOpen] = useState(''), [q, setQ] = useState('');
  const load = async () => {
    const r = await fetch('/api/unit-sheets', {cache: 'no-store'});
    if (r.ok) {const d = await r.json(); setSheets(d.sheets); setDraft(cur => ({...Object.fromEntries(Object.entries(d.sheets as Record<string, Info>).map(([k, v]) => [k, v.url || ''])), ...cur}));}
  };
  useEffect(() => {load();}, []);
  const call = async (projectId: string, action: 'sync' | 'clear') => {
    setBusy(projectId + action);
    try {
      const r = await fetch('/api/unit-sheets', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({projectId, action, url: draft[projectId] || ''})});
      const d = await r.json();
      if (!r.ok) throw Error(d.error || 'Không đồng bộ được.');
      toast.success(action === 'sync' ? `Đã đồng bộ ${d.count} căn từ Sheet.` : 'Đã bỏ đồng bộ, dự án dùng lại dữ liệu mặc định.');
      if (action === 'clear') setDraft(cur => ({...cur, [projectId]: ''}));
      await Promise.all([load(), onRefresh()]);
    } catch (e) {toast.error(e instanceof Error ? e.message : 'Không đồng bộ được.'); load();}
    finally {setBusy('');}
  };
  const setStatus = async (projectId: string, body: object, ok: string) => {
    setBusy(projectId + 'status');
    try {
      const r = await fetch('/api/unit-sheets', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({projectId, ...body})});
      const d = await r.json(); if (!r.ok) throw Error(d.error || 'Không cập nhật được.');
      toast.success(ok); await onRefresh();
    } catch (e) {toast.error(e instanceof Error ? e.message : 'Không cập nhật được.');} finally {setBusy('');}
  };
  const time = (t?: number) => t ? new Date(t).toLocaleString('vi-VN', {hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'}) : '';
  const list = projects.filter(p => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()));
  return <div className="aus">
    <section className="settings-card aus-intro">
      <h2><FileSpreadsheet size={20}/>Mã căn đồng bộ từ Google Sheet</h2>
      <p className="muted">Mỗi dự án gắn 1 link Google Sheet (chia sẻ “Bất kỳ ai có đường liên kết đều xem được”). Bấm <b>Đồng bộ</b> để lấy toàn bộ mã căn trong Sheet: website sẽ hiện đúng các căn có trong Sheet (Sheet 10 căn → web 10 căn). Dòng tiêu đề cần cột <b>Mã căn</b>; các cột khác nhận theo tên: Phân khu, Tòa, Loại hình, Hướng, Diện tích, DT xây dựng, Giá (tỷ hoặc VNĐ), Đơn giá, Trạng thái (Còn hàng / Đang giữ chỗ / Đã bán), Tầng, Phòng ngủ, Ghi chú, Ưu đãi, Link mặt bằng, Link ảnh.</p>
      <label className="admin-copy-search"><Search size={16}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm dự án…"/></label>
    </section>
    {list.map(p => {
      const info = sheets[p.id] || {}, mine = units.filter(u => u.projectId === p.id), synced = !!info.syncedAt;
      return <section key={p.id} className="settings-card aus-row">
        <div className="aus-head">
          <div><h3>{p.name}</h3><p className="muted">{synced ? <><span className="aus-ok">Đang theo Sheet</span> {info.count} căn · đồng bộ lúc {time(info.syncedAt)}</> : <>Chưa gắn Sheet · đang dùng dữ liệu mặc định ({mine.length} căn)</>}</p>
            {info.error && <p className="aus-err">{info.error}</p>}</div>
          <a className="button subtle" href={projectPath(p.id, 'inventory')} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Xem bảng hàng</a>
        </div>
        <div className="aus-form">
          <input value={draft[p.id] ?? ''} onChange={e => setDraft({...draft, [p.id]: e.target.value})} placeholder="https://docs.google.com/spreadsheets/d/…/edit#gid=0" aria-label={`Link Google Sheet của ${p.name}`}/>
          <button className="button dark" disabled={!!busy || !(draft[p.id] || '').trim()} onClick={() => call(p.id, 'sync')}><RefreshCw size={16} className={busy === p.id + 'sync' ? 'spin' : ''}/>{busy === p.id + 'sync' ? 'Đang đồng bộ…' : 'Đồng bộ'}</button>
          {info.url && <a className="button subtle" href={info.url} target="_blank" rel="noreferrer"><FileSpreadsheet size={15}/>Mở Sheet</a>}
          {(synced || info.url) && <button className="button subtle" disabled={!!busy} onClick={() => {if (confirm(`Bỏ đồng bộ Sheet của ${p.name}? Website sẽ dùng lại dữ liệu mặc định.`)) call(p.id, 'clear');}}><Link2Off size={15}/>Bỏ đồng bộ</button>}
          <button className="button subtle" onClick={() => setOpen(open === p.id ? '' : p.id)}>{open === p.id ? 'Ẩn mã căn' : `Xem ${mine.length} mã căn`}</button>
        </div>
        {open === p.id && <div className="aus-units">
          {synced && <div className="aus-units-bar"><span>{mine.filter(u => u.status === 'Còn hàng').length} còn hàng · {mine.filter(u => u.status !== 'Còn hàng').length} hết hàng</span><button className="button subtle" disabled={!!busy} onClick={() => setStatus(p.id, {action: 'all-available'}, 'Đã đặt tất cả căn về Còn hàng.')}><CheckCheck size={15}/>Còn hàng tất cả</button></div>}
          {!synced && <p className="muted">Đồng bộ Sheet để chỉnh trạng thái từng căn.</p>}
          <div className="aus-codes">{mine.map(u => {const on = u.status === 'Còn hàng'; return synced
            ? <button type="button" key={u.id} disabled={!!busy} className={'aus-code' + (on ? ' is-on' : ' is-sold')} title={`${u.type} · ${u.area} m² · ${u.price} tỷ — bấm để đổi trạng thái`} onClick={() => setStatus(p.id, {action: 'status', code: u.code, status: on ? 'Đã bán' : 'Còn hàng'}, `${u.code}: ${on ? 'Hết hàng' : 'Còn hàng'}`)}><b>{u.code}</b><small>{on ? 'Còn hàng' : 'Hết hàng'}</small></button>
            : <span key={u.id} className="aus-code is-on"><b>{u.code}</b><small>{u.status}</small></span>;})}{!mine.length && <em className="muted">Chưa có căn.</em>}</div>
        </div>}
      </section>;
    })}
  </div>;
}
