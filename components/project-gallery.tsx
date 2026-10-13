'use client';
/* Nhà mẫu / Tiện ích / Thư viện of a project, laid out like market.vinhomes.vn/thu-vien-nha-dep: glass tab bar with a
 * call-to-action, filter row (project, sort, search), staggered 4-column card grid with "Xem thêm ảnh", and a viewer
 * (large slider + info, matching units, more photos). Images come from the project's library (Asset kind). */
import {useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import Link from './site-link';
import {ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Expand, Heart, House, Images, LayoutGrid, Phone, Search, Sparkles, Waves, X} from 'lucide-react';
import {projectPath, unitPlanPath} from '@/lib/project-routes';
import {sized} from '@/lib/img';
import {SAIGON_PARK, saigonParkModelImage} from '@/lib/saigon-park-models';
import {usePublicContact} from './public-contact-provider';
import type {Asset, Project, Unit} from '@/lib/catalog';

export type GalleryTab = 'model' | 'amenity' | 'gallery';
const TABS: {id: 'all' | GalleryTab; label: string; Icon: typeof House}[] = [
  {id: 'all', label: 'Khám phá', Icon: Sparkles},
  {id: 'model', label: 'Nhà mẫu', Icon: House},
  {id: 'amenity', label: 'Tiện ích', Icon: Waves},
  {id: 'gallery', label: 'Thư viện', Icon: Images},
];
const LABEL: Record<GalleryTab, string> = {model: 'Nhà mẫu', amenity: 'Tiện ích', gallery: 'Thư viện'};
const PAGE = 12;
type Photo = Asset & {kind: GalleryTab; title: string};
const titleOf = (name: string) => name.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').trim();
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});

function useColumns() {
  const [n, setN] = useState(4);
  useEffect(() => {
    const fit = () => setN(window.innerWidth < 640 ? 1 : window.innerWidth < 980 ? 2 : window.innerWidth < 1280 ? 3 : 4);
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, []);
  return n;
}
function useFavorites() {
  const [fav, setFav] = useState<Set<string>>(new Set());
  useEffect(() => {try {setFav(new Set(JSON.parse(localStorage.getItem('pg-fav') || '[]')));} catch {}}, []);
  const toggle = (id: string) => setFav(prev => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id);
    try {localStorage.setItem('pg-fav', JSON.stringify([...next]));} catch {}
    return next;
  });
  return [fav, toggle] as const;
}

export default function ProjectGallery({tab, onTab, project, projects, assets, allAssets, units, statusOf, canManage}: {
  tab: GalleryTab; onTab: (t: GalleryTab) => void; project: Project; projects: Project[]; assets: Asset[]; allAssets: Asset[]; units: Unit[]; statusOf: (u: Unit) => string; canManage?: boolean;
}) {
  const contact = usePublicContact();
  const cols = useColumns();
  const [fav, toggleFav] = useFavorites();
  const [view, setView] = useState<'all' | GalleryTab>(tab);
  const [q, setQ] = useState(''), [sort, setSort] = useState('default'), [shown, setShown] = useState(PAGE), [open, setOpen] = useState<number | null>(null);
  useEffect(() => {setView(tab); setShown(PAGE);}, [tab]);

  const photos = useMemo<Photo[]>(() => {
    const list = assets.filter((a): a is Asset & {kind: GalleryTab} => a.kind === 'model' || a.kind === 'amenity' || a.kind === 'gallery').map(a => ({...a, title: titleOf(a.name)}));
    if (project.image) list.unshift({id: 'cover', projectId: project.id, kind: 'gallery', name: 'Phối cảnh tổng thể', url: project.image, title: 'Phối cảnh tổng thể'});
    return list.sort((a, b) => a.title.localeCompare(b.title, 'vi', {numeric: true}));
  }, [assets, project]);
  const count = (k: 'all' | GalleryTab) => k === 'all' ? photos.length : photos.filter(p => p.kind === k).length;
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const items = photos.filter(p => (view === 'all' || p.kind === view) && (!term || p.title.toLowerCase().includes(term)) && (sort !== 'saved' || fav.has(p.id)));
    if (sort === 'za') items.reverse();
    return items;
  }, [photos, view, q, sort, fav]);
  // Promo card sits in the first column, third row (as on the reference page) and takes one slot of the page,
  // so every page fills whole rows.
  const promo = list.length >= 6, visible = list.slice(0, promo ? shown - 1 : shown);
  const cells: (Photo | 'promo')[] = [...visible]; if (promo) cells.splice(Math.min(cols * 2, visible.length), 0, 'promo');
  const columns = Array.from({length: cols}, (_, c) => cells.filter((_, i) => i % cols === c));
  const mediaProjects = projects.filter(p => p.id === project.id || allAssets.some(a => a.projectId === p.id && ['model', 'amenity', 'gallery'].includes(a.kind)));
  const pickTab = (id: 'all' | GalleryTab) => {
    setView(id); setShown(PAGE);
    if (id !== 'all' && id !== tab) onTab(id);
  };

  return <section className="pg">
    <div className="pg-bar">
      <nav className="pg-tabs" aria-label="Nhóm hình ảnh">
        {TABS.map(({id, label, Icon}) => <button key={id} type="button" className={view === id ? 'is-on' : ''} onClick={() => pickTab(id)} aria-pressed={view === id}>
          <Icon size={18} aria-hidden/><span>{label}</span><small>{count(id)}</small>
        </button>)}
      </nav>
      <Link className="pg-cta" href={projectPath(project.id, 'inventory')}>Xem bảng hàng <ArrowRight size={18}/></Link>
    </div>
    <div className="pg-filters">
      <label className="pg-select"><span className="sr-only">Dự án</span>
        <select value={project.id} onChange={e => window.location.assign(projectPath(e.target.value, view === 'all' ? tab : view))}>
          {mediaProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select><ChevronDown size={18} aria-hidden/>
      </label>
      <label className="pg-select"><span className="sr-only">Sắp xếp</span>
        <select value={sort} onChange={e => {setSort(e.target.value); setShown(PAGE);}}>
          <option value="default">Sắp xếp: Mặc định</option>
          <option value="za">Sắp xếp: Z → A</option>
          <option value="saved">Ảnh đã yêu thích</option>
        </select><ChevronDown size={18} aria-hidden/>
      </label>
      <label className="pg-search"><Search size={20} aria-hidden/><input type="search" value={q} onChange={e => {setQ(e.target.value); setShown(PAGE);}} placeholder="Tìm kiếm hình ảnh" aria-label="Tìm kiếm hình ảnh"/></label>
    </div>

    {list.length ? <div className="pg-grid">{columns.map((column, c) => <div className="pg-col" key={c}>{column.map(cell => cell === 'promo'
      ? <div className="pg-promo" key="promo"><h3>Bấm yêu thích để lưu ảnh vào bộ sưu tập</h3><p>{project.name}</p><a href={`tel:${contact.phone.replace(/\s/g, '')}`}>Nhận tư vấn {contact.phone} <ArrowRight size={16}/></a></div>
      : <article className="pg-card" key={cell.id}>
        <button type="button" className="pg-open" onClick={() => setOpen(list.indexOf(cell))} aria-label={`Xem ảnh ${cell.title}`}>
          <span className="pg-img"><img src={sized(cell.url, 720)} alt={cell.title} loading="lazy" decoding="async"/><em>{LABEL[cell.kind]}</em></span>
          <span className="pg-meta"><strong>{cell.title}</strong><small>{project.name} · {LABEL[cell.kind]}</small></span>
        </button>
        <button type="button" className={'pg-heart' + (fav.has(cell.id) ? ' is-on' : '')} onClick={() => toggleFav(cell.id)} aria-pressed={fav.has(cell.id)} aria-label={`Yêu thích ${cell.title}`}><Heart size={20} fill={fav.has(cell.id) ? 'currentColor' : 'none'}/></button>
      </article>)}</div>)}</div>
      : <div className="pg-empty"><LayoutGrid size={30}/><h3>{sort === 'saved' ? 'Chưa có ảnh yêu thích' : 'Chưa có hình ảnh'}</h3><p>{sort === 'saved' ? 'Bấm biểu tượng trái tim trên ảnh để lưu vào bộ sưu tập.' : `Hình ảnh ${view === 'all' ? '' : LABEL[view].toLowerCase() + ' '}của ${project.name} đang được cập nhật.`}</p>{canManage && <Link className="pg-more" href={`/admin/thu-vien?project=${encodeURIComponent(project.id)}`}>Mở thư viện quản trị</Link>}</div>}
    {visible.length < list.length && <button type="button" className="pg-more" onClick={() => setShown(s => s + PAGE)}>Xem thêm ảnh</button>}

    {open !== null && list[open] && <Viewer photos={list} index={open} onIndex={setOpen} onClose={() => setOpen(null)} project={project} units={units} statusOf={statusOf} fav={fav} toggleFav={toggleFav} phone={contact.phone}/>}
  </section>;
}

function Viewer({photos, index, onIndex, onClose, project, units, statusOf, fav, toggleFav, phone}: {
  photos: Photo[]; index: number; onIndex: (i: number) => void; onClose: () => void; project: Project; units: Unit[]; statusOf: (u: Unit) => string; fav: Set<string>; toggleFav: (id: string) => void; phone: string;
}) {
  const p = photos[index], go = (d: number) => onIndex((index + d + photos.length) % photos.length);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1);};
    document.addEventListener('keydown', key); const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => {document.removeEventListener('keydown', key); document.body.style.overflow = prev;};
  });
  // Units of the house model shown in the photo first (e.g. "… – CH-53"), then the cheapest available ones.
  const sameModel = (u: Unit) => !!u.model && p.title.toUpperCase().includes(u.model.toUpperCase());
  const matching = units.filter(u => statusOf(u) === 'Còn hàng').sort((a, b) => Number(sameModel(b)) - Number(sameModel(a)) || a.price - b.price).slice(0, 4);
  const unitImage = (u: Unit) => u.posterUrl || (project.id === SAIGON_PARK ? saigonParkModelImage(u.model) : '') || u.layoutUrl || project.image;
  const more = photos.filter(x => x.id !== p.id && x.kind === p.kind).slice(0, 8);
  const full = () => {const el = document.querySelector('.pgv-stage'); if (el && !document.fullscreenElement) el.requestFullscreen?.().catch(() => undefined); else document.exitFullscreen?.().catch(() => undefined);};
  // Rendered on <body>: inside the workspace panel the page's floating buttons would sit on top of it.
  return createPortal(<div className="pgv" role="dialog" aria-modal="true" aria-label={p.title}>
    <div className="pgv-inner">
      <button type="button" className="pgv-back" onClick={onClose}><ChevronLeft size={18}/> Về {LABEL[p.kind].toLowerCase()} {project.name}</button>
      <button type="button" className="pgv-close" onClick={onClose} aria-label="Đóng"><X size={22}/></button>
      <div className="pgv-main">
        <div className="pgv-stage">
          <img key={p.id} src={sized(p.url, 1920)} alt={p.title}/>
          {photos.length > 1 && <><button type="button" className="pgv-nav is-prev" onClick={() => go(-1)} aria-label="Ảnh trước"><ChevronLeft size={22}/></button>
            <button type="button" className="pgv-nav is-next" onClick={() => go(1)} aria-label="Ảnh sau"><ChevronRight size={22}/></button></>}
          <button type="button" className="pgv-full" onClick={full} aria-label="Toàn màn hình"><Expand size={18}/></button>
          <span className="pgv-count">{index + 1} / {photos.length}</span>
        </div>
        <aside className="pgv-info">
          <p className="pgv-crumb">{project.name} / {LABEL[p.kind]}</p>
          <div className="pgv-chips"><span className="is-main">{LABEL[p.kind]}</span><span>{project.name}</span>{project.location && <span>{project.location}</span>}</div>
          <h2>{p.title}</h2>
          <p className="pgv-desc">{p.kind === 'model' ? `Hình ảnh nhà mẫu "${p.title}" thuộc dự án ${project.name}. Liên hệ để nhận layout, giá và chính sách của căn tương tự.` : p.kind === 'amenity' ? `Tiện ích "${p.title}" trong quần thể ${project.name}.` : `Hình ảnh "${p.title}" của dự án ${project.name}.`}</p>
          <div className="pgv-actions">
            <button type="button" className={'pgv-like' + (fav.has(p.id) ? ' is-on' : '')} onClick={() => toggleFav(p.id)}>{fav.has(p.id) ? 'Đã yêu thích' : 'Yêu thích'} <Heart size={18} fill={fav.has(p.id) ? 'currentColor' : 'none'}/></button>
            <a className="pgv-call" href={`tel:${phone.replace(/\s/g, '')}`}><Phone size={17}/> {phone}</a>
          </div>
          {photos.length > 1 && <div className="pgv-thumbs">{photos.slice(Math.max(0, Math.min(index - 3, photos.length - 8)), Math.max(0, Math.min(index - 3, photos.length - 8)) + 8).map(x => <button type="button" key={x.id} className={x.id === p.id ? 'is-on' : ''} onClick={() => onIndex(photos.indexOf(x))}><img src={sized(x.url, 240)} alt="" loading="lazy"/></button>)}</div>}
        </aside>
      </div>
      {matching.length > 0 && <section className="pgv-section"><h3>Một số căn phù hợp với phong cách này</h3><div className="pgv-units">{matching.map(u => <Link key={u.id} href={unitPlanPath(u)} className="pgv-unit">
        <span className="pgv-unit-tag">{statusOf(u) === 'Còn hàng' ? 'Đang bán' : statusOf(u)}</span>
        <span className="pgv-unit-img"><img src={sized(unitImage(u), 480)} alt="" loading="lazy"/></span>
        <span className="pgv-unit-body"><small>{project.name}</small><strong>{u.code}, {u.type}</strong><em>{u.zone} · {u.direction} · {fmt(u.area)} m²</em><b>{fmt(u.price)} <i>tỷ</i></b></span>
      </Link>)}</div></section>}
      {more.length > 0 && <section className="pgv-section"><h3>Có thể Quý khách cũng thích</h3><div className="pgv-more">{more.map(x => <button type="button" key={x.id} onClick={() => onIndex(photos.indexOf(x))}><img src={sized(x.url, 480)} alt="" loading="lazy"/><span>{x.title}</span></button>)}</div></section>}
    </div>
  </div>, document.body);
}
