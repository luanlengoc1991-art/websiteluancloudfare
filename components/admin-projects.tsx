'use client';

import {useMemo, useState} from 'react';
import {ArrowUpRight, Building2, Flame, House, MapPin, Pencil, Plus, Search, X} from 'lucide-react';
import Link from './site-link';
import {projectPath} from '@/lib/project-routes';
import type {Project} from '@/lib/catalog';

type Props = {projects: Project[]; onCreate: () => void; onEdit: (project: Project) => void};
const normalize = (text: string) => text.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

function ProjectPhoto({project}: {project: Project}) {
  const [failed, setFailed] = useState(false);
  return project.image && !failed
    ? <img src={project.image} alt={project.name} loading="lazy" onError={() => setFailed(true)}/>
    : <div className="ap-photo-fallback"><Building2 size={40}/><span>{project.name}</span></div>;
}

export default function AdminProjects({projects, onCreate, onEdit}: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');
  const regions = [...new Set(projects.map(p => p.region).filter(Boolean))];
  const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))];
  const counts = useMemo(() => ({all: projects.length, low: projects.filter(p => p.category === 'low').length, high: projects.filter(p => p.category === 'high').length, hot: projects.filter(p => p.hot).length}), [projects]);
  const filtered = projects.filter(p => normalize(`${p.name} ${p.location} ${p.developer}`).includes(normalize(query.trim())) && (category === 'all' || (category === 'hot' ? p.hot : p.category === category)) && (region === 'all' || p.region === region) && (status === 'all' || p.status === status));
  const hasFilters = !!query || category !== 'all' || region !== 'all' || status !== 'all';
  const reset = () => {setQuery(''); setCategory('all'); setRegion('all'); setStatus('all');};
  const tabs = [{id: 'all', label: 'Tất cả dự án'}, {id: 'low', label: 'Thấp tầng'}, {id: 'high', label: 'Cao tầng'}, {id: 'hot', label: 'Nổi bật'}] as const;

  return <div className="ap-workspace">
    <div className="ap-intro"><p>Quản lý danh mục, hình ảnh và thông tin dự án<br className="ap-desktop-break"/> trong một không gian thống nhất.</p><button className="ap-primary" onClick={onCreate}><Plus size={18}/>Thêm dự án</button></div>
    <div className="ap-metrics" aria-label="Thống kê danh mục dự án">
      {[{label: 'Tổng dự án', value: counts.all, Icon: Building2}, {label: 'Dự án thấp tầng', value: counts.low, Icon: House}, {label: 'Dự án cao tầng', value: counts.high, Icon: Building2}, {label: 'Dự án nổi bật', value: counts.hot, Icon: Flame}].map(({label, value, Icon}) => <div className="ap-metric" key={label}><div><span>{label}</span><strong>{value.toLocaleString('vi-VN')}</strong></div><span className="ap-metric-icon"><Icon size={22} strokeWidth={1.5}/></span></div>)}
    </div>
    <section className="ap-catalog" aria-label="Danh mục dự án">
      <div className="ap-catalog-heading"><div><span className="ap-kicker">DANH MỤC ĐẦU TƯ</span><h2>Không gian dự án</h2></div><Link href="/du-an" className="ap-public-link">Xem trang dự án<ArrowUpRight size={17}/></Link></div>
      <div className="ap-filter-panel">
        <div className="ap-tabs" aria-label="Lọc loại dự án">{tabs.map(tab => <button key={tab.id} aria-pressed={category === tab.id} onClick={() => setCategory(tab.id)}>{tab.label}<span>{counts[tab.id]}</span></button>)}</div>
        <div className="ap-filters"><label className="ap-search"><Search size={19}/><input type="search" aria-label="Tìm dự án, khu vực, chủ đầu tư" placeholder="Tìm dự án, khu vực, chủ đầu tư…" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="Lọc khu vực" value={region} onChange={e => setRegion(e.target.value)}><option value="all">Tất cả khu vực</option>{regions.map(value => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Lọc trạng thái" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Tất cả trạng thái</option>{statuses.map(value => <option key={value} value={value}>{value}</option>)}</select></div>
      </div>
      <div className="ap-results"><p role="status">Hiển thị <strong>{filtered.length}</strong> / {projects.length} dự án</p>{hasFilters && <button onClick={reset}><X size={14}/>Xóa bộ lọc</button>}</div>
      <div className="ap-grid">{filtered.map(project => <article className="ap-card" key={project.id}>
        <div className="ap-photo"><Link href={projectPath(project.id)} aria-label={`Xem ${project.name}`}><ProjectPhoto key={project.image} project={project}/></Link><span className="ap-category">{project.category === 'low' ? 'THẤP TẦNG' : project.category === 'high' ? 'CAO TẦNG' : project.category}</span>{project.hot && <span className="ap-featured"><Flame size={13}/>Nổi bật</span>}</div>
        <div className="ap-card-body"><div className="ap-card-meta"><span>{project.developer}</span><span className="ap-status">{project.status}</span></div><h3><Link href={projectPath(project.id)}>{project.name}</Link></h3><p className="ap-location"><MapPin size={15}/>{project.location}</p><div className="ap-card-actions"><button onClick={() => onEdit(project)} aria-label={`Chỉnh sửa ${project.name}`}><Pencil size={15}/>Chỉnh sửa</button><Link href={projectPath(project.id)}>Xem dự án<ArrowUpRight size={16}/></Link></div></div>
      </article>)}</div>
      {!filtered.length && <div className="ap-empty"><Search size={32}/><h3>{projects.length ? 'Không tìm thấy dự án' : 'Chưa có dự án'}</h3><p>{projects.length ? 'Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh mục.' : 'Thêm dự án đầu tiên để bắt đầu quản lý danh mục.'}</p><button className="ap-primary" onClick={projects.length ? reset : onCreate}>{projects.length ? 'Xóa bộ lọc' : 'Thêm dự án'}</button></div>}
    </section>
  </div>;
}
