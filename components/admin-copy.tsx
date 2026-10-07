'use client';
import {useMemo, useState} from 'react';
import {ExternalLink, RotateCcw, Save, Search} from 'lucide-react';
import {copyGroups, type SiteCopy} from '@/lib/site-copy';

/** Quản trị → Nội dung trang: edit the fixed texts of the public pages. Empty = default text. */
export default function AdminCopy({copy, busy, onSave}: {copy: SiteCopy; busy: boolean; onSave: (data: SiteCopy) => Promise<boolean>}) {
  const [draft, setDraft] = useState<SiteCopy>(copy), [q, setQ] = useState(''), [group, setGroup] = useState(copyGroups[0].id);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(copy), [draft, copy]);
  const norm = (s: string) => s.toLocaleLowerCase('vi');
  const groups = q.trim() ? copyGroups.map(g => ({...g, fields: g.fields.filter(f => norm(f.label + ' ' + (draft[f.key] || f.default)).includes(norm(q.trim())))})).filter(g => g.fields.length) : copyGroups.filter(g => g.id === group);
  return <form className="admin-copy" onSubmit={async e => {e.preventDefault(); await onSave(Object.fromEntries(Object.entries(draft).filter(([, v]) => v.trim())));}}>
    <aside className="admin-copy-nav">
      <label className="admin-copy-search"><Search size={16}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm đoạn chữ…" aria-label="Tìm đoạn chữ"/></label>
      {copyGroups.map(g => <button type="button" key={g.id} className={!q && group === g.id ? 'is-on' : ''} onClick={() => {setGroup(g.id); setQ('');}}>{g.title}<small>{g.fields.filter(f => draft[f.key]?.trim()).length}/{g.fields.length} đã sửa</small></button>)}
    </aside>
    <div className="admin-copy-body">
      {groups.map(g => <section key={g.id} className="settings-card">
        <div className="admin-copy-head"><h2>{g.title}</h2><a href={g.page} target="_blank" rel="noreferrer"><ExternalLink size={15}/>Xem trang</a></div>
        <p className="muted">Để trống để dùng chữ mặc định. Xuống dòng trong tiêu đề sẽ ngắt dòng trên website.</p>
        <div className="admin-copy-fields">{g.fields.map(f => {const value = draft[f.key] ?? '';
          return <label key={f.key} className="field"><span>{f.label}{value.trim() && <button type="button" className="admin-copy-reset" onClick={() => setDraft({...draft, [f.key]: ''})}><RotateCcw size={13}/>Mặc định</button>}</span>
            {f.long ? <textarea rows={f.default.length > 90 ? 3 : 2} value={value} placeholder={f.default} onChange={e => setDraft({...draft, [f.key]: e.target.value})}/> : <input value={value} placeholder={f.default} onChange={e => setDraft({...draft, [f.key]: e.target.value})}/>}</label>;})}</div>
      </section>)}
      {!groups.length && <p className="muted">Không tìm thấy đoạn chữ phù hợp.</p>}
      <div className="admin-copy-actions"><button className="button dark" disabled={busy || !dirty}><Save size={17}/>{busy ? 'Đang lưu…' : 'Lưu nội dung trang'}</button>{dirty && <button type="button" className="button subtle" onClick={() => setDraft(copy)}>Hủy thay đổi</button>}</div>
    </div>
  </form>;
}
