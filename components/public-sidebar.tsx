'use client';

import {useState, type FormEvent, type ReactNode} from 'react';
import {ArrowRight, MessageCircle, Phone, Search} from 'lucide-react';
import type {Project} from '@/lib/catalog';
import {usePublicContact} from './public-contact-provider';

export function LeadPanel({projects, source = 'Trang tin tức'}: {projects: Project[]; source?: string}) {
 const publicContact=usePublicContact();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ok: boolean; text: string} | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, data = new FormData(form);
    setBusy(true);
    setMessage(null);
    try {
      const project = String(data.get('project') || '');
      const response = await fetch('/api/leads', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: data.get('name'), phone: data.get('phone'), email: '', note: source + (project ? ' · Dự án quan tâm: ' + project : ''), website: data.get('website') || ''})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Chưa gửi được thông tin.');
      setMessage({ok: true, text: 'Đã nhận thông tin. Chúng tôi sẽ gọi lại cho bạn sớm.'});
      form.reset();
    } catch (error) {
      setMessage({ok: false, text: error instanceof Error ? error.message : 'Chưa gửi được thông tin.'});
    } finally {
      setBusy(false);
    }
  }
  return <div className="nm-lead-wrap">
    <form className="nm-panel nm-lead" id="tu-van" onSubmit={submit}>
      <h2>Tư vấn nhu cầu</h2>
      <select name="project" aria-label="Dự án quan tâm" defaultValue=""><option value="">Dự án quan tâm</option>{projects.map(project => <option key={project.id} value={project.name}>{project.name}</option>)}</select>
      <input name="name" placeholder="Nhập họ và tên" aria-label="Họ và tên" required minLength={2} maxLength={100} autoComplete="name"/>
      <input name="phone" placeholder="Nhập số điện thoại" aria-label="Số điện thoại" type="tel" required pattern="[+\d ()-]{8,20}" autoComplete="tel"/>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" hidden/>
      <label className="nm-check"><input type="checkbox" required/><span>Tôi đồng ý để Alpha Hub liên hệ tư vấn qua số điện thoại này.</span></label>
      <label className="nm-check"><input type="checkbox" required/><span>Tôi đồng ý để Alpha Hub lưu thông tin nhằm chăm sóc nhu cầu của tôi.</span></label>
      <button className="nm-submit" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi thông tin'}</button>
      {message && <p className={message.ok ? 'nm-note ok' : 'nm-note error'} role="status">{message.text}</p>}
    </form>
    <div className="nm-hotline">
      <span>Hoặc</span>
      <div><a href={'tel:' + publicContact.phone}><Phone size={14}/>{publicContact.phone}</a><a href={publicContact.zaloHref} target="_blank" rel="noreferrer"><MessageCircle size={14}/>Chat Zalo</a></div>
      <small>Để được tư vấn và giải đáp thắc mắc</small>
    </div>
  </div>;
}

type SidebarProps = {
  projects: Project[];
  source: string;
  query: string;
  onQuery: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  searchLabel?: string;
};

export default function PublicSidebar({projects, source, query, onQuery, onSearch, placeholder = 'Nhập nội dung cần tìm', searchLabel = 'Tìm kiếm'}: SidebarProps) {
  return <aside className="public-sidebar" aria-label="Tìm kiếm và tư vấn">
    <form className="nm-panel" role="search" aria-label={searchLabel} onSubmit={event => {event.preventDefault(); onSearch?.(query.trim());}}>
      <h2>Tìm kiếm</h2>
      <div className="nm-search"><Search size={17} aria-hidden="true"/><input type="search" value={query} onChange={event => onQuery(event.target.value)} placeholder={placeholder} aria-label={searchLabel} maxLength={150}/><button type="submit" className="sidebar-search-submit" aria-label={searchLabel}><ArrowRight size={16}/></button></div>
    </form>
    <LeadPanel projects={projects} source={source}/>
  </aside>;
}

export function PublicContentLayout({enabled, sidebar, children}: {enabled: boolean; sidebar: ReactNode; children: ReactNode}) {
  return enabled ? <div className="public-content-layout"><div className="public-content-main">{children}</div>{sidebar}</div> : <>{children}</>;
}
