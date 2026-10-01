'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import Image from 'next/image';
import {ArrowRight, ArrowUpRight, Building2, ChevronLeft, ChevronRight, Heart, MapPin, Pause, Play, RotateCcw, Search, SlidersHorizontal} from 'lucide-react';
import Link from './site-link';
import ContactForm from './contact-form';
import {LeadPanel} from './news-magazine';
import {projectPath} from '@/lib/project-routes';
import type {Project, Unit} from '@/lib/catalog';

type Props = {projects: Project[]; units: Unit[]; favorites: Set<string>; onFavorite: (id: string) => void};
const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const format = (value: number) => value.toLocaleString('vi-VN');

function ProjectImage({src, name, priority = false}: {src: string; name: string; priority?: boolean}) {
  const [failedSource, setFailedSource] = useState('');
  return !src || failedSource === src ? <div className="pd-image-fallback"><Building2 size={40}/><span>{name}</span></div> :
    <Image src={src} alt={name} fill unoptimized sizes={priority ? '100vw' : '(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw'} priority={priority} onError={() => setFailedSource(src)}/>;
}

function ProjectFacts({project}: {project: Project}) {
  return <dl className="pd-project-facts"><div><dt>Chủ đầu tư</dt><dd>{project.developer || 'Đang cập nhật'}</dd></div><div><dt>Khu vực</dt><dd>{project.region || 'Đang cập nhật'}</dd></div><div><dt>Loại hình</dt><dd>{project.category === 'low' ? 'Thấp tầng' : project.category === 'high' ? 'Cao tầng' : project.category || 'Đang cập nhật'}</dd></div><div><dt>Trạng thái</dt><dd>{project.status || 'Đang cập nhật'}</dd></div></dl>;
}

export default function ProjectDirectory({projects, units, favorites, onFavorite}: Props) {
  const [selectedId, setSelectedId] = useState('');
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const finderRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [category, setCategory] = useState('all');
  const [developer, setDeveloper] = useState('all');
  const [status, setStatus] = useState('all');
  const [collection, setCollection] = useState('all');
  const [limit, setLimit] = useState(9);
  const featured = useMemo(() => projects.some(p => p.hot) ? projects.filter(p => p.hot) : projects, [projects]);
  const activeIndex = Math.max(0, featured.findIndex(p => p.id === selectedId));
  const active = featured[activeIndex];
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (featured.length < 2 || paused || hovered || focused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setSelectedId(current => featured[(Math.max(0, featured.findIndex(p => p.id === current)) + 1) % featured.length].id);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [featured, paused, hovered, focused, reducedMotion, selectedId]);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) {setPastHero(true); return;}
    const observer = new IntersectionObserver(([entry]) => setPastHero(entry.boundingClientRect.bottom <= 100), {rootMargin: '-100px 0px 0px 0px'});
    observer.observe(hero);
    return () => observer.disconnect();
  }, [!!active]);
  function applySearch() {
    setQuery(draftQuery); setRegion(draftRegion); setLimit(9);
    document.getElementById('danh-sach-du-an')?.scrollIntoView({behavior: reducedMotion ? 'instant' : 'smooth', block: 'start'});
  }
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const unit of units) result.set(unit.projectId, (result.get(unit.projectId) || 0) + 1);
    return result;
  }, [units]);
  const [draftQuery, setDraftQuery] = useState('');
  const [draftRegion, setDraftRegion] = useState('all');
  const regions = Array.from(new Set(projects.map(p => p.region).filter(Boolean)));
  const filtered = projects.filter(p => normalize(p.name + ' ' + p.location).includes(normalize(query)) &&
    (region === 'all' || p.region === region) && (category === 'all' || p.category === category) &&
    (developer === 'all' || p.developer === developer) && (status === 'all' || p.status === status) &&
    (collection !== 'hot' || p.hot) && (collection !== 'favorite' || favorites.has(p.id)));
  const results = collection === 'new' ? [...filtered].reverse() : filtered;
  function reset() {setDraftQuery(''); setDraftRegion('all'); setQuery(''); setRegion('all'); setCategory('all'); setDeveloper('all'); setStatus('all'); setCollection('all'); setLimit(9);}
  function move(direction: number) {if (!featured.length) return; setSelectedId(featured[(activeIndex + direction + featured.length) % featured.length].id);}

  return <main className="pd">
    {active && <div className="pd-ambient" aria-hidden="true"><ProjectImage src={active.image} name=""/></div>}
    {!active && <header className="pd-heading pd-container"><h1>Khám phá dự án</h1></header>}
    {active && <section ref={heroRef} className="pd-hero pd-container" aria-label="Dự án nổi bật" aria-roledescription="trình chiếu" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={e => {if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);}}>
      <div className="pd-slide-stack" aria-hidden="true">{featured.map((p, index) => <div key={p.id} className={`pd-hero-image ${p.id === active.id ? 'is-active' : ''}`}><ProjectImage src={p.image} name="" priority={index === 0}/></div>)}</div>
      <div className="pd-hero-shade"/>
      <div className="pd-hero-inner"><h1>Dự án nổi bật</h1><div className="pd-feature-panel" key={active.id}>
        <h2>{active.name}</h2>
        <p className="pd-location"><MapPin size={17}/>{active.location}</p><p className="pd-description">{active.description}</p><ProjectFacts project={active}/>
        <div className="pd-feature-count"><b>{format(counts.get(active.id) || 0)}</b><span>CĂN</span></div>
        <div className="pd-hero-actions"><Link className="pd-button pd-button-light" href={projectPath(active.id, 'inventory')}>Xem quỹ căn <ArrowRight size={18}/></Link><Link className="pd-button" href={projectPath(active.id)}>Chi tiết dự án <ArrowUpRight size={17}/></Link></div>
      </div></div>
      <div className="pd-hero-controls">{!reducedMotion && <button aria-label={paused ? 'Tiếp tục chạy slide' : 'Tạm dừng slide'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={17}/> : <Pause size={17}/>}</button>}<span><b>{String(activeIndex + 1).padStart(2, '0')}</b> / {String(featured.length).padStart(2, '0')}</span><button aria-label="Dự án trước" disabled={featured.length < 2} onClick={() => move(-1)}><ChevronLeft size={21}/></button><button aria-label="Dự án tiếp theo" disabled={featured.length < 2} onClick={() => move(1)}><ChevronRight size={21}/></button></div>
    </section>}
    <div className="pd-content-layout"><div className="pd-content-main">
    <section ref={finderRef} className="pd-finder pd-container" aria-labelledby="pd-finder-title"><h2 id="pd-finder-title">Tìm dự án phù hợp với bạn</h2><form className="pd-finder-form" onSubmit={e => {e.preventDefault(); applySearch();}}><label className="pd-search"><Search size={19}/><input type="search" placeholder="Tên dự án, địa điểm…" aria-label="Tìm dự án" value={draftQuery} onChange={e => setDraftQuery(e.target.value)}/></label><select aria-label="Khu vực" value={draftRegion} onChange={e => setDraftRegion(e.target.value)}><option value="all">Tất cả khu vực</option>{regions.map(value => <option key={value}>{value}</option>)}</select><button className="pd-button pd-button-green" type="submit">Tìm kiếm <ArrowRight size={17}/></button></form><details className="pd-extra-filters"><summary><SlidersHorizontal size={16}/>Bộ lọc</summary><div className="pd-filter-bar"><select aria-label="Loại hình" value={category} onChange={e => {setCategory(e.target.value); setLimit(9);}}><option value="all">Tất cả loại hình</option><option value="low">Thấp tầng</option><option value="high">Cao tầng</option></select><select aria-label="Chủ đầu tư" value={developer} onChange={e => {setDeveloper(e.target.value); setLimit(9);}}><option value="all">Tất cả chủ đầu tư</option>{Array.from(new Set(projects.map(p => p.developer).filter(Boolean))).map(value => <option key={value}>{value}</option>)}</select><select aria-label="Trạng thái" value={status} onChange={e => {setStatus(e.target.value); setLimit(9);}}><option value="all">Tất cả trạng thái</option>{Array.from(new Set(projects.map(p => p.status).filter(Boolean))).map(value => <option key={value}>{value}</option>)}</select><select aria-label="Bộ sưu tập dự án" value={collection} onChange={e => {setCollection(e.target.value); setLimit(9);}}><option value="all">Tất cả dự án</option><option value="hot">Dự án nổi bật</option><option value="favorite">Đã yêu thích</option><option value="new">Mới cập nhật</option></select><button className="pd-reset" onClick={reset}><RotateCcw size={15}/>Đặt lại</button></div>
</details></section>
    <section className="pd-catalog pd-container" id="danh-sach-du-an" aria-labelledby="pd-list-title">
      <h2 id="pd-list-title">Danh sách dự án</h2>
      <div className="pd-regions" role="group" aria-label="Lọc theo khu vực">{['all', ...regions].map(value => <button key={value} aria-pressed={region === value} onClick={() => {setRegion(value); setDraftRegion(value); setLimit(9);}}>{value === 'all' ? 'Tất cả' : value} ({value === 'all' ? projects.length : projects.filter(p => p.region === value).length})</button>)}</div>
      <p className="pd-result-count" role="status">Hiển thị {Math.min(limit, results.length)} / {results.length} dự án</p>
      <div className="pd-grid">{results.slice(0, limit).map(p => <article className="pd-card" key={p.id}>
        <div className="pd-card-media"><Link href={projectPath(p.id)} aria-label={`Xem dự án ${p.name}`}><ProjectImage src={p.image} name={p.name}/></Link><button className="pd-heart" aria-label={`Yêu thích ${p.name}`} aria-pressed={favorites.has(p.id)} onClick={() => onFavorite(p.id)}><Heart size={18} fill={favorites.has(p.id) ? 'currentColor' : 'none'}/></button></div>
        <div className="pd-card-body"><h3><Link href={projectPath(p.id)}>{p.name}</Link></h3><p className="pd-location"><MapPin size={15}/>{p.location}</p><p className="pd-description">{p.description}</p><ProjectFacts project={p}/><div className="pd-card-bottom"><Link className="pd-inventory-count" href={projectPath(p.id, 'inventory')}><span className="pd-count-value"><b>{format(counts.get(p.id) || 0)}</b><span>CĂN</span></span><span className="pd-count-caption">Xem quỹ căn <ArrowRight size={16}/></span></Link><Link className="pd-card-arrow" href={projectPath(p.id)} aria-label={`Chi tiết ${p.name}`}><ArrowUpRight size={20}/></Link></div></div>
      </article>)}</div>
      {!results.length && <div className="pd-empty"><Search size={32}/><h3>Chưa có dự án phù hợp</h3><p>Thử thay đổi từ khóa, khu vực hoặc các bộ lọc.</p><button className="pd-button pd-button-light" onClick={reset}>Xem tất cả dự án <ArrowRight size={17}/></button></div>}
      {limit < results.length && <button className="pd-button pd-more" onClick={() => setLimit(value => value + 9)}>Xem thêm dự án <ChevronRight size={18}/></button>}
    </section>
    <section className="pd-process-wrap"><div className="pd-process pd-container"><div><h2>Từ dự án đến<br/>căn nhà bạn tìm kiếm</h2><ol><li><span>01</span><div><h3>Chọn dự án</h3><p>Tìm theo tên và khu vực bạn quan tâm.</p></div></li><li><span>02</span><div><h3>Khám phá quỹ căn</h3><p>Xem mã căn, vị trí, diện tích và thông tin trên hệ thống.</p></div></li><li><span>03</span><div><h3>Đăng ký tư vấn</h3><p>Trao đổi nhu cầu và xác nhận thông tin căn với đội ngũ tư vấn.</p></div></li></ol><a className="pd-button pd-button-green" href="#pd-tu-van">Liên hệ tư vấn <ArrowRight size={17}/></a></div>{active && <div className="pd-process-image"><ProjectImage src={active.image} name={active.name}/></div>}</div></section>
    <section className="pd-types pd-container" aria-labelledby="pd-types-title"><h2 id="pd-types-title">Đa dạng loại hình</h2><div className="pd-type-grid">{[{id:'low',name:'Dự án thấp tầng'},{id:'high',name:'Dự án cao tầng'}].map(type => {const items = projects.filter(p => p.category === type.id); return <article key={type.id}><div className="pd-type-image">{items[0] ? <ProjectImage src={items[0].image} name={type.name}/> : <div className="pd-image-fallback"><Building2 size={40}/></div>}</div><h3>{type.name}</h3><p>{format(items.length)} dự án · {format(units.filter(u => items.some(p => p.id === u.projectId)).length)} căn trên hệ thống</p><a href="#danh-sach-du-an" className="pd-button" onClick={() => {reset();setCategory(type.id);}}>Khám phá quỹ căn <ArrowRight size={16}/></a></article>})}</div></section>
    <section className="pd-news-wrap"><div className="pd-news pd-container"><div><span className="pd-kicker">ALPHA HUB</span><h2>Cẩm nang & tin tức</h2><p>Khám phá thông tin dự án và hướng dẫn tra cứu quỹ căn trên website.</p><Link className="pd-button pd-button-green" href="/tin-tuc">Khám phá ngay <ArrowRight size={17}/></Link></div><div className="pd-news-links"><Link href="/quy-hang"><Building2 size={24}/><span>Tra cứu quỹ căn<small>Tìm và xem thông tin căn trên hệ thống</small></span><ArrowUpRight size={20}/></Link><Link href="/huong-dan"><Search size={24}/><span>Hướng dẫn sử dụng<small>Tìm hiểu cách tra cứu dự án và bảng hàng</small></span><ArrowUpRight size={20}/></Link></div></div></section>
    <section className="pd-consult pd-container" id="pd-tu-van" aria-labelledby="pd-consult-title"><div><span className="pd-kicker">ĐỒNG HÀNH CÙNG ALPHA HUB</span><h2 id="pd-consult-title">Tìm dự án phù hợp<br/>với bạn.</h2><p>Để lại thông tin để được tư vấn dự án và quỹ căn bạn quan tâm.</p><Link className="pd-text-link" href="/tin-tuc">Khám phá tin tức & kiến thức <ArrowUpRight size={17}/></Link></div><div className="pd-consult-form"><h3>Đăng ký tư vấn</h3><ContactForm note="Đăng ký tư vấn từ trang danh sách dự án"/></div></section>
    </div><aside className={`pd-sidebar ${pastHero ? 'is-visible' : ''}`} aria-label="Tìm kiếm và tư vấn dự án" inert={!pastHero}>
      <form className="nm-panel pd-sidebar-search" role="search" onSubmit={e => {e.preventDefault();setDraftQuery(query);setLimit(9);document.getElementById('danh-sach-du-an')?.scrollIntoView({behavior: reducedMotion ? 'instant' : 'smooth'});}}><h2>Tìm kiếm</h2><label className="nm-search"><Search size={17}/><input type="search" aria-label="Tìm kiếm dự án bên phải" placeholder="Nhập tên dự án, địa điểm" value={query} onChange={e => {setQuery(e.target.value);setDraftQuery(e.target.value);setLimit(9);}}/></label></form>
      <LeadPanel projects={projects} source="Trang dự án"/>
    </aside></div>
  </main>;
}
