'use client';
import {useEffect, useMemo, useState, type FormEvent} from 'react';
import Link from './site-link';
import {ArrowLeft, ArrowRight, MapPin, MessageCircle, Pencil, Phone, Plus, Search} from 'lucide-react';
import type {Article, Project} from '@/lib/catalog';
import {projectPath} from '@/lib/project-routes';
import {publicContact} from '@/lib/public-contact';

type Story = {id: string; title: string; summary: string; image: string; category: string; meta: string; href: string; article?: Article};

const ALL = 'Tổng hợp';
const PROJECTS = 'Tin dự án';
const PAGE = 8;

const vnDate = (iso: string) => {
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
};
const clip = (text: string, size = 160) => {
  const plain = text.replace(/\s+/g, ' ').trim();
  return plain.length > size ? plain.slice(0, size - 1).trimEnd() + '…' : plain;
};

const placeholderNote = /^(Dự án tham khảo|Bảng hàng tham khảo)/;
const projectSummary = (project: Project) => placeholderNote.test(project.description) || !project.description.trim()
  ? `${project.category === 'high' ? 'Dự án căn hộ cao tầng' : 'Khu đô thị thấp tầng'} của ${project.developer} tại ${project.location}. Xem quỹ căn 360°, vị trí, mặt bằng, tiện ích và bảng hàng tham khảo.`
  : clip(project.description);

function Cover({src, alt = ''}: {src: string; alt?: string}) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return <span className="nm-fallback" role={alt ? 'img' : undefined} aria-label={alt || undefined}/>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)}/>;
}

export function LeadPanel({projects, source = 'Trang tin tức'}: {projects: Project[]; source?: string}) {
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

export default function NewsMagazine({articles, projects, routeId, query, onQuery, category, onCategory, canEdit, onCreate, onEdit}: {articles: Article[]; projects: Project[]; routeId?: string; query: string; onQuery: (value: string) => void; category: string; onCategory: (value: string) => void; canEdit: boolean; onCreate: () => void; onEdit: (article: Article) => void}) {
  const [limit, setLimit] = useState(PAGE);
  const stories = useMemo<Story[]>(() => {
    const posts = [...articles].sort((a, b) => b.date.localeCompare(a.date)).map(article => ({id: article.id, title: article.title, summary: clip(article.body), image: article.image, category: article.category, meta: vnDate(article.date), href: `/tin-tuc/${article.id}`, article}));
    const places = projects.map(project => ({id: 'du-an-' + project.id, title: `${project.name}: ${project.status.toLowerCase()} tại ${project.location}`, summary: projectSummary(project), image: project.image, category: PROJECTS, meta: project.location, href: projectPath(project.id)}));
    return [...posts, ...places];
  }, [articles, projects]);
  const tabs = useMemo(() => [ALL, PROJECTS, ...Array.from(new Set(articles.map(article => article.category)))], [articles]);
  const selected = category === 'all' ? ALL : category;
  const needle = query.trim().toLowerCase();
  const visible = stories.filter(story => (selected === ALL || story.category === selected) && (!needle || (story.title + ' ' + story.summary).toLowerCase().includes(needle)));
  useEffect(() => setLimit(PAGE), [selected, needle]);
  const [featured, ...others] = visible;
  const trio = others.slice(0, 3);
  const list = others.slice(3);
  const opened = routeId ? articles.find(article => article.id === routeId) : undefined;
  const related = opened ? stories.filter(story => story.id !== opened.id).slice(0, 4) : [];

  return <section className="nm">
    <header className="nm-head">
      <h1>Tin tức</h1>
      <nav className="nm-tabs" aria-label="Danh mục tin tức">{tabs.map(name => <button key={name} type="button" aria-pressed={selected === name} onClick={() => {onCategory(name === ALL ? 'all' : name); if (routeId) window.location.assign('/tin-tuc');}}>{name}</button>)}</nav>
    </header>
    <div className="nm-layout">
      <main className="nm-main">
        {routeId ? (opened ? <article className="nm-article">
          <Link href="/tin-tuc" className="nm-back"><ArrowLeft size={16}/>Tất cả tin tức</Link>
          <span className="nm-kicker">{opened.category} · {vnDate(opened.date)}</span>
          <h2>{opened.title}</h2>
          <div className="nm-article-cover"><Cover src={opened.image} alt={opened.title}/></div>
          <div className="nm-article-body">{opened.body.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          {canEdit && <button className="nm-edit dark" type="button" onClick={() => onEdit(opened)}><Pencil size={15}/>Sửa bài viết</button>}
          {related.length > 0 && <div className="nm-related"><h3>Có thể bạn quan tâm</h3><div className="nm-trio">{related.slice(0, 3).map(story => <Link key={story.id} href={story.href} className="nm-card"><span className="nm-card-photo"><Cover src={story.image}/></span><strong>{story.title}</strong><time>{story.meta}</time></Link>)}</div></div>}
        </article> : <div className="nm-article"><h2>Không tìm thấy bài viết</h2><p>Bài viết này không còn trên website.</p><Link href="/tin-tuc" className="nm-read">Về trang tin tức <ArrowRight size={16}/></Link></div>) : <>
          <div className="nm-section-title"><h2>{selected}</h2>{canEdit && <button type="button" className="nm-edit" onClick={onCreate}><Plus size={16}/>Viết bài</button>}</div>
          {featured ? <div className="nm-spotlight">
            <article className="nm-feature">
              <div className="nm-feature-text">
                <h3><Link href={featured.href}>{featured.title}</Link></h3>
                <p>{featured.summary}</p>
                <time>{featured.meta}</time>
                <div className="nm-feature-actions"><Link className="nm-read" href={featured.href}>{featured.article ? 'Đọc bài viết' : 'Xem dự án'} <ArrowRight size={16}/></Link>{canEdit && featured.article && <button type="button" className="nm-edit" onClick={() => onEdit(featured.article!)}><Pencil size={14}/>Sửa</button>}</div>
              </div>
              <Link href={featured.href} className="nm-feature-photo" aria-label={featured.title}><Cover src={featured.image}/></Link>
            </article>
            {trio.length > 0 && <div className="nm-trio">{trio.map(story => <Link key={story.id} href={story.href} className="nm-card"><span className="nm-card-photo"><Cover src={story.image}/></span><strong>{story.title}</strong><time>{story.meta}</time></Link>)}</div>}
          </div> : <div className="nm-empty"><h3>Chưa có tin phù hợp</h3><p>Thử một chuyên mục khác hoặc xoá từ khoá tìm kiếm.</p></div>}
          {list.length > 0 && <div className="nm-list">
            {list.slice(0, limit).map(story => <article key={story.id} className="nm-row">
              <Link href={story.href} className="nm-row-photo" tabIndex={-1} aria-hidden="true"><Cover src={story.image}/></Link>
              <div>
                <h3><Link href={story.href}>{story.title}</Link></h3>
                <p>{story.summary}</p>
                <time>{story.category === PROJECTS ? <><MapPin size={13}/>{story.meta}</> : story.meta}</time>
                {canEdit && story.article && <button type="button" className="nm-row-edit" onClick={() => onEdit(story.article!)}><Pencil size={13}/>Sửa</button>}
              </div>
            </article>)}
            {list.length > limit && <button type="button" className="nm-more" onClick={() => setLimit(limit + PAGE)}>Xem thêm tin</button>}
          </div>}
        </>}
      </main>
      <aside className="nm-side">
        <form className="nm-panel" role="search" onSubmit={event => {event.preventDefault(); if (routeId) window.location.assign('/tin-tuc');}}>
          <h2>Tìm kiếm</h2>
          <label className="nm-search"><Search size={17}/><input type="search" value={query} onChange={event => onQuery(event.target.value)} placeholder="Nhập nội dung cần tìm" aria-label="Tìm tin tức"/></label>
        </form>
        <LeadPanel projects={projects}/>
      </aside>
    </div>
    <div className="nm-tour">
      <div><span>Đăng ký tham quan</span><h2>Dự án & căn hộ mẫu</h2><p>Để trực tiếp trải nghiệm căn nhà mới, mời quý khách đăng ký tham quan.</p></div>
      <div className="nm-tour-actions"><a className="nm-read" href="#tu-van">Đăng ký tham quan <ArrowRight size={16}/></a><Link className="nm-ghost" href="/du-an">Xem danh sách dự án</Link></div>
    </div>
  </section>;
}
