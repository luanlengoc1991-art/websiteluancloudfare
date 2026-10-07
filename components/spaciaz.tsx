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
import {sized} from '@/lib/img';

const lines = (text: string) => text.split('\n').map((line, i, all) => <span key={i}>{line}{i < all.length - 1 && <br/>}</span>);
const vnDate = (iso: string) => {const [y, m, d] = iso.split('-'); return y && m && d ? `${d}/${m}/${y}` : iso;};
const clip = (text: string, size = 150) => {const plain = text.replace(/\s+/g, ' ').trim(); return plain.length > size ? plain.slice(0, size - 1).trimEnd() + '…' : plain;};
const placeholderNote = /^(Dự án tham khảo|Bảng hàng tham khảo)/;
const projectSummary = (p: Project) => placeholderNote.test(p.description) || !p.description.trim()
  ? `${p.category === 'high' ? 'Dự án căn hộ cao tầng' : 'Khu đô thị thấp tầng'} của ${p.developer} tại ${p.location}. Xem quỹ căn 360°, vị trí, mặt bằng, tiện ích và bảng hàng tham khảo.`
  : clip(p.description, 180);
const platform = alphaHubContent.topics.filter(t => t.group === 'platform');
const benefits = alphaHubContent.topics.filter(t => t.group === 'benefits');

/** Slides keep only the current, previous and next photo in the page. */
const near = (i: number, active: number, n: number) => {const d = ((i - active) % n + n) % n; return d === 0 || d === 1 || d === n - 1;};
function Img({src, alt = '', className, w = 900, eager = false}: {src?: string; alt?: string; className?: string; w?: number; eager?: boolean}) {
  const [broken, setBroken] = useState(false);
  return src && !broken ? <img className={className} src={sized(src, w)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setBroken(true)}/> : <span className={'sz-img-fallback ' + (className || '')}><Building2 size={32}/></span>;
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
        <Link href={featured ? projectPath(featured.id) : '/du-an'} className="sz-bento-photo sz-notch-tl" data-fx="zoom"><Img w={1400} src={featured?.image} alt={featured?.name}/><span className="sz-bento-caption"><MapPin size={14}/>{featured?.name}</span></Link>
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
          <Img w={1200} src={projects[3]?.image || featured?.image} alt=""/>
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
        <div className="sz-enquiry-bg"><Img w={1920} src={projects[4]?.image || featured?.image} alt=""/></div>
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
    <div className="sz-showcase-photos">{projects.map((p, i) => <Link key={p.id} href={projectPath(p.id)} data-index={i} ref={el => {refs.current[i] = el;}} className={i === active ? 'is-active' : ''} aria-label={p.name}><Img w={1400} src={p.image} alt={p.name}/></Link>)}</div>
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
      <span><Img w={240} src={image} alt=""/><MessageCircle size={26}/></span>
    </div>
    <div className="sz-wrap sz-quote-body">
      <button type="button" aria-label="Câu trước" onClick={() => setIndex(i => (i - 1 + faq.length) % faq.length)}><ChevronLeft size={18}/></button>
      <blockquote key={index}><p>“{item.question}”</p><footer>{item.answer}</footer></blockquote>
      <button type="button" aria-label="Câu tiếp theo" onClick={() => setIndex(i => (i + 1) % faq.length)}><ChevronRight size={18}/></button>
    </div>
  </section>;
}

/* ═══════════════════════════ Dự án ═══════════════════════════ */
/** Full-height hero: project photos crossfade with a slow zoom; glass cards jump between them. */
function ProjectsHero({projects, units}: {projects: Project[]; units: Unit[]}) {
  const slides = useMemo(() => [...projects].sort((a, b) => Number(b.hot) - Number(a.hot)).slice(0, 6), [projects]);
  const [index, setIndex] = useState(0);
  useEffect(() => {if (slides.length < 2) return; const t = setInterval(() => setIndex(i => (i + 1) % slides.length), 6500); return () => clearInterval(t);}, [slides.length, index]);
  const current = slides[index];
  const available = units.length;
  return <section className="sz-hero sz-phero">
    <div className="sz-phero-slides" aria-hidden="true">{slides.map((p, i) => <div key={p.id} className={'sz-phero-slide' + (i === index ? ' is-on' : '')}>{near(i, index, slides.length) && <Img w={1920} eager={i === index} src={p.image} alt=""/>}</div>)}</div>
    <div className="sz-wrap">
      <div className="sz-hero-copy">
        <h1 data-fx="title">Dự án nổi bật<br/>trên Alpha Hub</h1>
        <p data-fx="">{projects.length} dự án Vinhomes, Masterise và các chủ đầu tư uy tín · {available} căn trong bảng hàng, cập nhật vị trí, mặt bằng và trải nghiệm 360°.</p>
      </div>
      <div className="sz-hero-row">
        <div className="sz-phero-current" key={current?.id}>
          <span className="sz-outline-num">{String(index + 1).padStart(2, '0')}</span>
          <div><span className="sz-showcase-loc"><MapPin size={15}/>{current?.location}</span><p className="sz-hero-statement">{current?.name}</p></div>
        </div>
        <div className="sz-phero-actions" data-fx="right">
          <div className="sz-phero-dots">{slides.map((p, i) => <button key={p.id} type="button" aria-label={p.name} className={i === index ? 'is-on' : ''} onClick={() => setIndex(i)}><i/></button>)}</div>
          <ArrowButton href={current ? projectPath(current.id) : '/du-an'} tone="white">Khám phá dự án</ArrowButton>
        </div>
      </div>
      <div className="sz-hero-cards">{slides.slice(0, 3).map(p => <Link key={p.id} href={projectPath(p.id)} className="sz-glass sz-phero-card" data-fx="">
        <span className="sz-phero-thumb"><Img w={240} src={p.image} alt=""/></span>
        <div><small>{p.developer} · {p.category === 'high' ? 'Cao tầng' : 'Thấp tầng'}</small><h3>{p.name}</h3><p><MapPin size={13}/> {p.location} · {units.filter(u => u.projectId === p.id).length} căn</p></div>
        <ArrowUpRight size={20}/></Link>)}</div>
    </div>
  </section>;
}

/** /du-an: readable 3D deck. Details sit flat on the left; a tilted stack of project photos on the right
 *  deals the front card away to reveal the next. Light white/mint band. */
function ProjectRing({projects, units, regions, favorites, onFavorite, onList}: {projects: Project[]; units: Unit[]; regions: string[]; favorites: Set<string>; onFavorite: (id: string) => void; onList: (patch: Partial<typeof blank>) => void}) {
  const [group, setGroup] = useState('all');
  const list = useMemo(() => projects.filter(p => group === 'all' || (group === 'low' || group === 'high' ? p.category === group : p.region === group)), [projects, group]);
  const [active, setActive] = useState(0);
  const touch = useRef<number | null>(null);
  const n = list.length;
  const go = (to: number) => n && setActive(((to % n) + n) % n);
  useEffect(() => {setActive(0);}, [group]);
  useEffect(() => {if (n < 2) return; const t = setTimeout(() => go(active + 1), 4500); return () => clearTimeout(t);}, [active, n]);
  const count = (id: string) => units.filter(u => u.projectId === id).length;
  const free = (id: string) => units.filter(u => u.projectId === id && u.status === 'Còn hàng').length;
  const chips: [string, string, number][] = [['all', 'Tất cả', projects.length], ['low', 'Thấp tầng', projects.filter(p => p.category === 'low').length], ['high', 'Cao tầng', projects.filter(p => p.category === 'high').length], ...regions.map(r => [r, r, projects.filter(p => p.region === r).length] as [string, string, number])];
  const current = list[active];
  return <section className="sz-deck-band">
    <div className="sz-wrap sz-ring-head">
      <div><Eyebrow>Danh mục dự án</Eyebrow><h2 className="sz-h2">Không gian sống chọn lọc,<br/>giá trị bền vững</h2></div>
      <dl className="sz-ring-stats">
        <div><dt>Dự án</dt><dd><span className="fx-count">{projects.length}</span><sup>+</sup></dd></div>
        <div><dt>Quỹ căn</dt><dd><span className="fx-count">{units.length}</span><sup>+</sup></dd></div>
        <div><dt>Khu vực</dt><dd><span className="fx-count">{regions.length}</span><sup>+</sup></dd></div>
      </dl>
    </div>
    <div className="sz-wrap sz-ring-chips">{chips.map(([id, label, c]) => <button key={id} type="button" className={group === id ? 'is-on' : ''} onClick={() => setGroup(id)}>{label}<b>{c}</b></button>)}</div>
    {current && <div className="sz-wrap sz-deck"
      onTouchStart={e => {touch.current = e.touches[0].clientX;}} onTouchEnd={e => {if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));}}>
      <div className="sz-deck-info" key={current.id}>
        <span className="sz-deck-num">{String(active + 1).padStart(2, '0')}<small>/ {String(n).padStart(2, '0')}</small></span>
        <small className="sz-deck-loc"><MapPin size={15}/>{current.location}</small>
        <h3>{current.name}</h3>
        <dl>
          <div><dt>Chủ đầu tư</dt><dd>{current.developer}</dd></div>
          <div><dt>Loại hình</dt><dd>{current.category === 'high' ? 'Cao tầng' : 'Thấp tầng'}</dd></div>
          <div><dt>Quỹ căn</dt><dd>{count(current.id)} căn · {free(current.id)} còn hàng</dd></div>
          <div><dt>Trạng thái</dt><dd>{current.status}</dd></div>
        </dl>
        <div className="sz-deck-actions">
          <ArrowButton href={projectPath(current.id)}>Khám phá dự án</ArrowButton>
          <Link href={projectPath(current.id, 'inventory')} className="sz-deck-ghost">Bảng hàng</Link>
          <button type="button" className={'sz-deck-heart' + (favorites.has(current.id) ? ' is-on' : '')} aria-pressed={favorites.has(current.id)} aria-label={`Yêu thích ${current.name}`} onClick={() => onFavorite(current.id)}><Heart size={18} fill={favorites.has(current.id) ? 'currentColor' : 'none'}/></button>
        </div>
        <div className="sz-deck-nav">
          <button type="button" aria-label="Dự án trước" onClick={() => go(active - 1)}><ChevronLeft size={20}/></button>
          <div className="sz-u-bar"><i key={active} className="sz-deck-timer"/></div>
          <button type="button" aria-label="Dự án tiếp" onClick={() => go(active + 1)}><ChevronRight size={20}/></button>
        </div>
      </div>
      <div className="sz-deck-stack" aria-hidden="true">
        {list.map((p, i) => {const pos = (i - active + n) % n; const out = n > 1 && pos === n - 1; const shown = pos <= 3 || out;
          return <button key={p.id} type="button" tabIndex={-1} className={'sz-deck-card' + (pos === 0 ? ' is-front' : '') + (out ? ' is-out' : '')}
            style={{['--k' as string]: out ? 0 : pos, zIndex: out ? 30 : 20 - pos, opacity: shown ? (pos > 3 ? 0 : 1) : 0, visibility: shown ? 'visible' : 'hidden'}}
            onClick={() => {if (pos === 0) window.location.assign(projectPath(p.id)); else go(i);}}>
            <Img src={p.image} alt=""/><span className="sz-status">{p.status}</span>
          </button>;})}
      </div>
    </div>}
    <p className="sz-ring-note">Xem toàn bộ {projects.length} dự án và bộ lọc chi tiết bên dưới. <button type="button" onClick={() => onList(group === 'all' ? {} : group === 'low' || group === 'high' ? {type: group} : {region: group})}>Danh sách dự án</button></p>
  </section>;
}

/** /du-an featured projects: one large photo with project thumbnails inside, sliding automatically. */
function ShowcaseScatter({projects, units}: {projects: Project[]; units: Unit[]}) {
  const [active, setActive] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const n = projects.length;
  useEffect(() => {const el = strip.current, b = el?.children[active] as HTMLElement | undefined; if (el && b) el.scrollTo({left: b.offsetLeft - el.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth'});}, [active]);
  useEffect(() => {if (n < 2) return; const t = setTimeout(() => setActive(i => (i + 1) % n), 5000); return () => clearTimeout(t);}, [active, n]);
  if (!n) return null;
  const p = projects[active % n];
  return <section className="sz-feat">
    <div className="sz-wrap sz-feat-head">
      <div><Eyebrow>Dự án tiêu biểu</Eyebrow><h2 className="sz-h2">Thiết kế ấn tượng,<br/>giá trị bền vững</h2></div>
      <p>{n} dự án nổi bật đang mở bán trên Alpha Hub. Ảnh tự chuyển, bấm ảnh nhỏ để xem dự án khác.</p>
    </div>
    <div className="sz-wrap">
      <div className="sz-feat-stage">
        {projects.map((x, i) => near(i, active, n) && <Img w={1920} key={x.id} className={'sz-feat-photo' + (i === active ? ' is-on' : '')} src={x.image} alt={i === active ? x.name : ''}/>)}
        <div className="sz-feat-info" key={p.id}>
          <span className="sz-status">{p.status}</span>
          <small><MapPin size={15}/>{p.location}</small>
          <h3>{p.name}</h3>
          <p>{p.developer} · {p.category === 'high' ? 'Cao tầng' : 'Thấp tầng'} · {units.filter(u => u.projectId === p.id).length} căn</p>
          <ArrowButton href={projectPath(p.id)} tone="white">Khám phá dự án</ArrowButton>
        </div>
        <div className="sz-feat-thumbs" ref={strip}>{projects.map((x, i) => <button key={x.id} type="button" className={i === active ? 'is-on' : ''} onClick={() => setActive(i)} aria-label={x.name}>
          <Img w={360} src={x.image} alt=""/><span>{x.name}</span>{i === active && <i className="sz-feat-timer"/>}
        </button>)}</div>
      </div>
    </div>
  </section>;
}

const budgets: [string, string, number, number][] = [['lt10', 'Dưới 10 tỷ', 0, 10], ['10-20', '10 – 20 tỷ', 10, 20], ['20-50', '20 – 50 tỷ', 20, 50], ['gt50', 'Trên 50 tỷ', 50, Infinity]];
const PER_PAGE = 9;
const blank = {status: '', type: '', region: '', budget: '', query: ''};

export function SpaciazProjects({projects, units, favorites, onFavorite}: {projects: Project[]; units: Unit[]; favorites: Set<string>; onFavorite: (id: string) => void}) {
  const [draft, setDraft] = useState(blank), [applied, setApplied] = useState(blank), [page, setPage] = useState(1);
  const top = useRef<HTMLDivElement>(null);
  const options = (key: keyof Project) => Array.from(new Set(projects.map(p => String(p[key])).filter(Boolean))).sort();
  const norm = (s: string) => s.toLocaleLowerCase('vi').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const prices = useMemo(() => {const m = new Map<string, number[]>(); for (const u of units) if (u.price > 0) m.set(u.projectId, [...(m.get(u.projectId) || []), u.price]); return m;}, [units]);
  const count = (id: string) => units.filter(u => u.projectId === id).length;
  const inBudget = (p: Project) => {
    if (!applied.budget) return true;
    const b = budgets.find(x => x[0] === applied.budget), v = prices.get(p.id);
    return !!b && !!v && v.some(price => price >= b[2] && price < b[3]);
  };
  const list = projects.filter(p => (!applied.status || p.status === applied.status) && (!applied.type || p.category === applied.type) && (!applied.region || p.region === applied.region) && inBudget(p) && (!applied.query || norm(`${p.name} ${p.location} ${p.developer}`).includes(norm(applied.query))));
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE)), current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const filtered = Object.values(applied).some(Boolean);
  const go = (n: number) => {setPage(n); top.current?.scrollIntoView({behavior: 'smooth', block: 'start'});};
  const set = (key: keyof typeof blank) => (e: {target: {value: string}}) => setDraft({...draft, [key]: e.target.value});
  const regions = options('region');
  const developers = options('developer');
  const regionCount = (r: string) => projects.filter(p => p.region === r).length;
  const pick = (patch: Partial<typeof blank>) => {const next = {...blank, ...patch}; setDraft(next); setApplied(next); setPage(1); setTimeout(() => top.current?.scrollIntoView({behavior: 'smooth', block: 'start'}), 30);};
  const firstOf = (test: (p: Project) => boolean) => projects.find(test)?.image;
  const groups = [
    {title: 'Thấp tầng', body: `${projects.filter(p => p.category === 'low').length} dự án biệt thự, liền kề, shophouse`, image: firstOf(p => p.category === 'low'), on: () => pick({type: 'low'})},
    {title: 'Cao tầng', body: `${projects.filter(p => p.category === 'high').length} dự án căn hộ`, image: firstOf(p => p.category === 'high'), on: () => pick({type: 'high'})},
    ...regions.slice(0, 3).map(r => ({title: r, body: `${regionCount(r)} dự án`, image: firstOf(p => p.region === r), on: () => pick({region: r})})),
  ];
  const showcase = [...projects].sort((a, b) => Number(b.hot) - Number(a.hot)).slice(0, 6);
  return <div className="sz sz-projects-page">
    <ProjectsHero projects={projects} units={units}/>
    <Sheet className="sz-home-sheet sz-ring-sheet">
      <ProjectRing projects={projects} units={units} regions={regions} favorites={favorites} onFavorite={onFavorite} onList={pick}/>

      <ShowcaseScatter projects={[...projects].sort((a, b) => Number(b.hot) - Number(a.hot))} units={units}/>

      <section className="sz-wrap sz-listing sz-section" id="tat-ca-du-an" ref={top}>
        <div className="sz-news-head sz-listing-head"><div data-fx="left"><Eyebrow>Tất cả dự án</Eyebrow><h2 className="sz-h2">Danh sách dự án</h2></div></div>
        <form className="sz-filter" onSubmit={e => {e.preventDefault(); setApplied(draft); setPage(1);}} data-fx="">
          <label className="sz-filter-search"><Search size={16}/><input value={draft.query} onChange={set('query')} placeholder="Tên dự án, địa điểm…" aria-label="Tìm dự án"/></label>
          <select value={draft.status} onChange={set('status')} aria-label="Trạng thái"><option value="">Trạng thái</option>{options('status').map(v => <option key={v}>{v}</option>)}</select>
          <select value={draft.type} onChange={set('type')} aria-label="Loại hình"><option value="">Loại hình</option><option value="low">Thấp tầng</option><option value="high">Cao tầng</option></select>
          <select value={draft.region} onChange={set('region')} aria-label="Khu vực"><option value="">Khu vực</option>{options('region').map(v => <option key={v}>{v}</option>)}</select>
          <select value={draft.budget} onChange={set('budget')} aria-label="Khoảng giá"><option value="">Khoảng giá</option>{budgets.map(b => <option key={b[0]} value={b[0]}>{b[1]}</option>)}</select>
          <button className="sz-pill-btn">Tìm kiếm</button>
        </form>
        <p className="sz-result">Hiển thị <b>{list.length}</b> / {projects.length} dự án{filtered && <button type="button" onClick={() => {setDraft(blank); setApplied(blank); setPage(1);}}>Xóa bộ lọc</button>}</p>
        <div className="sz-project-grid">{shown.map(p => <article key={p.id} className="sz-project" data-fx="zoom">
          <Link href={projectPath(p.id)} className="sz-project-link" aria-label={p.name}><Img src={p.image} alt={p.name}/></Link>
          <span className="sz-status">{p.status}</span>
          <button type="button" className={'sz-heart' + (favorites.has(p.id) ? ' is-on' : '')} aria-label={`Yêu thích ${p.name}`} aria-pressed={favorites.has(p.id)} onClick={() => onFavorite(p.id)}><Heart size={16} fill={favorites.has(p.id) ? 'currentColor' : 'none'}/></button>
          <div className="sz-project-text"><span><MapPin size={14}/>{p.location}<em>{count(p.id)} căn</em></span><h3><Link href={projectPath(p.id)}>{p.name}</Link></h3></div>
        </article>)}</div>
        {!list.length && <div className="sz-empty"><Search size={28}/><h3>Không tìm thấy dự án phù hợp</h3><p>Thử bỏ bớt điều kiện lọc.</p></div>}
        {pages > 1 && <nav className="sz-pages" aria-label="Phân trang dự án">
          {Array.from({length: pages}, (_, i) => i + 1).map(n => <button key={n} type="button" className={n === current ? 'is-on' : ''} aria-current={n === current ? 'page' : undefined} onClick={() => go(n)}>{n}</button>)}
          {current < pages && <button type="button" aria-label="Trang sau" onClick={() => go(current + 1)}><ChevronRight size={16}/></button>}
        </nav>}
      </section>

      {developers.length > 0 && <section className="sz-partners">
        <p>Đồng hành cùng các chủ đầu tư uy tín</p>
        <div className="sz-partners-track">{[0, 1].map(copy => <span key={copy} aria-hidden={copy > 0 || undefined}>{[...developers, ...projects.map(p => p.name)].map((name, i) => <b key={i}>{name}</b>)}</span>)}</div>
      </section>}

      <section className="sz-enquiry">
        <div className="sz-enquiry-bg"><Img w={1920} src={showcase[2]?.image || showcase[0]?.image} alt=""/></div>
        <div className="sz-enquiry-card sz-wrap" data-fx="zoom">
          <div className="sz-center"><Eyebrow>Tư vấn dự án</Eyebrow><h2 className="sz-h3">Nhận bảng giá & lịch tham quan<br/>dự án bạn quan tâm</h2></div>
          <LeadForm projects={projects} note="Form tư vấn trang Dự án" compact/>
        </div>
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
        <div className="sz-about-photo sz-notch-tl"><Img w={1600} src={featured?.image} alt={featured?.name}/></div>
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
            <span className="sz-milestone-year">{s.year}</span><span className="sz-milestone-photo"><Img w={420} src={s.image} alt=""/></span><i/><h3>{s.title}</h3><p>{s.body}</p></Link>)}</div>
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
    <div><h3>Bài viết mới</h3><ul className="sz-side-recent">{recent.map(s => <li key={s.id}><Link href={s.href}><Img w={160} src={s.image} alt=""/><span>{s.title}</span></Link></li>)}</ul></div>
    <div className="sz-side-cta"><h3>Cần tư vấn dự án?</h3><p>Để lại thông tin, đội ngũ Alpha Hub sẽ liên hệ trong thời gian sớm nhất.</p><ArrowButton href="/lien-he">Liên hệ ngay</ArrowButton></div>
  </aside>;
  if (routeId) return <div className="sz">
    <Banner title="Tin tức" crumb={opened ? clip(opened.title, 60) : 'Không tìm thấy'}/>
    <Sheet><section className="sz-wrap sz-blog">
      <article className="sz-article">{opened ? <>
        <div className="sz-post-meta"><b>{opened.category}</b><i/><time>{vnDate(opened.date)}</time></div>
        <h1>{opened.title}</h1>
        {canEdit && <button type="button" className="sz-edit" onClick={() => onEdit(opened)}><Pencil size={15}/>Chỉnh sửa bài viết</button>}
        <div className="sz-article-cover"><Img w={1400} src={opened.image} alt={opened.title}/></div>
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
          <Link href={s.href} className="sz-blog-photo"><Img w={1200} src={s.image} alt={s.title}/></Link>
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
        <div className="sz-message-photo sz-notch-tl" data-fx="right"><Img w={1400} src={projects[0]?.image} alt=""/><a href={contact.facebookHref} target="_blank" rel="noreferrer" className="sz-round-cta">Theo dõi<br/>Facebook</a></div>
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
        <nav aria-label="Liên kết chân trang"><Link href="/gioi-thieu">Giới thiệu</Link><Link href="/du-an">Dự án</Link><Link href="/quy-hang">Quỹ căn</Link><Link href="/">Tổng quan</Link><Link href="/yeu-thich">Yêu thích</Link></nav>
        <nav aria-label="Hỗ trợ"><Link href="/tin-tuc">Tin tức</Link><Link href="/huong-dan">Hướng dẫn</Link><Link href="/lien-he">Liên hệ</Link><Link href="/dang-nhap">Đăng nhập</Link></nav>
        <div className="sz-footer-contact"><a href={`tel:${contact.phone}`}>{contact.phone}</a><a href={`mailto:${contact.email}`}>{contact.email}</a>{address && <p>{address}</p>}
          <div className="sz-socials"><a href={contact.zaloHref} target="_blank" rel="noreferrer">Zalo</a><i/><a href={contact.facebookHref} target="_blank" rel="noreferrer">Facebook</a></div></div>
      </div>
      <div className="sz-footer-bottom"><span>© {new Date().getFullYear()} <b>{brand}</b>. Không liên kết với VHub.</span><span>Thông tin và giá bán mẫu chỉ dùng để trải nghiệm.</span></div>
    </div>
  </footer>;
}

/* ═══════════════════════════ Quỹ căn ═══════════════════════════ */
type InventoryProps = {projects: Project[]; units: Unit[]; statusOf: (u: Unit) => string; onOpenUnit: (u: Unit) => void};
const fmtNum = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});
const scrollToSearch = () => document.getElementById('tim-quy-can')?.scrollIntoView({behavior: 'smooth', block: 'start'});

/** Opening of /quy-hang: dark split with a large photo and an auto-running list of featured units. */
export function SpaciazInventoryIntro({projects, units, statusOf, onOpenUnit}: InventoryProps) {
  const picks = useMemo(() => {
    const seen = new Set<string>();
    return units.filter(u => statusOf(u) === 'Còn hàng' && u.price > 0).sort((a, b) => b.price - a.price)
      .filter(u => !seen.has(u.projectId) && !!seen.add(u.projectId)).slice(0, 6);
  }, [units, statusOf]);
  const [active, setActive] = useState(0), [paused, setPaused] = useState(false);
  useEffect(() => {if (paused || picks.length < 2) return; const t = setTimeout(() => setActive(i => (i + 1) % picks.length), 5000); return () => clearTimeout(t);}, [active, paused, picks.length]);
  const projectOf = (u?: Unit) => projects.find(p => p.id === u?.projectId);
  const current = picks[active];
  if (!picks.length) return null;
  return <section className="sz sz-u-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="sz-u-hero-photo">
      {picks.map((u, i) => near(i, active, picks.length) && <Img w={1600} key={u.id} className={i === active ? 'is-on' : ''} src={projectOf(u)?.image} alt=""/>)}
      {current && <div className="sz-u-hero-tag" key={current.id}>
        <small><MapPin size={14}/>{projectOf(current)?.name}</small>
        <strong>{current.code}</strong>
        <dl><div><dt>Giá tham khảo</dt><dd>{fmtNum(current.price)} <sub>tỷ</sub></dd></div><div><dt>Diện tích</dt><dd>{current.area ? `${fmtNum(current.area)} m²` : '—'}</dd></div><div><dt>Loại hình</dt><dd>{current.type || '—'}</dd></div></dl>
      </div>}
    </div>
    <div className="sz-u-hero-list">
      <Eyebrow light>Căn nổi bật</Eyebrow>
      <h1>Khám phá những căn<br/>đang được quan tâm</h1>
      <ul>{picks.map((u, i) => <li key={u.id}><button type="button" className={i === active ? 'is-on' : ''} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => onOpenUnit(u)}>
        <small><MapPin size={14}/>{projectOf(u)?.name}</small>
        <strong>{u.code}<em>{fmtNum(u.price)} tỷ</em></strong>
        <span>{u.type || 'Sản phẩm'}{u.area ? ` · ${fmtNum(u.area)} m²` : ''}{u.direction && u.direction !== 'Chưa cập nhật' ? ` · ${u.direction}` : ''}</span>
        <i className="sz-u-progress" key={i === active ? `on-${active}` : 'off'} style={{animationPlayState: paused ? 'paused' : 'running'}}/>
      </button></li>)}</ul>
      <button type="button" className="sz-btn is-mint" onClick={scrollToSearch}><span>Tìm căn phù hợp</span><i aria-hidden="true"><ArrowUpRight size={16}/></i></button>
    </div>
  </section>;
}

type SliderProps = {items: Unit[]; projects: Project[]; statusOf: (u: Unit) => string; favorites: Set<string>; compare: string[]; onFavorite: (id: string) => unknown; onCompare: (id: string) => void; onOpenUnit: (u: Unit) => void};

/** "Quỹ căn toàn quốc" as a 3D coverflow: the active unit sits in front, neighbours turn away. */
export function SpaciazUnitSlider({items, projects, statusOf, favorites, compare, onFavorite, onCompare, onOpenUnit}: SliderProps) {
  const [active, setActive] = useState(0);
  const touch = useRef<number | null>(null);
  const n = items.length;
  const projectOf = (u: Unit) => projects.find(p => p.id === u.projectId);
  const go = (to: number) => setActive(((to % n) + n) % n);
  const itemKey = items.length + ':' + (items[0]?.id || '');
  useEffect(() => {setActive(0);}, [itemKey]);
  // Always running (owner's request, even with reduced motion on); any manual move restarts the timer.
  useEffect(() => {if (n < 2) return; const t = setTimeout(() => go(active + 1), 3500); return () => clearTimeout(t);}, [active, n]);
  if (!n) return null;
  const range = Math.min(4, Math.floor((n - 1) / 2));
  const slots: {u: Unit; i: number; off: number}[] = [];
  for (let off = -range; off <= range; off++) {const i = ((active + off) % n + n) % n; slots.push({u: items[i], i, off});}
  if (n === 2) slots.splice(0, slots.length, {u: items[active], i: active, off: 0}, {u: items[(active + 1) % 2], i: (active + 1) % 2, off: 1});
  return <div className="sz sz-u3d" tabIndex={0} aria-roledescription="carousel" aria-label="Quỹ căn"
    onKeyDown={e => {if (e.key === 'ArrowLeft') go(active - 1); if (e.key === 'ArrowRight') go(active + 1);}}
    onTouchStart={e => {touch.current = e.touches[0].clientX;}} onTouchEnd={e => {if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));}}>
    <div className="sz-u3d-stage">
      {slots.map(({u, i, off}) => {const p = projectOf(u), status = statusOf(u), free = status === 'Còn hàng', on = off === 0, a = Math.abs(off);
        return <article key={u.id} className={'sz-u-card sz-u3d-card' + (on ? ' is-active' : '')} aria-hidden={!on || undefined}
          style={{transform: `translateX(calc(-50% + ${off} * var(--u3d-gap))) translateZ(${-a * 170}px) rotateY(${off * -24}deg) scale(${on ? 1 : 1 - a * .06})`, zIndex: 20 - a, opacity: a > 3 ? 0 : 1, ['--dim' as string]: on ? 1 : Math.max(.35, .75 - a * .12)}}
          onClick={() => {if (!on) go(i);}}>
          <button type="button" className="sz-u-card-photo" tabIndex={on ? 0 : -1} onClick={() => on && onOpenUnit(u)} aria-label={`Xem căn ${u.code}`}><Img src={u.posterUrl || p?.image} alt=""/></button>
          <span className={'sz-u-status' + (free ? ' is-free' : '')}>{status}</span>
          <div className="sz-u-card-tools">
            <button type="button" tabIndex={on ? 0 : -1} aria-label={`Yêu thích ${u.code}`} aria-pressed={favorites.has(u.id)} className={favorites.has(u.id) ? 'is-on' : ''} onClick={e => {e.stopPropagation(); onFavorite(u.id);}}><Heart size={17} fill={favorites.has(u.id) ? 'currentColor' : 'none'}/></button>
            <button type="button" tabIndex={on ? 0 : -1} aria-label={`So sánh ${u.code}`} aria-pressed={compare.includes(u.id)} className={compare.includes(u.id) ? 'is-on' : ''} onClick={e => {e.stopPropagation(); onCompare(u.id);}}><Layers size={16}/></button>
          </div>
          <div className="sz-u-card-body">
            <small><MapPin size={13}/>{p?.name}</small>
            <button type="button" className="sz-u-code" tabIndex={on ? 0 : -1} onClick={() => on && onOpenUnit(u)}>{u.code}</button>
            <div className="sz-u-price"><span>Giá tham khảo</span><b>{u.price ? <>{fmtNum(u.price)} <sub>tỷ</sub></> : 'Liên hệ'}</b></div>
            <dl>
              <div><dt>Diện tích</dt><dd>{u.area ? `${fmtNum(u.area)} m²` : '—'}</dd></div>
              <div><dt>Loại hình</dt><dd>{u.type || '—'}</dd></div>
              <div><dt>Phân khu</dt><dd>{u.zone || '—'}</dd></div>
              <div><dt>Hướng</dt><dd>{u.direction || '—'}</dd></div>
            </dl>
            <button type="button" className="sz-u-open" tabIndex={on ? 0 : -1} onClick={e => {e.stopPropagation(); if (on) onOpenUnit(u); else go(i);}}><span>Xem chi tiết căn</span><i><ArrowUpRight size={16}/></i></button>
          </div>
        </article>;})}
    </div>
    <div className="sz-u-nav">
      <button type="button" aria-label="Căn trước" onClick={() => go(active - 1)}><ChevronLeft size={20}/></button>
      <span><b>{String(active + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}</span>
      <div className="sz-u-bar"><i style={{width: `${(active + 1) / n * 100}%`}}/></div>
      <button type="button" aria-label="Căn tiếp" onClick={() => go(active + 1)}><ChevronRight size={20}/></button>
    </div>
  </div>;
}

/** Closing of /quy-hang: note cards and the quick-enquiry block. */
export function SpaciazInventoryOutro({projects, contact}: {projects: Project[]; contact: PublicContact}) {
  const quotes = [
    {title: '“Giá tham khảo”', body: 'Giá hiển thị là giá tham khảo tại thời điểm cập nhật. Chính sách và giá chính thức được xác nhận khi tư vấn.', who: 'Bảng hàng', role: 'Cập nhật liên tục'},
    {title: '“Giữ chỗ nhanh”', body: 'Chọn căn, để lại thông tin và đội ngũ sẽ hỗ trợ giữ chỗ, đặt lịch tham quan dự án trong thời gian sớm nhất.', who: 'Đội ngũ tư vấn', role: contact.phone},
    {title: '“So sánh dễ dàng”', body: 'Lưu căn yêu thích, so sánh tối đa ba căn và xuất bảng hàng để cân nhắc cùng gia đình.', who: 'Công cụ Alpha Hub', role: 'Miễn phí'},
  ];
  const photo = projects[2]?.image || projects[0]?.image;
  return <div className="sz sz-inv6-outro">
    <section className="sz-h6-quotes sz-wrap">
      <div className="sz-center" data-fx=""><Eyebrow>Lưu ý khi chọn căn</Eyebrow><h2 className="sz-h2">Điều bạn nên biết</h2></div>
      <div className="sz-h6-quote-grid">{quotes.map(q => <figure key={q.title} className="sz-h6-quote" data-fx="zoom"><h3>{q.title}</h3><p>{q.body}</p><figcaption><span><ShieldCheck size={18}/></span><b>{q.who}</b><small>{q.role}</small></figcaption></figure>)}</div>
    </section>
    <section className="sz-h6-enquiry">
      <div className="sz-wrap">
        <div className="sz-h6-enquiry-top">
          <div data-fx="left"><Eyebrow>Tư vấn nhanh</Eyebrow><h2 className="sz-h2">Chưa tìm được<br/>căn ưng ý?</h2>
            <a className="sz-h6-phone" href={`tel:${contact.phone}`}><span><Phone size={18}/></span><div><small>Hotline / Zalo</small><b>{contact.phone}</b></div></a></div>
          <div data-fx="right"><p className="sz-lead-strong">Để lại thông tin, chúng tôi sẽ gửi danh sách căn phù hợp với nhu cầu và ngân sách của bạn.</p><LeadForm projects={projects} note="Form tư vấn trang Quỹ căn" compact/></div>
        </div>
        <div className="sz-h6-enquiry-photo sz-notch-tr" data-fx="zoom"><Img w={1600} src={photo} alt=""/></div>
      </div>
    </section>
  </div>;
}

/* ═══════════════════════════ Mặt bằng căn (standalone) ═══════════════════════════ */
/** /mat-bang-can: the unit poster as a full page. Visitors see finished posters only, with a code strip,
 *  a sticky info card and related finished units; administrators get the full studio editor. */
const viaProxy = (src?: string) => {if (!src) return ''; try {const url = new URL(src); return url.hostname.endsWith('chatgpt.site') ? '/api/vinh-tien' + url.pathname + '?w=640' : src;} catch {return src;}};
type PinLike = {projectId: string; code: string; layer?: string; x: number; y: number};
const STUDIO = 'green-paradise';

/** Plan (or aerial map) with the unit's pin, for projects without a poster studio. */
function UnitSpot({project, unit, files, pins}: {project: Project; unit: Unit; files: Asset[]; pins: PinLike[]}) {
  const up = (s: string) => s.trim().toUpperCase();
  const plan = files.find(f => f.projectId === project.id && f.kind === 'plan');
  const planPin = pins.find(p => p.projectId === project.id && up(p.code) === up(unit.code) && p.layer !== 'map');
  const mapPin = pins.find(p => p.projectId === project.id && up(p.code) === up(unit.code) && p.layer === 'map');
  const view = plan && planPin ? {src: plan.url, pin: planPin, label: 'Vị trí căn trên mặt bằng dự án'} : mapPin ? {src: project.image, pin: mapPin, label: 'Vị trí căn trên phối cảnh dự án'} : {src: plan?.url || project.image, pin: undefined, label: plan ? 'Mặt bằng dự án · vị trí căn đang được cập nhật' : 'Phối cảnh dự án · vị trí căn đang được cập nhật'};
  const extra = [unit.posterUrl, unit.layoutUrl].filter(Boolean) as string[];
  return <div className="sz-up-spot">
    <div className="sz-up-spot-head"><span>{view.label}</span><Link href={projectPath(project.id, plan ? 'plan' : 'vr')}>Mở toàn màn hình <ArrowUpRight size={14}/></Link></div>
    <div className="sz-up-spot-map"><img src={view.src} alt={view.label}/>{view.pin && <span className="sz-up-pin" style={{left: `${view.pin.x}%`, top: `${view.pin.y}%`}}><b>{unit.code}</b><i/></span>}</div>
    {extra.map(src => <div key={src} className="sz-up-spot-map is-extra"><img src={src} alt={`Mặt bằng căn ${unit.code}`}/></div>)}
  </div>;
}

/** /mat-bang-can?project=&code=: one page per unit for every project. Green Paradise shows the poster studio
 *  (finished posters only for visitors, full editor for admins); other projects show the plan with the unit pin. */
export function SpaciazUnitPlan({projects, units, files, pins, statusOf, contact, isAdmin = false}: {projects: Project[]; units: Unit[]; files: Asset[]; pins: PinLike[]; statusOf: (u: Unit) => string; contact: PublicContact; isAdmin?: boolean}) {
  const [editing, setEditing] = useState(false), [frameCode, setFrameCode] = useState('');
  const [params, setParams] = useState<{project: string; code: string} | null>(null);
  useEffect(() => {const q = new URLSearchParams(window.location.search); setParams({project: q.get('project') || '', code: (q.get('code') || '').toUpperCase()});}, []);
  const withUnits = useMemo(() => projects.filter(p => units.some(u => u.projectId === p.id)), [projects, units]);
  const projectId = params ? (withUnits.find(p => p.id === params.project)?.id || units.find(u => u.code.toUpperCase() === params.code)?.projectId || STUDIO) : STUDIO;
  const project = projects.find(p => p.id === projectId);
  const studio = projectId === STUDIO;
  const done = useMemo(() => units.filter(u => u.projectId === projectId && (!studio || u.drawing?.main?.src)), [units, projectId, studio]);
  const frame = useRef<HTMLIFrameElement>(null), top = useRef<HTMLDivElement>(null);
  const [admin, setAdmin] = useState<boolean | null>(null), [height, setHeight] = useState(1600), [q, setQ] = useState('');
  const [code, setCode] = useState('');
  useEffect(() => {if (params && done.length && !done.some(u => u.code === code)) setCode(done.find(u => u.code.toUpperCase() === params.code)?.code || done[0].code);}, [done, code, params]);
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === 'vinh-tien-mode') setAdmin(!!e.data.canEdit);
      if (e.data?.type === 'vinh-tien-height' && e.data.h > 300) setHeight(Math.ceil(e.data.h));
      if (e.data?.type === 'vinh-tien-selected' && e.data.code) setCode(e.data.code);
    };
    window.addEventListener('message', on); return () => window.removeEventListener('message', on);
  }, []);
  useEffect(() => {if (code && params) window.history.replaceState(null, '', `/mat-bang-can?project=${encodeURIComponent(projectId)}&code=${encodeURIComponent(code)}`);}, [code, projectId, params]);
  const pick = (c: string, scroll = false) => {
    setCode(c); if (studio) frame.current?.contentWindow?.postMessage({type: 'vinh-tien-select', code: c}, window.location.origin);
    if (scroll) top.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };
  const switchProject = (id: string) => {setParams({project: id, code: ''}); setCode(''); setEditing(false); setAdmin(null); setQ('');};
  const unit = done.find(u => u.code === code) || done[0];
  const strip = done.filter(u => u.code.toLowerCase().includes(q.trim().toLowerCase()));
  const related = unit ? [...done.filter(u => u.id !== unit.id && u.type === unit.type), ...done.filter(u => u.id !== unit.id && u.type !== unit.type)].slice(0, 8) : [];
  const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});
  const src = !params || !studio ? '' : '/vinh-tien-editor?embed=1' + (editing ? '&mode=edit' : '') + '&code=' + encodeURIComponent(frameCode || params.code || done[0]?.code || '');
  const adminView = studio && admin === true;
  const cover = (u: Unit) => studio ? viaProxy(u.drawing?.gallery[0] || u.drawing?.main.src || u.posterUrl) : (u.posterUrl || project?.image || '');
  return <div className="sz sz-up">
    <Banner title="Mặt bằng căn" crumb={project?.name} aside={`Bảng thông tin từng mã căn ${project?.name || ''}: vị trí trên mặt bằng, diện tích, loại hình và giá bán.`}/>
    <Sheet>
      <div className="sz-up-wrap" ref={top}>
        <div className="sz-up-bar">
          <div className="sz-up-bar-head">
            <label className="sz-up-project"><Building2 size={16}/><select value={projectId} onChange={e => switchProject(e.target.value)} aria-label="Chọn dự án">{withUnits.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <strong>{done.length} mã căn</strong>
            <label className="sz-up-search"><Search size={16}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã căn…" aria-label="Tìm mã căn"/></label>
            {isAdmin && studio && <button type="button" className={'sz-up-admin' + (editing ? ' is-on' : '')} onClick={() => {setFrameCode(code); setEditing(!editing); setAdmin(null);}} title="Chỉ quản trị viên nhìn thấy nút này"><Pencil size={15}/>{editing ? 'Xem như khách' : 'Quản Trị Viên'}</button>}</div>
          <div className="sz-up-codes">{strip.map(u => <button key={u.id} type="button" className={u.code === unit?.code ? 'is-on' : ''} onClick={() => pick(u.code)}><b>{u.code}</b><span>{u.price ? fmt(u.price) + ' tỷ' : 'Liên hệ'}</span></button>)}{!strip.length && <p>Không có mã phù hợp.</p>}</div>
        </div>
        <div className={'sz-up-main' + (adminView ? ' is-admin' : '')}>
          <div className="sz-up-poster">
            {studio ? <>{admin === null && <div className="sz-up-loading">Đang tải bảng thông tin…</div>}
              {src && <iframe key={projectId + (editing ? 'edit' : 'view')} ref={frame} title="Mặt bằng căn" src={src} style={{height}} scrolling="no"/>}</>
              : project && unit ? <UnitSpot key={unit.id} project={project} unit={unit} files={files} pins={pins}/> : <div className="sz-empty"><h3>Dự án chưa có mã căn</h3></div>}
          </div>
          {!adminView && unit && <aside className="sz-up-info" key={unit.id}>
            <small><MapPin size={14}/>{unit.zone} · {project?.name}</small>
            <strong className="sz-up-code">{unit.code}</strong>
            <div className="sz-up-price"><span>Giá bán<br/><em>Chưa gồm VAT + KPBT</em></span><b>{unit.price ? <>{fmt(unit.price)} <sub>tỷ</sub></> : 'Liên hệ'}</b></div>
            <dl>
              <div><dt>Diện tích đất</dt><dd>{unit.area ? fmt(unit.area) + ' m²' : '—'}</dd></div>
              <div><dt>Diện tích xây dựng</dt><dd>{unit.builtArea ? fmt(unit.builtArea) + ' m²' : '—'}</dd></div>
              <div><dt>Loại hình</dt><dd>{unit.type || '—'}</dd></div>
              <div><dt>{studio ? 'Tiêu chuẩn BG' : 'Tòa / Tầng'}</dt><dd>{studio ? unit.group || '—' : `${unit.tower || 'Tòa chính'} / ${unit.floor}`}</dd></div>
              <div><dt>Hướng</dt><dd>{unit.direction || '—'}</dd></div>
              <div><dt>Trạng thái</dt><dd className={statusOf(unit) === 'Còn hàng' ? 'is-free' : ''}>{statusOf(unit)}</dd></div>
            </dl>
            <ArrowButton href={projectPath(projectId, 'vr')}>Xem trên quỹ căn 360°</ArrowButton>
            <div className="sz-up-actions"><Link href="/lien-he" className="sz-up-ghost">Nhận tư vấn</Link><a href={`tel:${contact.phone}`} className="sz-up-ghost"><Phone size={15}/>{contact.phone}</a></div>
            {studio && <p className="sz-up-hint">Tải ảnh phiếu căn ở cuối bảng thông tin bên trái.</p>}
          </aside>}
        </div>
      </div>
      {related.length > 0 && <section className="sz-up-related">
        <div className="sz-news-head"><div><Eyebrow>Cùng dự án</Eyebrow><h2 className="sz-h2">Các căn liên quan</h2></div><p>{done.length} mã căn {studio ? 'đã có bảng thông tin hoàn chỉnh' : 'trong ' + (project?.name || 'dự án')}</p></div>
        <div className="sz-up-grid">{related.map(u => <button key={u.id} type="button" className="sz-up-card" onClick={() => pick(u.code, true)}>
          <span className="sz-up-card-img"><Img src={cover(u)} alt=""/><em className={statusOf(u) === 'Còn hàng' ? 'is-free' : ''}>{statusOf(u)}</em></span>
          <span className="sz-up-card-body"><small>{u.type || 'Sản phẩm'} · {u.zone}</small><b>{u.code}</b>
            <span className="sz-up-card-specs"><span>{u.area ? fmt(u.area) + ' m²' : '—'}</span><span>{u.builtArea ? fmt(u.builtArea) + ' m² XD' : ''}</span></span>
            <span className="sz-up-card-price"><span>{u.price ? <>{fmt(u.price)} <sub>tỷ</sub></> : 'Liên hệ'}</span><i><ArrowUpRight size={16}/></i></span></span>
        </button>)}</div>
      </section>}
    </Sheet>
  </div>;
}
