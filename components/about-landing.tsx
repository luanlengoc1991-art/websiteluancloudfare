'use client';

import {useState} from 'react';
import Image from 'next/image';
import {ArrowUpRight, Building2, FileText, Globe, Images, Layers, List, MapPin, Phone, Search} from 'lucide-react';
import Link from './site-link';
import {projectPath} from '@/lib/project-routes';
import {usePublicContact} from './public-contact-provider';
import type {Article, Project, Unit} from '@/lib/catalog';

import type {AboutContent} from '@/lib/site-content';

type Props = {
  content: AboutContent;
  brand: string;
  projects: Project[];
  units: Unit[];
  articles: Article[];
  sourceStatus: string;
  onSearch: (query: string) => void;
};
const format = (value: number) => value.toLocaleString('vi-VN');

function ProjectImage({src, name, hero = false, green = false}: {src: string; name: string; hero?: boolean; green?: boolean}) {
  const [failedSource, setFailedSource] = useState('');
  const fallback = green ? '/images/green-paradise.webp' : '';
  const imageSource = src && failedSource !== src ? src : fallback;
  return imageSource ? <Image src={imageSource} alt={name} fill unoptimized sizes={hero ? '100vw' : '(max-width: 760px) 100vw, 60vw'} loading={hero ? 'eager' : 'lazy'} fetchPriority={hero ? 'high' : 'auto'} onError={() => setFailedSource(src)}/> :
    <div className="al-image-empty"><Building2 size={36}/><span>{name}</span></div>;
}

export default function AboutLanding({content, brand, projects, units, articles, sourceStatus, onSearch}: Props) {
 const publicContact=usePublicContact();
  const [query, setQuery] = useState('');
  const green = projects.find(project => project.id === content.featuredProjectId);
  const greenUnits = units.filter(unit => unit.projectId === content.featuredProjectId);
  const otherProjects = content.selectedProjectIds.flatMap(id => {
    const project = projects.find(item => item.id === id);
    return project ? [project] : [];
  });
  const latestArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const greenCount = greenUnits.length ? format(greenUnits.length) : '—';
  const projectName = green?.name || 'Vinhomes Green Paradise';

  return <main className="al">
    <header className="al-heading al-container">
        <span className="al-kicker">{brand} · KHÁM PHÁ BẤT ĐỘNG SẢN</span>
        <h1 id="al-title">{content.headline || `Giới thiệu ${brand}`}</h1>
        <p>{content.introduction || `Khám phá dự án, tìm quỹ căn và lựa chọn nơi an cư cùng ${brand}.`}</p>
    </header>

    {green && <section id="vinhomes-green-paradise" className="al-feature al-container" aria-labelledby="al-green-title">
        <div className="al-hero">
          <div className="al-hero-image"><ProjectImage src={green.image} name={`Phối cảnh tổng thể ${projectName}`} hero green={green.id==='green-paradise'}/></div>
          <div className="al-feature-copy">
            <div className="al-feature-top"><span className="al-kicker">DỰ ÁN NỔI BẬT</span><span className="al-project-status">{green.status || 'Thông tin dự án'}</span></div>
            <h2 id="al-green-title">{projectName}</h2>
            <p>{content.featuredTagline}</p>
            <p className="al-location"><MapPin size={17}/>{green.location}</p>
            <dl className="al-project-facts"><div><dt>Chủ đầu tư</dt><dd>{green.developer}</dd></div><div><dt>Quy mô dự án</dt><dd>{content.featuredScale}</dd></div><div><dt>Loại hình</dt><dd>{green.category === 'high' ? 'Cao tầng' : 'Thấp tầng'}</dd></div><div><dt>Khu vực</dt><dd>{green.region}</dd></div></dl>
            <Link href={projectPath(green.id, 'inventory')} className="al-green-count"><strong>{greenCount}</strong><span>căn trong quỹ căn<small>{greenUnits.length ? 'Xem bảng hàng dự án' : 'Quỹ căn đang cập nhật'}</small></span></Link>
            <div className="al-actions"><Link className="al-button al-button-primary" href={projectPath(green.id, 'vr')}>Quỹ căn 360° <ArrowUpRight size={17}/></Link><Link className="al-button al-button-outline" href={projectPath(green.id)}>Chi tiết dự án</Link></div>
            {green.id==='green-paradise'&&<p className="al-source">{sourceStatus}</p>}
          </div>
          <span className="al-image-caption">Phối cảnh tổng thể · hình ảnh minh họa</span>
        </div>
        <nav className="al-project-nav" aria-label={`Khám phá ${projectName}`}>{[
          {tab: 'overview', label: 'Tổng quan', Icon: Building2},
          {tab: 'location', label: 'Vị trí', Icon: MapPin},
          {tab: 'plan', label: 'Mặt bằng', Icon: Layers},
          {tab: 'inventory', label: 'Bảng hàng', Icon: List},
          {tab: 'gallery', label: 'Thư viện', Icon: Images},
          {tab: 'document', label: 'Tài liệu', Icon: FileText},
        ].map(({tab, label, Icon}) => <Link key={tab} href={projectPath(green.id, tab)}><Icon size={22}/><span>{label}</span></Link>)}</nav>
    </section>}

    <section className="al-finder al-container al-panel" aria-labelledby="al-finder-title">
      <div className="al-section-heading"><div><span className="al-kicker">BẮT ĐẦU KHÁM PHÁ</span><h2 id="al-finder-title">Tìm dự án dành cho bạn</h2></div><Link className="al-text-link" href="/quy-hang">Tra cứu quỹ căn <ArrowUpRight size={16}/></Link></div>
      <form className="al-search" role="search" onSubmit={event => {event.preventDefault(); onSearch(query.trim());}}>
        <Search size={22} aria-hidden="true"/>
        <input type="search" aria-label="Tìm tên dự án" placeholder="Nhập tên dự án bạn quan tâm" value={query} onChange={event => setQuery(event.target.value)} maxLength={150}/>
        <button type="submit">Tìm dự án <ArrowUpRight size={17}/></button>
      </form>
      <div className="al-popular"><span>Gợi ý:</span>{green&&<a href="#vinhomes-green-paradise">{projectName.replace(/^Vinhomes /, '')}</a>}{otherProjects.slice(0, 2).map(project => <Link key={project.id} href={projectPath(project.id)}>{project.name.replace(/^Vinhomes /, '')}</Link>)}</div>
    </section>

    <section className="al-platform al-container" aria-labelledby="al-platform-title">
      <div><span className="al-kicker">VỀ {brand.toLocaleUpperCase('vi')}</span><h2 id="al-platform-title">{content.platformTitle}</h2><p>{content.platformBody}</p></div>
      <dl className="al-platform-stats"><div><dt>Dự án trên hệ thống</dt><dd>{format(projects.length)}</dd></div><div><dt>Căn trên hệ thống</dt><dd>{format(units.length)}</dd></div><div><dt>Khám phá mặt bằng</dt><dd>360<small>°</small></dd></div></dl>
    </section>

    <section className="al-discover al-container" aria-labelledby="al-discover-title">
      <div className="al-section-heading"><div><span className="al-kicker">KHÁM PHÁ CÙNG {brand.toLocaleUpperCase('vi')}</span><h2 id="al-discover-title">Những dự án bạn quan tâm</h2></div><Link className="al-text-link" href="/du-an">Tất cả dự án</Link></div>
      <div className="al-project-list">{otherProjects.map(project => <article className="al-project" key={project.id}>
        <Link className="al-project-image" href={projectPath(project.id)} aria-label={`Xem ${project.name}`}><ProjectImage src={project.image} name={project.name}/></Link>
        <div className="al-project-body"><span className="al-project-developer">{project.developer}</span><h3><Link href={projectPath(project.id)}>{project.name}</Link></h3><p className="al-location"><MapPin size={16}/>{project.location}</p>
        <Link className="al-project-inventory" href={projectPath(project.id, 'inventory')}><span><strong>{format(units.filter(unit => unit.projectId === project.id).length)}</strong> căn trên hệ thống</span><span>Xem quỹ căn</span></Link>
        </div>
      </article>)}</div>
    </section>

    <section className="al-journey al-container al-panel" aria-labelledby="al-journey-title"><div className="al-section-heading"><div><span className="al-kicker">TỪ KHÁM PHÁ ĐẾN LỰA CHỌN</span><h2 id="al-journey-title">{content.journeyTitle}</h2></div></div><div className="al-services">
      <Link href={projectPath(content.featuredProjectId, 'vr')}><span className="al-step">01</span><Globe size={28}/><div><h3>Trải nghiệm dự án 360°</h3><p>Khám phá phối cảnh, mặt bằng và vị trí căn bạn quan tâm.</p><span>Khám phá không gian <ArrowUpRight size={15}/></span></div></Link>
      <Link href="/quy-hang"><span className="al-step">02</span><Building2 size={28}/><div><h3>Tìm quỹ căn phù hợp</h3><p>Tra cứu mã căn, phân khu, diện tích và ngân sách.</p><span>Tra cứu quỹ căn <ArrowUpRight size={15}/></span></div></Link>
      <a href={publicContact.zaloHref} target="_blank" rel="noreferrer"><span className="al-step">03</span><Phone size={28}/><div><h3>Kết nối tư vấn</h3><p>Trao đổi nhu cầu và xác nhận thông tin cùng đội ngũ tư vấn.</p><span>Liên hệ qua Zalo <ArrowUpRight size={15}/></span></div></a>
    </div></section>

    {latestArticles.length > 0 && <section className="al-news al-container" aria-labelledby="al-news-title"><div className="al-section-heading"><div><span className="al-kicker">THÔNG TIN & KIẾN THỨC</span><h2 id="al-news-title">{content.newsTitle}</h2></div><Link className="al-text-link" href="/tin-tuc">Tất cả tin tức</Link></div><div className="al-news-list">{latestArticles.map(article => <article key={article.id}><Link className="al-news-image" href={`/tin-tuc/${encodeURIComponent(article.id)}`} aria-label={article.title}><ProjectImage src={article.image} name={article.title}/></Link><span className="al-project-developer">{article.category}</span><h3><Link href={`/tin-tuc/${encodeURIComponent(article.id)}`}>{article.title}</Link></h3><p>{article.body.split('\n')[0]}</p></article>)}</div></section>}

    <section className="al-help al-container" aria-labelledby="al-help-title"><div className="al-faq al-panel"><span className="al-kicker">TÌM HIỂU THÊM</span><h2 id="al-help-title">Câu hỏi thường gặp</h2>{content.faq.map(({question, answer},index)=><details key={index}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div><div className="al-contact al-panel"><span className="al-kicker">{brand} · LUÔN SẴN SÀNG ĐỒNG HÀNH</span><h2>{content.contactTitle}</h2><p>{content.contactBody}</p><div className="al-actions"><a className="al-button al-button-primary" href={`tel:${publicContact.phone}`}><Phone size={18}/>{publicContact.phone}</a><a className="al-button al-button-outline" href={publicContact.zaloHref} target="_blank" rel="noreferrer">Tư vấn qua Zalo <ArrowUpRight size={16}/></a></div></div></section>
  </main>;
}
