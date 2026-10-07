'use client';
/* Project "Tổng quan" in the Spaciaz main-demo layout: photo hero with glass cards, about block, stats bento,
 * notched cards, dark sticky zone showcase, "why us" list, rotating highlights, timeline marquee, enquiry.
 * Units come from the live inventory only. */
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Building2, GraduationCap, Leaf, MapPin, Phone, Sparkles, Star, Trees} from 'lucide-react';
import type {Asset, Project, Unit} from '@/lib/catalog';
import type {ProjectProfile} from '@/lib/project-profiles';
import type {PublicContact} from '@/lib/public-contact';
import {Eyebrow, Img, LeadForm, Quotes} from './spaciaz';

const lines = (t: string) => t.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br/>}</span>);
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});

export default function ProjectOverviewHome({project, profile, units, assets, statusOf, contact, onTab}: {project: Project; profile: ProjectProfile; units: Unit[]; assets: Asset[]; statusOf: (u: Unit) => string; contact: PublicContact; onTab: (tab: string) => void}) {
  const photos = [project.image, ...assets.filter(a => ['gallery', 'amenity', 'model'].includes(a.kind)).map(a => a.url)];
  const photo = (i: number) => photos[i % photos.length];
  const free = units.filter(u => statusOf(u) === 'Còn hàng');
  const prices = units.map(u => u.price).filter(p => p > 0);
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => {if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));}), {rootMargin: '-45% 0px -45% 0px'});
    refs.current.forEach(el => el && io.observe(el)); return () => io.disconnect();
  }, []);
  const icons = [Building2, GraduationCap, Trees, Leaf, Sparkles];
  const zone = profile.zones[active] || profile.zones[0];
  const cards = [
    {title: 'Quỹ căn 360°', body: 'Phối cảnh, mặt bằng và vị trí từng căn', tab: 'vr'},
    {title: 'Bảng hàng', body: `${units.length} căn · ${free.length} còn hàng`, tab: 'inventory'},
    {title: 'Mặt bằng dự án', body: 'Tổng mặt bằng và phân khu', tab: 'plan'},
    {title: 'Tiện ích', body: profile.amenities.slice(0, 2).map(a => a.title).join(' · '), tab: 'amenity'},
    {title: 'Thư viện & tài liệu', body: 'Hình ảnh, bảng giá, chính sách', tab: 'gallery'},
  ];
  return <div className="sz pvh">
    <section className="pvh-hero"><Img w={2560} eager src={project.image} alt={project.name}/>
      <div className="pvh-hero-copy"><h2>{lines(profile.headline)}</h2><p>{profile.intro}</p></div>
      <div className="pvh-hero-row"><p>{project.name} · {project.location}</p><button type="button" className="sz-btn is-white" onClick={() => onTab('vr')}><span>Khám phá quỹ căn 360°</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="pvh-glass">{profile.amenities.slice(0, 3).map((a, i) => {const Icon = icons[i]; return <button type="button" key={a.title} className="sz-glass" onClick={() => onTab('amenity')}><Icon size={34} strokeWidth={1.5}/><h3>{a.title}</h3><p>{a.body}</p></button>;})}</div>
    </section>

    <section className="pvh-who">
      <div><Eyebrow>Về dự án</Eyebrow></div>
      <div><h3 className="sz-h2">{lines(profile.focus.title)}</h3>
        <div className="sz-who-cols"><div><h3><Building2 size={22}/>{project.developer}</h3><p>{profile.intro}</p></div><div><h3><MapPin size={22}/>{project.location}</h3><p>{profile.focus.body}</p></div></div></div>
    </section>

    <section className="sz-bento pvh-bento">
      <button type="button" className="sz-bento-photo sz-notch-tl" onClick={() => onTab('gallery')}><Img w={1600} src={photo(1)} alt=""/><span className="sz-bento-caption"><MapPin size={14}/>{project.name}</span></button>
      {profile.stats.map(s => <div key={s.label} className="sz-stat"><small>{s.label}</small><strong><span className="fx-count">{s.value}</span><sup>{s.suffix || '+'}</sup></strong><span>{project.name}</span></div>)}
      <button type="button" className="sz-stat sz-stat-btn" onClick={() => onTab('inventory')}><small>Quỹ căn</small><strong><span className="fx-count">{units.length}</span><sup>căn</sup></strong><span>{free.length} còn hàng →</span></button>
    </section>

    <section className="pvh-services">
      <div className="sz-center"><Eyebrow>Khám phá dự án</Eyebrow><h3 className="sz-h2">Mọi thông tin bạn cần<br/>về {project.name}</h3></div>
      <div className="sz-service-grid">{cards.map((c, i) => <button type="button" key={c.title} onClick={() => onTab(c.tab)} className={'sz-service sz-notch-tr' + (i > 2 ? ' is-wide' : '')}>
        <div className="sz-service-text"><h3>{c.title}</h3><p>{c.body}</p></div><Img w={1280} src={photo(i)} alt={c.title}/><span className="sz-notch-btn"><ArrowUpRight size={16}/></span></button>)}</div>
    </section>

    <section className="pvh-show">
      <div className="pvh-show-side"><div className="pvh-show-sticky">
        <Eyebrow light>Phân khu dự án</Eyebrow><h3 className="sz-h2">{profile.zones.length} khu chủ đề<br/>quốc tế</h3>
        <div className="sz-showcase-current" key={zone.code}><span className="sz-outline-num">{zone.code}</span><div><span className="sz-showcase-loc"><MapPin size={15}/>{zone.local}{zone.area ? ' · ' + zone.area : ''}</span><h3>{zone.name}</h3><span className="sz-showcase-meta">{zone.body}</span></div></div>
        <button type="button" className="sz-btn is-mint" onClick={() => onTab('zones')}><span>Xem phân khu</span><i><ArrowUpRight size={16}/></i></button>
      </div></div>
      <div className="pvh-show-photos">{profile.zones.map((z, i) => <button type="button" key={z.code} data-i={i} ref={el => {refs.current[i] = el;}} className={i === active ? 'is-active' : ''} onClick={() => onTab('zones')} aria-label={z.name}><Img w={1600} src={photo(i)} alt=""/></button>)}</div>
    </section>

    <section className="sz-different pvh-diff">
      <div className="sz-different-photo sz-notch-tl"><Img w={1600} src={photo(2)} alt=""/><div className="sz-rating"><strong>{units.length}+</strong><span className="sz-stars">{[0, 1, 2, 3, 4].map(i => <Star key={i} size={14} fill="currentColor"/>)}</span><small>căn trong bảng hàng{prices.length ? ` · từ ${fmt(Math.min(...prices))} tỷ` : ''}</small></div></div>
      <div><Eyebrow>{profile.focus.eyebrow}</Eyebrow><h3 className="sz-h2">Điều làm nên<br/>sự khác biệt</h3><p className="sz-lead">{profile.focus.body}</p>
        <ul className="sz-features">{profile.amenities.map((a, i) => {const Icon = icons[(i + 1) % icons.length]; return <li key={a.title}><span className="sz-feature-icon"><Icon size={22}/></span><h3>{a.title}</h3><p>{a.body}</p></li>;})}</ul></div>
    </section>

    <Quotes faq={profile.timeline.map(t => ({question: t.title, answer: t.body}))} image={photo(3)}/>

    <section className="sz-partners"><p>{project.developer} · {project.location}</p>
      <div className="sz-partners-track">{[0, 1].map(k => <span key={k} aria-hidden={k > 0 || undefined}>{[...profile.zones.map(z => z.name), ...profile.amenities.map(a => a.title)].map((n, i) => <b key={i}>{n}</b>)}</span>)}</div></section>

    <section className="sz-enquiry pvh-enquiry"><div className="sz-enquiry-bg"><Img w={2560} src={photo(4)} alt=""/></div>
      <div className="sz-enquiry-card" style={{width: 'auto', margin: '0 30px'}}>
        <div className="sz-center"><Eyebrow>Tư vấn nhanh</Eyebrow><h3 className="sz-h3">Nhận bảng giá & lịch tham quan<br/>{project.name}</h3></div>
        <LeadForm projects={[project]} note={`Tư vấn ${project.name} (trang Tổng quan dự án)`} compact/>
        <p className="pvh-phone"><Phone size={15}/> Hotline / Zalo: <a href={`tel:${contact.phone}`}>{contact.phone}</a></p>
      </div>
    </section>
    <p className="pov-sources">Thông tin tổng quan tham khảo từ nguồn công khai: {profile.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}. Thông tin có thể thay đổi theo chủ đầu tư.</p>
  </div>;
}
