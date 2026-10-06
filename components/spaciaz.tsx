'use client';

/* Public layouts modelled on the Spaciaz theme (demo2.wpopal.com/spaciaz), filled with
 * Alpha Hub's own projects, units, articles and About/AlphaHub copy. Styles: app/spaciaz.css. */
import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import Link from './site-link';
import {ArrowUpRight, Building2, Calendar, ChevronLeft, ChevronRight, Globe, Handshake, Heart, House, Layers, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Search, ShieldCheck, Sparkles, Star, TrendingUp, Users, Map as MapIcon} from 'lucide-react';
import type {Article, Asset, Project, Unit} from '@/lib/catalog';
import type {AboutContent} from '@/lib/site-content';
import type {PublicContact} from '@/lib/public-contact';
import {projectPath} from '@/lib/project-routes';
import {alphaHubContent} from '@/lib/alphahub-content';

const lines = (text: string) => text.split('\n').map((line, i, all) => <span key={i}>{line}{i < all.length - 1 && <br/>}</span>);
const vnDate = (iso: string) => {const [y, m, d] = iso.split('-'); return y && m && d ? `${d}/${m}/${y}` : iso;};
const clip = (text: string, size = 150) => {const plain = text.replace(/\s+/g, ' ').trim(); return plain.length > size ? plain.slice(0, size - 1).trimEnd() + '…' : plain;};
const placeholderNote = /^(Dự án tham khảo|Bảng hàng tham khảo)/;
const projectSummary = (p: Project) => placeholderNote.test(p.description) || !p.description.trim()
  ? `${p.category === 'high' ? 'Dự án căn hộ cao tầng' : 'Khu đô thị thấp tầng'} của ${p.developer} tại ${p.location}. Xem quỹ căn 360°, vị trí, mặt bằng, tiện ích và bảng hàng tham khảo.`
  : clip(p.description, 180);
const platform = alphaHubContent.topics.filter(t => t.group === 'platform');
const benefits = alphaHubContent.topics.filter(t => t.group === 'benefits');

function Img({src, alt = '', className}: {src?: string; alt?: string; className?: string}) {
  const [broken, setBroken] = useState(false);
  return src && !broken ? <img className={className} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setBroken(true)}/> : <span className={'sz-img-fallback ' + (className || '')}><Building2 size={32}/></span>;
}

/** Pill label whose text ticks across, as on Spaciaz section labels. */
export function Eyebrow({children, light = false}: {children: string; light?: boolean}) {
  return <span className={'sz-eyebrow' + (light ? ' is-light' : '')}><i aria-hidden="true"/><span className="sz-eyebrow-window"><span className="sz-eyebrow-track"><span>{children}</span><span aria-hidden="true">{children}</span></span></span></span>;
}

/** Text + round arrow button; the circle floods the pill on hover. */
export function ArrowButton({href, children, tone = 'mint', external = false}: {href: string; children: ReactNode; tone?: 'mint' | 'white' | 'dark'; external?: boolean}) {
  const body = <><span>{children}</span><i aria-hidden="true"><ArrowUpRight size={16}/></i></>;
  return external ? <a className={'sz-btn is-' + tone} href={href} target="_blank" rel="noreferrer">{body}</a> : <Link className={'sz-btn is-' + tone} href={href}>{body}</Link>;
}

/** Inner-page banner: the page photo (site atmosphere) with a big title and breadcrumb. */
export function Banner({title, aside, crumb}: {title: string; aside?: string; crumb?: string}) {
  return <section className="sz-banner"><div className="sz-wrap">
    <h1 data-fx="title">{title}</h1>
    {aside && <p className="sz-banner-aside" data-fx="right">{aside}</p>}
    <nav className="sz-crumbs" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><i/><span>{crumb || title}</span></nav>
  </div></section>;
}

/** White sheet with rounded top corners that rises over the banner photo. */
export function Sheet({children, className = ''}: {children: ReactNode; className?: string}) {
  return <div className={'sz-sheet ' + className}>{children}</div>;
}

function LeadForm({projects, note, compact = false}: {projects: Project[]; note: string; compact?: boolean}) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [ok, setOk] = useState(false);
  return <form className={'sz-form' + (compact ? ' is-compact' : '')} onSubmit={async event => {
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/leads', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: data.name, phone: data.phone, email: data.email || '', note: `${note}${data.project ? ' · Dự án: ' + data.project : ''}${data.message ? ' · ' + data.message : ''}`.slice(0, 2000), website: data.website || undefined})});
      const d = await r.json(); if (!r.ok) throw Error(d.error);
      setOk(true); setMessage('Đã nhận yêu cầu. Đội ngũ Alpha Hub sẽ liên hệ với bạn sớm.'); form.reset();
    } catch (e) {setOk(false); setMessage(e instanceof Error ? e.message : 'Chưa gửi được yêu cầu.');} finally {setBusy(false);}
  }}>
    <input name="website" tabIndex={-1} autoComplete="off" className="sz-trap" aria-hidden="true"/>
    <input name="name" placeholder="Họ và tên*" aria-label="Họ và tên" required minLength={2} maxLength={100}/>
    <input name="phone" placeholder="Số điện thoại*" aria-label="Số điện thoại" required pattern="[+\d ()-]{8,20}" inputMode="tel"/>
    <input name="email" type="email" placeholder="Email" aria-label="Email" maxLength={254}/>
    <select name="project" aria-label="Dự án quan tâm" defaultValue=""><option value="">Dự án quan tâm…</option>{projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select>
    {!compact && <textarea name="message" placeholder="Nội dung cần tư vấn…" aria-label="Nội dung" maxLength={1500} rows={5}/>}
    <div className="sz-form-foot"><p className={message ? (ok ? 'is-ok' : 'is-error') : ''} role="status">{message || 'Thông tin của bạn chỉ dùng để liên hệ tư vấn. Trường có dấu * là bắt buộc.'}</p>
      <button className="sz-btn is-mint" disabled={busy}><span>{busy ? 'Đang gửi…' : 'Nhận tư vấn'}</span><i aria-hidden="true"><ArrowUpRight size={16}/></i></button></div>
  </form>;
}

/* ═══════════════════════════ Trang chủ ═══════════════════════════ */
type HomeProps = {projects: Project[]; units: Unit[]; articles: Article[]; about: AboutContent; brand: string; contact: PublicContact; statusOf: (u: Unit) => string};

export function SpaciazHome({projects, units, articles, about, brand, contact, statusOf}: HomeProps) {
  const featured = projects.find(p => p.id === about.featuredProjectId) || projects[0];
  const showcase = useMemo(() => [...projects].sort((a, b) => Number(b.hot) - Number(a.hot)).slice(0, 5), [projects]);
  const selected = about.selectedProjectIds.map(id => projects.find(p => p.id === id)).filter(Boolean) as Project[];
  const team = (selected.length >= 3 ? selected : showcase).slice(0, 3);
  const available = units.filter(u => statusOf(u) === 'Còn hàng').length;
  const developers = Array.from(new Set(projects.map(p => p.developer).filter(Boolean)));
  const posts = [...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const icons = [Building2, Globe, Layers, Handshake, ShieldCheck];
  const lowImage = projects.find(p => p.category === 'low' && p.id !== featured?.id)?.image || featured?.image;
  const highImage = projects.find(p => p.category === 'high')?.image || featured?.image;
  const services = [
    {title: 'Dự án thấp tầng', body: `${projects.filter(p => p.category === 'low').length} dự án biệt thự, liền kề, shophouse`, href: '/du-an', image: lowImage},
    {title: 'Dự án cao tầng', body: `${projects.filter(p => p.category === 'high').length} dự án căn hộ`, href: '/du-an', image: highImage},
    {title: 'Quỹ căn 360°', body: 'Phối cảnh, mặt bằng và vị trí từng căn', href: projectPath(about.featuredProjectId, 'vr'), image: featured?.image},
    {title: 'Bảng hàng & quỹ căn', body: `${units.length} căn · ${available} căn còn hàng`, href: '/quy-hang', image: projects[1]?.image},
    {title: 'Tin tức & kiến thức', body: 'Hướng dẫn, nghiệp vụ và tin dự án', href: '/tin-tuc', image: projects[2]?.image},
  ];
  return <div className="sz sz-home">
    <section className="sz-hero">
      <div className="sz-wrap">
        <div className="sz-hero-copy">
          <h1 data-fx="title">{lines(about.headline || 'Không gian kết nối\ndự án & quỹ căn')}</h1>
          <p data-fx="">{about.introduction || alphaHubContent.introduction}</p>
        </div>
        <div className="sz-hero-row">
          <p className="sz-hero-statement" data-fx="left">{about.platformBody}</p>
          <div data-fx="right"><ArrowButton href="/du-an" tone="white">Khám phá dự án</ArrowButton></div>
        </div>
        <div className="sz-hero-cards">{platform.slice(0, 3).map((topic, i) => {const Icon = icons[i]; return <Link key={topic.id} href={topic.href} className="sz-glass" data-fx="">
          <Icon size={38} strokeWidth={1.6}/><h3>{topic.title}</h3><p>{clip(topic.body, 120)}</p></Link>;})}</div>
      </div>
    </section>

    <Sheet className="sz-home-sheet">
      <section className="sz-section sz-who sz-wrap">
        <div data-fx="left"><Eyebrow>{`Về ${brand}`}</Eyebrow></div>
        <div>
          <h2 className="sz-h2" data-fx="title">{lines(about.platformTitle)}</h2>
          <div className="sz-who-cols">{platform.slice(3, 5).map((topic, i) => {const Icon = [Users, TrendingUp][i]; return <div key={topic.id} data-fx="">
            <h3><Icon size={22}/>{topic.title}</h3><p>{topic.body}</p></div>;})}</div>
        </div>
      </section>

      <section className="sz-bento sz-wrap">
        <Link href={featured ? projectPath(featured.id) : '/du-an'} className="sz-bento-photo sz-notch-tl" data-fx="zoom"><Img src={featured?.image} alt={featured?.name}/><span className="sz-bento-caption"><MapPin size={14}/>{featured?.name}</span></Link>
        <div className="sz-stat" data-fx=""><small>Dự án trên hệ thống</small><strong><span className="fx-count">{projects.length}</span><sup>+</sup></strong><span>dự án đang mở bán & sắp mở bán</span></div>
        <div className="sz-stat" data-fx=""><small>Quỹ căn</small><strong><span className="fx-count">{units.length}</span><sup>+</sup></strong><span>căn trong bảng hàng</span></div>
        <div className="sz-stat" data-fx=""><small>Còn hàng</small><strong><span className="fx-count">{available}</span><sup>+</sup></strong><span>căn sẵn sàng tư vấn</span></div>
        <Link href={projects[1] ? projectPath(projects[1].id) : '/du-an'} className="sz-bento-small" data-fx="zoom"><Img src={projects[1]?.image} alt={projects[1]?.name}/></Link>
      </section>

      <section className="sz-section sz-services">
        <div className="sz-wrap">
          <div className="sz-center" data-fx=""><Eyebrow>{`Khám phá cùng ${brand}`}</Eyebrow><h2 className="sz-h2" data-fx="title">Mọi thông tin bạn cần<br/>để chọn đúng nơi an cư</h2></div>
          <div className="sz-service-grid">{services.map((s, i) => <Link key={s.title} href={s.href} className={'sz-service sz-notch-tr' + (i > 2 ? ' is-wide' : '')} data-fx="zoom">
            <div className="sz-service-text"><h3>{s.title}</h3><p>{s.body}</p></div><Img src={s.image} alt={s.title}/><span className="sz-notch-btn"><ArrowUpRight size={16}/></span></Link>)}</div>
          <p className="sz-services-note" data-fx="">Khám phá toàn bộ quỹ căn trên hệ thống. <Link href="/quy-hang">Xem bảng hàng</Link></p>
        </div>
      </section>

      <Showcase projects={showcase} units={units}/>

      <section className="sz-section sz-different sz-wrap">
        <div className="sz-different-photo sz-notch-tl" data-fx="left">
          <Img src={projects[3]?.image || featured?.image} alt=""/>
          <div className="sz-rating"><strong><span className="fx-count">{units.length}</span>+</strong><span className="sz-stars">{[0, 1, 2, 3, 4].map(i => <Star key={i} size={14} fill="currentColor"/>)}</span><small>căn hộ & nhà phố đang cập nhật</small></div>
        </div>
        <div data-fx="right">
          <Eyebrow>{`Vì sao chọn ${brand}`}</Eyebrow>
          <h2 className="sz-h2">Điều làm nên<br/>sự khác biệt</h2>
          <p className="sz-lead">{alphaHubContent.introduction}</p>
          <ul className="sz-features">{benefits.slice(0, 3).map((topic, i) => {const Icon = [TrendingUp, Users, Sparkles][i] || Star; return <li key={topic.id}><span className="sz-feature-icon"><Icon size={22}/></span><h3>{topic.title}</h3><p>{topic.body}</p></li>;})}</ul>
        </div>
      </section>

      <Quotes faq={about.faq} image={featured?.image}/>

      {developers.length > 0 && <section className="sz-partners">
        <p>Đồng hành cùng các chủ đầu tư uy tín</p>
        <div className="sz-partners-track">{[0, 1].map(copy => <span key={copy} aria-hidden={copy > 0 || undefined}>{[...developers, ...projects.slice(0, 6).map(p => p.name)].map((name, i) => <b key={i}>{name}</b>)}</span>)}</div>
      </section>}

      <section className="sz-section sz-team sz-wrap">
        <div className="sz-center" data-fx=""><Eyebrow>Dự án nổi bật</Eyebrow><h2 className="sz-h2" data-fx="title">Không gian sống<br/>đáng để chọn</h2></div>
        <div className="sz-team-grid">{team.map(p => <Link key={p.id} href={projectPath(p.id)} className="sz-member sz-notch-tr" data-fx="zoom">
          <Img src={p.image} alt={p.name}/><span className="sz-notch-btn is-mint"><ArrowUpRight size={16}/></span>
          <span className="sz-member-plate"><small>{p.developer}</small><strong>{p.name}</strong></span></Link>)}</div>
      </section>

      <section className="sz-enquiry">
        <div className="sz-enquiry-bg"><Img src={projects[4]?.image || featured?.image} alt=""/></div>
        <div className="sz-enquiry-card sz-wrap" data-fx="zoom">
          <div className="sz-center"><Eyebrow>Tư vấn nhanh</Eyebrow><h2 className="sz-h3">{lines(about.contactTitle)}</h2></div>
          <LeadForm projects={projects} note="Form tư vấn trang chủ" compact/>
        </div>
      </section>

      <section className="sz-section sz-news sz-wrap">
        <div className="sz-news-head"><div data-fx="left"><Eyebrow>Tin tức & kiến thức</Eyebrow><h2 className="sz-h2">{lines(about.newsTitle)}</h2></div><div data-fx="right"><ArrowButton href="/tin-tuc">Xem tất cả</ArrowButton></div></div>
        <div className="sz-post-grid">{posts.map(a => <PostCard key={a.id} title={a.title} image={a.image} category={a.category} date={vnDate(a.date)} href={`/tin-tuc/${a.id}`}/>)}</div>
      </section>
    </Sheet>
  </div>;
}

function PostCard({title, image, category, date, href, summary}: {title: string; image: string; category: string; date: string; href: string; summary?: string}) {
  return <Link href={href} className="sz-post" data-fx="zoom"><span className="sz-post-photo"><Img src={image} alt={title}/></span>
    <span className="sz-post-meta"><b>{category}</b><i/><time>{date}</time></span><strong>{title}</strong>{summary && <p>{summary}</p>}</Link>;
}

/** Dark sticky list: the left column follows whichever project photo is in view. */
function Showcase({projects, units}: {projects: Project[]; units: Unit[]}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(entries => entries.forEach(e => {if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));}), {rootMargin: '-45% 0px -45% 0px'});
    refs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [projects]);
  const current = projects[active];
  if (!projects.length) return null;
  return <section className="sz-showcase">
    <div className="sz-showcase-side"><div className="sz-showcase-sticky">
      <Eyebrow light>Dự án tiêu biểu</Eyebrow>
      <h2 className="sz-h2">Thiết kế ấn tượng,<br/>giá trị bền vững</h2>
      <div className="sz-showcase-current" key={current?.id}>
        <span className="sz-outline-num">{String(active + 1).padStart(2, '0')}</span>
        <div><span className="sz-showcase-loc"><MapPin size={15}/>{current?.location}</span><h3>{current?.name}</h3><span className="sz-showcase-meta">{current?.developer} · {units.filter(u => u.projectId === current?.id).length} căn · {current?.status}</span></div>
      </div>
      <ArrowButton href={current ? projectPath(current.id) : '/du-an'}>Xem dự án</ArrowButton>
    </div></div>
    <div className="sz-showcase-photos">{projects.map((p, i) => <Link key={p.id} href={projectPath(p.id)} data-index={i} ref={el => {refs.current[i] = el;}} className={i === active ? 'is-active' : ''} aria-label={p.name}><Img src={p.image} alt={p.name}/></Link>)}</div>
  </section>;
}

function Quotes({faq, image}: {faq: AboutContent['faq']; image?: string}) {
  const [index, setIndex] = useState(0);
  useEffect(() => {if (faq.length < 2) return; const t = setInterval(() => setIndex(i => (i + 1) % faq.length), 7000); return () => clearInterval(t);}, [faq.length]);
  if (!faq.length) return null;
  const item = faq[index % faq.length];
  return <section className="sz-quotes">
    <div className="sz-rotor" aria-hidden="true">
      <svg viewBox="0 0 200 200"><defs><path id="sz-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs><text><textPath href="#sz-circle">HỎI ĐÁP CÙNG ALPHA HUB · HỎI ĐÁP CÙNG ALPHA HUB · </textPath></text></svg>
      <span><Img src={image} alt=""/><MessageCircle size={26}/></span>
    </div>
    <div className="sz-wrap sz-quote-body">
      <button type="button" aria-label="Câu trước" onClick={() => setIndex(i => (i - 1 + faq.length) % faq.length)}><ChevronLeft size={18}/></button>
      <blockquote key={index}><p>“{item.question}”</p><footer>{item.answer}</footer></blockquote>
      <button type="button" aria-label="Câu tiếp theo" onClick={() => setIndex(i => (i + 1) % faq.length)}><ChevronRight size={18}/></button>
    </div>
  </section>;
}

/* ═══════════════════════════ Dự án ═══════════════════════════ */
export function SpaciazProjects({projects, units, favorites, onFavorite}: {projects: Project[]; units: Unit[]; favorites: Set<string>; onFavorite: (id: string) => void}) {
  const [status, setStatus] = useState(''), [type, setType] = useState(''), [region, setRegion] = useState(''), [developer, setDeveloper] = useState(''), [query, setQuery] = useState('');
  const [applied, setApplied] = useState({status: '', type: '', region: '', developer: '', query: ''});
  const options = (key: keyof Project) => Array.from(new Set(projects.map(p => String(p[key])).filter(Boolean))).sort();
  const norm = (s: string) => s.toLocaleLowerCase('vi').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const list = projects.filter(p => (!applied.status || p.status === applied.status) && (!applied.type || p.category === applied.type) && (!applied.region || p.region === applied.region) && (!applied.developer || p.developer === applied.developer) && (!applied.query || norm(`${p.name} ${p.location} ${p.developer}`).includes(norm(applied.query))));
  const count = (id: string) => units.filter(u => u.projectId === id).length;
  return <div className="sz">
    <Banner title="Dự án" aside="Danh mục dự án Vinhomes, Masterise và các chủ đầu tư uy tín: vị trí, quỹ căn, mặt bằng và trải nghiệm 360°."/>
    <Sheet>
      <section className="sz-wrap sz-listing">
        <form className="sz-filter" onSubmit={e => {e.preventDefault(); setApplied({status, type, region, developer, query});}} data-fx="">
          <label className="sz-filter-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tên dự án, địa điểm…" aria-label="Tìm dự án"/></label>
          <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Trạng thái"><option value="">Trạng thái</option>{options('status').map(v => <option key={v}>{v}</option>)}</select>
          <select value={type} onChange={e => setType(e.target.value)} aria-label="Loại hình"><option value="">Loại hình</option><option value="low">Thấp tầng</option><option value="high">Cao tầng</option></select>
          <select value={region} onChange={e => setRegion(e.target.value)} aria-label="Khu vực"><option value="">Khu vực</option>{options('region').map(v => <option key={v}>{v}</option>)}</select>
          <select value={developer} onChange={e => setDeveloper(e.target.value)} aria-label="Chủ đầu tư"><option value="">Chủ đầu tư</option>{options('developer').map(v => <option key={v}>{v}</option>)}</select>
          <button className="sz-pill-btn">Tìm kiếm</button>
        </form>
        <p className="sz-result">Hiển thị <b>{list.length}</b> / {projects.length} dự án{(applied.status || applied.type || applied.region || applied.developer || applied.query) && <button type="button" onClick={() => {setStatus(''); setType(''); setRegion(''); setDeveloper(''); setQuery(''); setApplied({status: '', type: '', region: '', developer: '', query: ''});}}>Xóa bộ lọc</button>}</p>
        <div className="sz-project-grid">{list.map(p => <article key={p.id} className="sz-project" data-fx="zoom">
          <Link href={projectPath(p.id)} className="sz-project-link" aria-label={p.name}><Img src={p.image} alt={p.name}/></Link>
          <span className="sz-status">{p.status}</span>
          <button type="button" className={'sz-heart' + (favorites.has(p.id) ? ' is-on' : '')} aria-label={`Yêu thích ${p.name}`} aria-pressed={favorites.has(p.id)} onClick={() => onFavorite(p.id)}><Heart size={16} fill={favorites.has(p.id) ? 'currentColor' : 'none'}/></button>
          <div className="sz-project-text"><span><MapPin size={14}/>{p.location}<em>{count(p.id)} căn</em></span><h3><Link href={projectPath(p.id)}>{p.name}</Link></h3></div>
        </article>)}</div>
        {!list.length && <div className="sz-empty"><Search size={28}/><h3>Không tìm thấy dự án phù hợp</h3><p>Thử bỏ bớt điều kiện lọc.</p></div>}
      </section>
    </Sheet>
  </div>;
}

/* ═══════════════════════════ Giới thiệu ═══════════════════════════ */
export function SpaciazAbout({about, brand, projects, units, contact}: {about: AboutContent; brand: string; projects: Project[]; units: Unit[]; contact: PublicContact}) {
  const featured = projects.find(p => p.id === about.featuredProjectId) || projects[0];
  const [open, setOpen] = useState(0);
  const steps = [
    {year: '01', title: 'Trải nghiệm dự án 360°', body: 'Khám phá phối cảnh, mặt bằng và vị trí căn bạn quan tâm.', href: projectPath(about.featuredProjectId, 'vr'), image: featured?.image},
    {year: '02', title: 'Tìm quỹ căn phù hợp', body: 'Tra cứu mã căn, phân khu, diện tích và ngân sách.', href: '/quy-hang', image: projects[1]?.image},
    {year: '03', title: 'Kết nối tư vấn', body: 'Trao đổi nhu cầu và xác nhận thông tin cùng đội ngũ tư vấn.', href: '/lien-he', image: projects[2]?.image},
  ];
  const learn = [platform[1], platform[2], platform[3]].filter(Boolean);
  return <div className="sz">
    <Banner title="Giới thiệu" aside={about.introduction || alphaHubContent.introduction}/>
    <Sheet>
      <section className="sz-section sz-about-intro sz-wrap">
        <div data-fx="left"><Eyebrow>{`Về ${brand}`}</Eyebrow><h2 className="sz-h2">{lines(about.platformTitle)}</h2></div>
        <div data-fx="right"><p className="sz-lead-strong">{about.platformBody}</p><p className="sz-lead">{alphaHubContent.title}. {platform[0]?.body}</p><ArrowButton href="/lien-he">Liên hệ tư vấn</ArrowButton></div>
      </section>
      <section className="sz-about-visual sz-wrap" data-fx="zoom">
        <div className="sz-about-photo sz-notch-tl"><Img src={featured?.image} alt={featured?.name}/></div>
        <div className="sz-about-stats">
          <div className="sz-stat is-solid"><Building2 size={30}/><strong><span className="fx-count">{projects.length}</span><sup>+</sup></strong><span>dự án trên hệ thống</span></div>
          <div className="sz-stat is-solid"><House size={30}/><strong><span className="fx-count">{units.length}</span><sup>+</sup></strong><span>căn trong quỹ căn</span></div>
          <div className="sz-stat is-solid"><MapIcon size={30}/><strong>{about.featuredScale}</strong><span>quy mô {featured?.name}</span></div>
        </div>
      </section>
      <section className="sz-section sz-journey">
        <div className="sz-wrap">
          <div data-fx=""><Eyebrow>Hành trình</Eyebrow><h2 className="sz-h2">{lines(about.journeyTitle)}</h2></div>
          <div className="sz-timeline">{steps.map(s => <Link key={s.year} href={s.href} className="sz-milestone" data-fx="">
            <span className="sz-milestone-year">{s.year}</span><span className="sz-milestone-photo"><Img src={s.image} alt=""/></span><i/><h3>{s.title}</h3><p>{s.body}</p></Link>)}</div>
          <Link href="/lien-he" className="sz-round-cta" data-fx="zoom">Nhận<br/>tư vấn</Link>
        </div>
      </section>
      <section className="sz-section sz-learn sz-wrap">
        <div data-fx=""><Eyebrow>Khám phá</Eyebrow><h2 className="sz-h2">Tìm hiểu thêm<br/>về {brand}</h2></div>
        <div className="sz-learn-grid">{learn.map((t, i) => <Link key={t.id} href={t.href} className={'sz-learn-card sz-notch-br is-' + i} data-fx="zoom">
          {i === 2 && <Img src={projects[3]?.image} alt=""/>}{i === 1 && <Img className="sz-learn-art" src={projects[4]?.image} alt=""/>}
          <small>0{i + 1}.</small><div><h3>{t.title}</h3><p>{clip(t.body, 130)}</p><u>{t.action}</u></div><span className="sz-notch-btn is-mint"><ArrowUpRight size={16}/></span></Link>)}</div>
      </section>
      <section className="sz-section sz-faq sz-wrap">
        <div data-fx="left"><Eyebrow>Hỏi đáp</Eyebrow><h2 className="sz-h2">Câu hỏi<br/>thường gặp</h2><p className="sz-lead">{about.contactBody}</p>
          <div className="sz-contact-mini"><a href={`tel:${contact.phone}`}><Phone size={18}/>{contact.phone}</a><a href={contact.zaloHref} target="_blank" rel="noreferrer"><MessageCircle size={18}/>Chat Zalo</a></div></div>
        <div className="sz-accordion" data-fx="right">{about.faq.map((f, i) => <div key={i} className={'sz-acc' + (open === i ? ' is-open' : '')}>
          <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}><span>{f.question}</span><Plus size={18}/></button><div><p>{f.answer}</p></div></div>)}</div>
      </section>
    </Sheet>
  </div>;
}

/* ═══════════════════════════ Tin tức ═══════════════════════════ */
type Story = {id: string; title: string; summary: string; image: string; category: string; date: string; sort: string; href: string; article?: Article};
const PROJECT_NEWS = 'Tin dự án';

export function SpaciazBlog({articles, projects, routeId, canEdit, onCreate, onEdit}: {articles: Article[]; projects: Project[]; routeId?: string; canEdit: boolean; onCreate: () => void; onEdit: (a: Article) => void}) {
  const [category, setCategory] = useState('all'), [query, setQuery] = useState(''), [limit, setLimit] = useState(6);
  const stories = useMemo<Story[]>(() => [
    ...articles.map(a => ({id: a.id, title: a.title, summary: clip(a.body, 170), image: a.image, category: a.category, date: vnDate(a.date), sort: a.date, href: `/tin-tuc/${a.id}`, article: a})),
    ...projects.map(p => ({id: 'p-' + p.id, title: `${p.name}: ${p.status.toLocaleLowerCase('vi')} tại ${p.location}`, summary: projectSummary(p), image: p.image, category: PROJECT_NEWS, date: p.location, sort: '0', href: projectPath(p.id)})),
  ].sort((a, b) => b.sort.localeCompare(a.sort)), [articles, projects]);
  const categories = Array.from(new Set(stories.map(s => s.category)));
  const opened = routeId ? articles.find(a => a.id === decodeURIComponent(routeId)) : undefined;
  const norm = (s: string) => s.toLocaleLowerCase('vi');
  const list = stories.filter(s => (category === 'all' || s.category === category) && (!query.trim() || norm(s.title + ' ' + s.summary).includes(norm(query.trim()))));
  const recent = stories.filter(s => s.article).slice(0, 4);
  const sidebar = <aside className="sz-blog-side">
    <div><h3>Tìm kiếm</h3><label className="sz-side-search"><input value={query} onChange={e => {setQuery(e.target.value); setLimit(6);}} placeholder="Tìm bài viết…" aria-label="Tìm bài viết"/><Search size={16}/></label></div>
    <div><h3>Chuyên mục</h3><ul className="sz-side-cats">{categories.map(c => <li key={c}><button type="button" onClick={() => {setCategory(c); setLimit(6);}} className={category === c ? 'is-on' : ''}>{c}<span>{stories.filter(s => s.category === c).length}</span></button></li>)}</ul></div>
    <div><h3>Bài viết mới</h3><ul className="sz-side-recent">{recent.map(s => <li key={s.id}><Link href={s.href}><Img src={s.image} alt=""/><span>{s.title}</span></Link></li>)}</ul></div>
    <div className="sz-side-cta"><h3>Cần tư vấn dự án?</h3><p>Để lại thông tin, đội ngũ Alpha Hub sẽ liên hệ trong thời gian sớm nhất.</p><ArrowButton href="/lien-he">Liên hệ ngay</ArrowButton></div>
  </aside>;
  if (routeId) return <div className="sz">
    <Banner title="Tin tức" crumb={opened ? clip(opened.title, 60) : 'Không tìm thấy'}/>
    <Sheet><section className="sz-wrap sz-blog">
      <article className="sz-article">{opened ? <>
        <div className="sz-post-meta"><b>{opened.category}</b><i/><time>{vnDate(opened.date)}</time></div>
        <h1>{opened.title}</h1>
        {canEdit && <button type="button" className="sz-edit" onClick={() => onEdit(opened)}><Pencil size={15}/>Chỉnh sửa bài viết</button>}
        <div className="sz-article-cover"><Img src={opened.image} alt={opened.title}/></div>
        <div className="sz-article-body">{opened.body.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>
        <Link href="/tin-tuc" className="sz-back"><ChevronLeft size={16}/>Về trang tin tức</Link>
      </> : <><h1>Không tìm thấy bài viết</h1><p>Bài viết này không còn trên website.</p><ArrowButton href="/tin-tuc">Về trang tin tức</ArrowButton></>}</article>
      {sidebar}
    </section></Sheet>
  </div>;
  return <div className="sz">
    <Banner title="Tin tức" aside="Tin dự án, hướng dẫn tra cứu quỹ căn và kiến thức bất động sản từ Alpha Hub."/>
    <Sheet><section className="sz-wrap">
      <div className="sz-cat-pills" data-fx=""><button type="button" className={category === 'all' ? 'is-on' : ''} onClick={() => setCategory('all')}>Tất cả</button>{categories.map(c => <button type="button" key={c} className={category === c ? 'is-on' : ''} onClick={() => {setCategory(c); setLimit(6);}}>{c}</button>)}
        {canEdit && <button type="button" className="sz-edit" onClick={onCreate}><Plus size={15}/>Thêm bài viết</button>}</div>
      <div className="sz-blog">
        <div className="sz-blog-list">{list.slice(0, limit).map(s => <article key={s.id} className="sz-blog-item" data-fx="">
          <Link href={s.href} className="sz-blog-photo"><Img src={s.image} alt={s.title}/></Link>
          <div className="sz-post-meta"><b>{s.category}</b><i/><time>{s.date}</time></div>
          <h2><Link href={s.href}>{s.title}</Link></h2><p>{s.summary}</p>
          {canEdit && s.article && <button type="button" className="sz-edit" onClick={() => onEdit(s.article!)}><Pencil size={14}/>Chỉnh sửa</button>}
        </article>)}
          {!list.length && <div className="sz-empty"><Search size={28}/><h3>Không có bài viết phù hợp</h3></div>}
          {list.length > limit && <button type="button" className="sz-pill-btn sz-more" onClick={() => setLimit(limit + 6)}>Xem thêm bài viết</button>}
        </div>
        {sidebar}
      </div>
    </section></Sheet>
  </div>;
}

/* ═══════════════════════════ Liên hệ ═══════════════════════════ */
export function SpaciazContact({projects, contact, address}: {projects: Project[]; contact: PublicContact; address: string}) {
  return <div className="sz">
    <Banner title="Liên hệ" aside="Đội ngũ tư vấn Alpha Hub luôn sẵn sàng đồng hành cùng bạn trong hành trình tìm kiếm không gian sống."/>
    <Sheet>
      <section className="sz-wrap sz-contact-cards">
        <div className="sz-contact-card" data-fx=""><Mail size={24}/><h3>Email hỗ trợ</h3><p>{contact.email}</p><a className="sz-pill-btn" href={`mailto:${contact.email}`}>Gửi email</a></div>
        <div className="sz-contact-card" data-fx=""><Phone size={24}/><h3>Hotline / Zalo</h3><p>{contact.phone}</p><a className="sz-pill-btn" href={`tel:${contact.phone}`}>Gọi ngay</a></div>
        <div className="sz-contact-card" data-fx=""><MessageCircle size={24}/><h3>Kết nối nhanh</h3><p>{address || 'Nhắn Zalo hoặc Facebook để được hỗ trợ'}</p><a className="sz-pill-btn" href={contact.zaloHref} target="_blank" rel="noreferrer">Chat Zalo</a></div>
      </section>
      <section className="sz-section sz-wrap sz-message">
        <div data-fx="left"><h2 className="sz-h2">Để lại lời nhắn</h2><p className="sz-lead">Chia sẻ dự án và nhu cầu của bạn — chúng tôi sẽ gửi thông tin quỹ căn, bảng giá và lịch tham quan phù hợp.</p><LeadForm projects={projects} note="Trang liên hệ"/></div>
        <div className="sz-message-photo sz-notch-tl" data-fx="right"><Img src={projects[0]?.image} alt=""/><a href={contact.facebookHref} target="_blank" rel="noreferrer" className="sz-round-cta">Theo dõi<br/>Facebook</a></div>
      </section>
    </Sheet>
  </div>;
}

/* ═══════════════════════════ Footer ═══════════════════════════ */
export function SpaciazFooter({brand, contact, logo, address}: {brand: string; contact: PublicContact; logo: string; address: string}) {
  return <footer className="sz-footer">
    <div className="sz-footer-cta">
      <span className="sz-footer-ghost" aria-hidden="true">{brand}</span>
      <h2 data-fx="title">Ngôi nhà mơ ước<br/>đang chờ bạn</h2>
      <p data-fx="">Dù bạn đang tìm hiểu dự án hay đã có căn hộ trong tâm trí, Alpha Hub sẵn sàng đồng hành để hiện thực hóa điều đó.</p>
      <Link href="/lien-he" className="sz-round-cta is-dark" data-fx="zoom">Nhận<br/>tư vấn</Link>
    </div>
    <div className="sz-footer-card">
      <div className="sz-footer-grid">
        <div className="sz-footer-brand"><Link href="/"><img src={logo} alt={brand}/></Link><p>Không gian kết nối dự án, quỹ căn và những cơ hội mới.</p></div>
        <nav aria-label="Liên kết chân trang"><Link href="/gioi-thieu">Giới thiệu</Link><Link href="/du-an">Dự án</Link><Link href="/quy-hang">Quỹ căn</Link><Link href="/alphahub">AlphaHub</Link><Link href="/yeu-thich">Yêu thích</Link></nav>
        <nav aria-label="Hỗ trợ"><Link href="/tin-tuc">Tin tức</Link><Link href="/huong-dan">Hướng dẫn</Link><Link href="/lien-he">Liên hệ</Link><Link href="/dang-nhap">Đăng nhập</Link></nav>
        <div className="sz-footer-contact"><a href={`tel:${contact.phone}`}>{contact.phone}</a><a href={`mailto:${contact.email}`}>{contact.email}</a>{address && <p>{address}</p>}
          <div className="sz-socials"><a href={contact.zaloHref} target="_blank" rel="noreferrer">Zalo</a><i/><a href={contact.facebookHref} target="_blank" rel="noreferrer">Facebook</a></div></div>
      </div>
      <div className="sz-footer-bottom"><span>© {new Date().getFullYear()} <b>{brand}</b>. Không liên kết với VHub.</span><span>Thông tin và giá bán mẫu chỉ dùng để trải nghiệm.</span></div>
    </div>
  </footer>;
}

/* ═══════════════════════════ Chi tiết dự án ═══════════════════════════ */
type DetailProps = {project: Project; projects: Project[]; units: Unit[]; assets: Asset[]; contact: PublicContact; statusOf: (u: Unit) => string; favorites: Set<string>; onFavorite: (id: string) => void; onSelectUnit: (u: Unit) => void};
const num = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});
const range = (values: number[], unit: string) => {const v = values.filter(x => x > 0); if (!v.length) return 'Đang cập nhật'; const lo = Math.min(...v), hi = Math.max(...v); return lo === hi ? `${num(lo)} ${unit}` : `${num(lo)} – ${num(hi)} ${unit}`;};

/** Spaciaz single-project page; every block links into the project's interactive tabs. */
export function SpaciazProjectDetail({project, projects, units, assets, contact, statusOf, favorites, onFavorite, onSelectUnit}: DetailProps) {
  const own = units.filter(u => u.projectId === project.id);
  const available = own.filter(u => statusOf(u) === 'Còn hàng');
  const kinds = (k: string) => assets.filter(a => a.kind === k);
  const gallery = kinds('gallery'), plans = kinds('plan'), panos = kinds('panorama'), models = kinds('model'), amenities = kinds('amenity'), docs = kinds('document');
  const cover = gallery[0]?.url || project.image;
  const zones = Array.from(new Set(own.map(u => u.zone).filter(Boolean)));
  const types = Array.from(new Set(own.map(u => u.type).filter(Boolean)));
  const media = [
    {id: 'gallery', label: 'Hình ảnh', icon: Building2, items: gallery.length ? gallery : [{id: 'cover', projectId: project.id, kind: 'gallery', name: project.name, url: project.image}], tab: 'gallery'},
    {id: 'plan', label: 'Mặt bằng', icon: MapIcon, items: plans, tab: 'plan'},
    {id: 'vr', label: '360°', icon: Globe, items: panos, tab: 'vr'},
    {id: 'model', label: 'Nhà mẫu', icon: House, items: models, tab: 'model'},
    {id: 'amenity', label: 'Tiện ích', icon: Sparkles, items: amenities, tab: 'amenity'},
  ].filter(m => m.items.length);
  const [tab, setTab] = useState(media[0]?.id || 'gallery');
  const [slide, setSlide] = useState(0);
  const current = media.find(m => m.id === tab) || media[0];
  const slides = current?.items || [];
  const experiences = [
    {tab: 'vr', title: 'Quỹ căn 360°', body: 'Bản đồ phối cảnh, mặt bằng và vị trí từng căn.', icon: Globe, count: `${own.length} căn`},
    {tab: 'plan', title: 'Mặt bằng', body: 'Mặt bằng dự án với mã căn được ghim theo loại quỹ.', icon: MapIcon, count: `${plans.length} bản vẽ`},
    {tab: 'inventory', title: 'Bảng hàng', body: 'Giá, diện tích, hướng và trạng thái từng căn.', icon: Layers, count: `${available.length} còn hàng`},
    {tab: 'zones', title: 'Phân khu', body: 'Tra cứu sản phẩm theo từng phân khu của dự án.', icon: Building2, count: `${zones.length} phân khu`},
    {tab: 'model', title: 'Nhà mẫu', body: 'Hình ảnh nhà mẫu và không gian nội thất.', icon: House, count: `${models.length} ảnh`},
    {tab: 'amenity', title: 'Tiện ích', body: 'Hệ thống tiện ích nội khu và kết nối vùng.', icon: Sparkles, count: `${amenities.length} ảnh`},
    {tab: 'gallery', title: 'Thư viện', body: 'Phối cảnh tổng thể và hình ảnh thực tế.', icon: Star, count: `${gallery.length} ảnh`},
    {tab: 'document', title: 'Tài liệu', body: 'Bảng giá, chính sách bán hàng và tài liệu dự án.', icon: ShieldCheck, count: `${docs.length} tài liệu`},
  ];
  const related = projects.filter(p => p.id !== project.id).sort((a, b) => Number(b.region === project.region) - Number(a.region === project.region) || Number(b.category === project.category) - Number(a.category === project.category)).slice(0, 3);
  const mapQuery = encodeURIComponent(`${project.name} ${project.location}`);
  const facts = [
    {icon: Layers, label: 'Trạng thái', value: project.status},
    {icon: Building2, label: 'Loại hình', value: project.category === 'high' ? 'Cao tầng' : 'Thấp tầng'},
    {icon: House, label: 'Quỹ căn', value: `${own.length} căn · ${available.length} còn hàng`},
    {icon: MapIcon, label: 'Diện tích', value: range(own.map(u => u.area), 'm²')},
    {icon: TrendingUp, label: 'Khoảng giá', value: range(own.map(u => u.price), 'tỷ')},
  ];
  const featuredUnits = (available.length ? available : own).slice(0, 6);
  const description = placeholderNote.test(project.description) || !project.description.trim() ? projectSummary(project) : project.description;
  return <div className="sz sz-detail">
    <section className="sz-banner sz-detail-banner">
      <Img className="sz-detail-banner-img" src={project.image} alt=""/>
      <div className="sz-wrap"><nav className="sz-crumbs" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><i/><Link href="/du-an">Dự án</Link><i/><span>{project.name}</span></nav></div>
    </section>
    <Sheet>
      <section className="sz-wrap sz-detail-head">
        <span className="sz-detail-loc" data-fx=""><MapPin size={16}/>{project.location}</span>
        <div className="sz-detail-title" data-fx="">
          <h1>{project.name}</h1>
          <div className="sz-detail-actions">
            <button type="button" className={'sz-heart' + (favorites.has(project.id) ? ' is-on' : '')} aria-pressed={favorites.has(project.id)} aria-label="Lưu dự án" onClick={() => onFavorite(project.id)}><Heart size={18} fill={favorites.has(project.id) ? 'currentColor' : 'none'}/></button>
            <ArrowButton href={projectPath(project.id, 'vr')}>Quỹ căn 360°</ArrowButton>
          </div>
        </div>
        <dl className="sz-facts">{facts.map(f => <div key={f.label} data-fx=""><span><f.icon size={18}/></span><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
      </section>

      <section className="sz-wrap"><Link href={projectPath(project.id, 'gallery')} className="sz-detail-cover" data-fx="zoom"><Img src={cover} alt={project.name}/></Link></section>

      <section className="sz-wrap sz-section sz-detail-about">
        <div data-fx="left"><h2 className="sz-h3">Giới thiệu dự án</h2><div className="sz-detail-text">{description.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div></div>
        <div className="sz-key" data-fx="right"><h3>Thông tin chính</h3><ul>
          <li><b>Vị trí:</b> {project.location}</li>
          <li><b>Khu vực:</b> {project.region}</li>
          <li><b>Chủ đầu tư:</b> {project.developer}</li>
          {types.length > 0 && <li><b>Sản phẩm:</b> {types.slice(0, 6).join(', ')}</li>}
          {zones.length > 0 && <li><b>Phân khu:</b> {zones.slice(0, 6).join(', ')}{zones.length > 6 ? '…' : ''}</li>}
          <li><b>Diện tích:</b> {range(own.map(u => u.area), 'm²')}</li>
          <li><b>Giá tham khảo:</b> {range(own.map(u => u.price), 'tỷ')}</li>
        </ul></div>
      </section>

      <section className="sz-wrap sz-detail-block">
        <h2 className="sz-h3" data-fx="">Trải nghiệm dự án</h2>
        <div className="sz-exp-grid">{experiences.map(e => <Link key={e.tab} href={projectPath(project.id, e.tab)} className="sz-exp" data-fx="zoom">
          <span className="sz-exp-icon"><e.icon size={26}/></span><h3>{e.title}</h3><p>{e.body}</p><small>{e.count}</small></Link>)}</div>
      </section>

      {current && <section className="sz-detail-block sz-media">
        <div className="sz-wrap sz-media-head"><h2 className="sz-h3" data-fx="">Hình ảnh & mặt bằng</h2>
          <div className="sz-media-tabs" role="tablist">{media.map(m => <button key={m.id} type="button" role="tab" aria-selected={m.id === tab} className={m.id === tab ? 'is-on' : ''} onClick={() => {setTab(m.id); setSlide(0);}}><m.icon size={16}/>{m.label}</button>)}</div></div>
        <div className="sz-media-stage">
          {slides.length > 1 && <button type="button" className="sz-media-nav is-prev" aria-label="Ảnh trước" onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}><ChevronLeft size={20}/></button>}
          <div className="sz-media-track" style={{['--i' as string]: slide}}>{slides.map((a, i) => <Link key={a.id} href={projectPath(project.id, current.tab)} className={'sz-media-slide' + (i === slide ? ' is-on' : '')} onClick={e => {if (i !== slide) {e.preventDefault(); setSlide(i);}}}><Img src={a.url} alt={a.name}/></Link>)}</div>
          {slides.length > 1 && <button type="button" className="sz-media-nav is-next" aria-label="Ảnh tiếp" onClick={() => setSlide((slide + 1) % slides.length)}><ChevronRight size={20}/></button>}
        </div>
        <p className="sz-media-caption">{slides[slide]?.name} · <Link href={projectPath(project.id, current.tab)}>Mở {current.label.toLocaleLowerCase('vi')} toàn màn hình</Link></p>
      </section>}

      {featuredUnits.length > 0 && <section className="sz-wrap sz-detail-block">
        <div className="sz-news-head"><h2 className="sz-h3" data-fx="left">Quỹ căn nổi bật</h2><div data-fx="right"><ArrowButton href={projectPath(project.id, 'inventory')}>Xem bảng hàng</ArrowButton></div></div>
        <div className="sz-unit-grid">{featuredUnits.map(u => <button type="button" key={u.id} className="sz-unit" onClick={() => onSelectUnit(u)} data-fx="zoom">
          <span className="sz-unit-top"><strong>{u.code}</strong><em className={statusOf(u) === 'Còn hàng' ? 'is-free' : ''}>{statusOf(u)}</em></span>
          <span className="sz-unit-type">{u.type || 'Sản phẩm'}{u.zone ? ` · ${u.zone}` : ''}</span>
          <span className="sz-unit-specs"><span><small>Diện tích</small>{u.area ? `${num(u.area)} m²` : '—'}</span><span><small>Hướng</small>{u.direction || '—'}</span></span>
          <span className="sz-unit-price"><span>{u.price ? <>{num(u.price)} <small>tỷ</small></> : 'Liên hệ'}</span><i><ArrowUpRight size={16}/></i></span>
        </button>)}</div>
      </section>}

      <section className="sz-wrap sz-detail-block sz-location">
        <h2 className="sz-h3" data-fx="">Vị trí</h2>
        <div className="sz-location-grid">
          <div className="sz-location-card" data-fx="left">
            <small>Địa chỉ</small>
            <div className="sz-location-addr"><h3>{project.location}</h3><ArrowButton href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} tone="white" external>Chỉ đường</ArrowButton></div>
            <h4>Thông tin kết nối</h4>
            <dl><div><dt>Khu vực</dt><dd>{project.region}</dd></div><div><dt>Chủ đầu tư</dt><dd>{project.developer}</dd></div><div><dt>Phân khu</dt><dd>{zones.length || '—'}</dd></div><div><dt>Hotline</dt><dd><a href={`tel:${contact.phone}`}>{contact.phone}</a></dd></div></dl>
            <Link href={projectPath(project.id, 'location')} className="sz-text-link">Xem vị trí trong không gian dự án <ArrowUpRight size={15}/></Link>
          </div>
          <div className="sz-map" data-fx="right"><iframe title={`Bản đồ ${project.name}`} src={`https://www.google.com/maps?q=${mapQuery}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/></div>
        </div>
      </section>

      <section className="sz-enquiry">
        <div className="sz-enquiry-bg"><Img src={project.image} alt=""/></div>
        <div className="sz-enquiry-card sz-wrap" data-fx="zoom">
          <div className="sz-center"><Eyebrow>Tư vấn dự án</Eyebrow><h2 className="sz-h3">Nhận bảng giá & lịch tham quan<br/>{project.name}</h2></div>
          <LeadForm projects={[project, ...projects.filter(p => p.id !== project.id)]} note={`Tư vấn dự án ${project.name}`} compact/>
        </div>
      </section>

      {related.length > 0 && <section className="sz-wrap sz-section sz-related">
        <div className="sz-news-head"><h2 className="sz-h3" data-fx="left">Dự án liên quan</h2><div data-fx="right"><ArrowButton href="/du-an">Tất cả dự án</ArrowButton></div></div>
        <div className="sz-project-grid">{related.map(p => <article key={p.id} className="sz-project" data-fx="zoom">
          <Link href={projectPath(p.id)} className="sz-project-link" aria-label={p.name}><Img src={p.image} alt={p.name}/></Link>
          <span className="sz-status">{p.status}</span>
          <div className="sz-project-text"><span><MapPin size={14}/>{p.location}<em>{units.filter(u => u.projectId === p.id).length} căn</em></span><h3><Link href={projectPath(p.id)}>{p.name}</Link></h3></div>
        </article>)}</div>
      </section>}
    </Sheet>
  </div>;
}
