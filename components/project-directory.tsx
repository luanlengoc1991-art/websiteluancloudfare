'use client';

import {useMemo, useState} from 'react';
import Image from 'next/image';
import {ArrowRight, ArrowUpRight, Building2, ChevronLeft, ChevronRight, Heart, MapPin, RotateCcw, Search, SlidersHorizontal} from 'lucide-react';
import Link from './site-link';
import ContactForm from './contact-form';
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

export default function ProjectDirectory({projects, units, favorites, onFavorite}: Props) {
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');
  const [category, setCategory] = useState('all');
  const [developer, setDeveloper] = useState('all');
  const [status, setStatus] = useState('all');
  const [collection, setCollection] = useState('all');
  const [limit, setLimit] = useState(9);
  const featured = projects.some(p => p.hot) ? projects.filter(p => p.hot) : projects;
  const activeIndex = Math.max(0, featured.findIndex(p => p.id === selectedId));
  const active = featured[activeIndex];
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const unit of units) result.set(unit.projectId, (result.get(unit.projectId) || 0) + 1);
    return result;
  }, [units]);
  const regions = Array.from(new Set(projects.map(p => p.region).filter(Boolean)));
  const filtered = projects.filter(p => normalize(p.name + ' ' + p.location).includes(normalize(query)) &&
    (region === 'all' || p.region === region) && (category === 'all' || p.category === category) &&
    (developer === 'all' || p.developer === developer) && (status === 'all' || p.status === status) &&
    (collection !== 'hot' || p.hot) && (collection !== 'favorite' || favorites.has(p.id)));
  const results = collection === 'new' ? [...filtered].reverse() : filtered;
  function reset() {setQuery(''); setRegion('all'); setCategory('all'); setDeveloper('all'); setStatus('all'); setCollection('all'); setLimit(9);}
  function move(direction: number) {if (!featured.length) return; setSelectedId(featured[(activeIndex + direction + featured.length) % featured.length].id);}

  return <main className="pd">
    {active && <div className="pd-ambient" aria-hidden="true"><ProjectImage src={active.image} name=""/></div>}
    {!active && <header className="pd-heading pd-container"><span className="pd-kicker">ALPHA HUB</span><h1>Khám phá dự án</h1><p>Tìm không gian sống dành cho bạn.</p></header>}
    {active && <section className="pd-hero pd-container" aria-label="Dự án nổi bật">
      <div className="pd-hero-image"><ProjectImage src={active.image} name={active.name} priority/></div>
      <div className="pd-hero-shade"/>
      <div className="pd-feature-panel">
        <h1>{active.name}</h1>
        <p className="pd-location"><MapPin size={17}/>{active.location}</p>
        <div className="pd-feature-count"><b>{format(counts.get(active.id) || 0)}</b><span>CĂN</span></div>
        <Link className="pd-button pd-button-light" href={projectPath(active.id, 'inventory')}>Xem quỹ căn <ArrowRight size={18}/></Link>
      </div>
      <div className="pd-hero-controls"><span><b>{String(activeIndex + 1).padStart(2, '0')}</b> / {String(featured.length).padStart(2, '0')}</span><button aria-label="Dự án trước" disabled={featured.length < 2} onClick={() => move(-1)}><ChevronLeft size={21}/></button><button aria-label="Dự án tiếp theo" disabled={featured.length < 2} onClick={() => move(1)}><ChevronRight size={21}/></button></div>
    </section>}
    <section className="pd-catalog pd-container" id="danh-sach-du-an" aria-labelledby="pd-list-title">
      <div className="pd-catalog-heading"><div><span className="pd-kicker">TÌM KHÔNG GIAN DÀNH CHO BẠN</span><h2 id="pd-list-title">Danh sách dự án</h2></div><label className="pd-search"><Search size={19}/><input type="search" placeholder="Nhập tên dự án, địa điểm…" aria-label="Tìm dự án" value={query} onChange={e => {setQuery(e.target.value); setLimit(9);}}/></label></div>
      <div className="pd-search-tools"><select aria-label="Khu vực" value={region} onChange={e => {setRegion(e.target.value); setLimit(9);}}><option value="all">Tất cả khu vực</option>{regions.map(value => <option key={value}>{value}</option>)}</select><details className="pd-extra-filters"><summary><SlidersHorizontal size={16}/>Bộ lọc</summary><div className="pd-filter-bar"><select aria-label="Loại hình" value={category} onChange={e => {setCategory(e.target.value); setLimit(9);}}><option value="all">Tất cả loại hình</option><option value="low">Thấp tầng</option><option value="high">Cao tầng</option></select><select aria-label="Chủ đầu tư" value={developer} onChange={e => {setDeveloper(e.target.value); setLimit(9);}}><option value="all">Tất cả chủ đầu tư</option>{Array.from(new Set(projects.map(p => p.developer).filter(Boolean))).map(value => <option key={value}>{value}</option>)}</select><select aria-label="Trạng thái" value={status} onChange={e => {setStatus(e.target.value); setLimit(9);}}><option value="all">Tất cả trạng thái</option>{Array.from(new Set(projects.map(p => p.status).filter(Boolean))).map(value => <option key={value}>{value}</option>)}</select><select aria-label="Bộ sưu tập dự án" value={collection} onChange={e => {setCollection(e.target.value); setLimit(9);}}><option value="all">Tất cả dự án</option><option value="hot">Dự án nổi bật</option><option value="favorite">Đã yêu thích</option><option value="new">Mới cập nhật</option></select><button className="pd-reset" onClick={reset}><RotateCcw size={15}/>Đặt lại</button></div>
</details></div>
      <p className="pd-result-count" role="status">Hiển thị {Math.min(limit, results.length)} / {results.length} dự án</p>
      <div className="pd-grid">{results.slice(0, limit).map(p => <article className="pd-card" key={p.id}>
        <div className="pd-card-media"><Link href={projectPath(p.id)} aria-label={`Xem dự án ${p.name}`}><ProjectImage src={p.image} name={p.name}/></Link><button className="pd-heart" aria-label={`Yêu thích ${p.name}`} aria-pressed={favorites.has(p.id)} onClick={() => onFavorite(p.id)}><Heart size={18} fill={favorites.has(p.id) ? 'currentColor' : 'none'}/></button></div>
        <div className="pd-card-body"><h3><Link href={projectPath(p.id)}>{p.name}</Link></h3><p className="pd-location"><MapPin size={15}/>{p.location}</p><div className="pd-card-bottom"><Link className="pd-inventory-count" href={projectPath(p.id, 'inventory')}><span className="pd-count-value"><b>{format(counts.get(p.id) || 0)}</b><span>CĂN</span></span><span className="pd-count-caption">Xem quỹ căn <ArrowRight size={16}/></span></Link><Link className="pd-card-arrow" href={projectPath(p.id)} aria-label={`Chi tiết ${p.name}`}><ArrowUpRight size={20}/></Link></div></div>
      </article>)}</div>
      {!results.length && <div className="pd-empty"><Search size={32}/><h3>Chưa có dự án phù hợp</h3><p>Thử thay đổi từ khóa, khu vực hoặc các bộ lọc.</p><button className="pd-button pd-button-light" onClick={reset}>Xem tất cả dự án <ArrowRight size={17}/></button></div>}
      {limit < results.length && <button className="pd-button pd-more" onClick={() => setLimit(value => value + 9)}>Xem thêm dự án <ChevronRight size={18}/></button>}
    </section>
    <section className="pd-panorama" aria-label="Khám phá dự án">{featured.slice(0, 2).map((p, index) => <article className={`pd-band ${index % 2 ? 'pd-band-reverse' : ''}`} key={p.id}>
      <div className="pd-band-image"><ProjectImage src={p.image} name={p.name}/></div><div className="pd-band-shade"/>
      <div className="pd-band-content pd-container"><div><h2>{p.name}</h2><p className="pd-location"><MapPin size={16}/>{p.location}</p><Link className="pd-button" href={projectPath(p.id)}>Khám phá dự án <ArrowRight size={16}/></Link></div><Link className="pd-band-count" href={projectPath(p.id, 'inventory')}><b>{format(counts.get(p.id) || 0)}</b><span>CĂN</span><small>Xem quỹ căn <ArrowRight size={14}/></small></Link></div>
    </article>)}</section>
    <section className="pd-consult pd-container" aria-labelledby="pd-consult-title"><div><span className="pd-kicker">ĐỒNG HÀNH CÙNG ALPHA HUB</span><h2 id="pd-consult-title">Tìm dự án phù hợp<br/>với bạn.</h2><p>Để lại thông tin để được tư vấn dự án và quỹ căn bạn quan tâm.</p><Link className="pd-text-link" href="/tin-tuc">Khám phá tin tức & kiến thức <ArrowUpRight size={17}/></Link></div><div className="pd-consult-form"><h3>Đăng ký tư vấn</h3><ContactForm note="Đăng ký tư vấn từ trang danh sách dự án"/></div></section>
  </main>;
}
