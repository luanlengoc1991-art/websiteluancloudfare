'use client';

import {useState} from 'react';
import {ArrowDown, ArrowUpRight, MapPin} from 'lucide-react';
import Link from './site-link';
import type {Project, Unit} from '@/lib/catalog';
import {projectPath} from '@/lib/project-routes';

export function InventoryMarketHero({projects, units}:{projects:Project[];units:Unit[]}) {
  const featured = projects.filter(p=>p.hot);
  const choices = featured.length ? featured.slice(0,4) : projects.slice(0,4);
  const [selected, setSelected] = useState('');
  const current = choices.find(p=>p.id===selected) || choices[0];
  return <section className="market-hero" aria-label="Khám phá quỹ căn">
    {current && <img key={current.id} className="market-hero-image" src={current.image} alt={`Phối cảnh ${current.name}`} fetchPriority="high"/>}
    <div className="market-hero-shade"/>
    <div className="market-hero-copy">
      <span className="market-kicker">ALPHA HUB · QUỸ CĂN & DỰ ÁN</span>
      <h1>Chọn không gian sống<br/><em>cho hành trình của bạn</em></h1>
      <p>Khám phá dự án, tìm căn phù hợp và kết nối với tổ ấm tương lai.</p>
      <a className="market-search-link" href="#tim-quy-can">Tìm kiếm quỹ căn <ArrowDown size={18}/></a>
    </div>
    {current && <div className="market-hero-bottom">
      <div className="market-hero-project"><span>DỰ ÁN NỔI BẬT</span><h2>{current.name}</h2><p><MapPin size={15}/>{current.location}</p><Link href={projectPath(current.id,'inventory')}>Khám phá <ArrowUpRight size={17}/></Link></div>
      <div className="market-hero-count"><strong>{units.filter(u=>u.projectId===current.id).length.toLocaleString('vi-VN')}</strong><span>căn trong dự án</span></div>
      <div className="market-hero-switch" aria-label="Chọn dự án nổi bật">{choices.map((p,i)=><button type="button" key={p.id} aria-label={p.name} aria-pressed={p.id===current.id} onClick={()=>setSelected(p.id)}><span>{String(i+1).padStart(2,'0')}</span></button>)}</div>
    </div>}
  </section>;
}

export function InventoryMarketProjects({projects,units}:{projects:Project[];units:Unit[]}) {
  return <section className="market-projects container">
    <div className="market-section-heading"><div><span className="eyebrow">DANH MỤC DỰ ÁN</span><h2>Khám phá nơi bạn muốn sống</h2></div><Link href="/du-an">Xem tất cả dự án <ArrowUpRight size={18}/></Link></div>
    <div className="market-project-grid">{projects.filter(p=>p.hot).slice(0,3).map(p=><Link key={p.id} className="market-project" href={projectPath(p.id,'inventory')}>
      <img src={p.image} alt={`Phối cảnh ${p.name}`} loading="lazy"/>
      <div className="market-project-copy"><div className="market-project-count"><strong>{units.filter(u=>u.projectId===p.id).length.toLocaleString('vi-VN')}</strong><span>căn</span><ArrowUpRight size={23}/></div><h3>{p.name}</h3><p><MapPin size={14}/>{p.location}</p><span>Xem quỹ căn dự án</span></div>
    </Link>)}</div>
  </section>;
}
