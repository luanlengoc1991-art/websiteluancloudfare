'use client';

import {useState} from 'react';
import Image from 'next/image';
import {Building2, ChevronDown, FileText, Globe, Images, Layers, List, MapPin, Phone, Search} from 'lucide-react';
import Link from './site-link';
import {projectPath} from '@/lib/project-routes';
import {publicContact} from '@/lib/public-contact';
import type {Article, Project, Unit} from '@/lib/catalog';

type Props = {
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

export default function AboutLanding({brand, projects, units, articles, sourceStatus, onSearch}: Props) {
  const [query, setQuery] = useState('');
  const green = projects.find(project => project.id === 'green-paradise');
  const greenUnits = units.filter(unit => unit.projectId === 'green-paradise');
  const otherProjects = ['saigon-park', 'ha-long', 'hai-van'].flatMap(id => {
    const project = projects.find(item => item.id === id);
    return project ? [project] : [];
  });
  const latestArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const greenCount = greenUnits.length ? format(greenUnits.length) : '—';
  const projectName = green?.name || 'Vinhomes Green Paradise';

  return <main className="al">
    <section className="al-hero" aria-labelledby="al-title">
      <div className="al-hero-image"><ProjectImage src={green?.image || '/images/green-paradise.webp'} name={`Phối cảnh tổng thể ${projectName}`} hero green/></div>
      <div className="al-hero-shade"/>
      <div className="al-hero-content al-container">
        <span className="al-kicker">{brand} · KHÁM PHÁ BẤT ĐỘNG SẢN</span>
        <h1 id="al-title">Một hành trình mới.<br/>Một không gian sống xanh.</h1>
        <p>Khám phá dự án, tìm quỹ căn và lựa chọn nơi an cư cùng {brand}.</p>
        <form className="al-search" role="search" onSubmit={event => {event.preventDefault(); onSearch(query.trim());}}>
          <Search size={23} aria-hidden="true"/>
          <input type="search" aria-label="Tìm tên dự án" placeholder="Bạn đang tìm dự án nào?" value={query} onChange={event => setQuery(event.target.value)} maxLength={150}/>
          <button type="submit">Tìm kiếm</button>
        </form>
        <div className="al-popular"><span>Dự án được quan tâm</span><a href="#vinhomes-green-paradise">Green Paradise</a>{otherProjects.slice(0, 2).map(project => <Link key={project.id} href={projectPath(project.id)}>{project.name.replace(/^Vinhomes /, '')}</Link>)}</div>
      </div>
      <div className="al-hero-bottom al-container">
        <div><span className="al-kicker">DỰ ÁN NỔI BẬT · CẦN GIỜ, TP. HỒ CHÍ MINH</span><h2>Vinhomes<br/>Green Paradise</h2></div>
        <a href="#vinhomes-green-paradise" className="al-button al-button-glass">Khám phá dự án <ChevronDown size={18}/></a>
      </div>
    </section>

    <section className="al-platform al-container" aria-labelledby="al-platform-title">
      <div><span className="al-kicker">VỀ {brand.toLocaleUpperCase('vi')}</span><h2 id="al-platform-title">Kết nối bạn với<br/>những không gian sống.</h2><p>Dự án, quỹ căn và thông tin bạn cần được kết nối trong một hành trình: tìm hiểu, trải nghiệm và lựa chọn.</p></div>
      <dl className="al-platform-stats"><div><dt>Dự án trên hệ thống</dt><dd>{format(projects.length)}</dd></div><div><dt>Căn trên hệ thống</dt><dd>{format(units.length)}</dd></div><div><dt>Khám phá mặt bằng</dt><dd>360<small>°</small></dd></div></dl>
    </section>

    {green && <section id="vinhomes-green-paradise" className="al-feature" aria-labelledby="al-green-title">
      <div className="al-container">
        <div className="al-section-heading"><div><span className="al-kicker">TÂM ĐIỂM CẦN GIỜ</span><h2 id="al-green-title">Vinhomes Green Paradise</h2></div><span className="al-project-status">{green.status || 'Thông tin dự án'}</span></div>
        <div className="al-feature-layout">
          <Link href={projectPath(green.id)} className="al-feature-image" aria-label={`Khám phá ${green.name}`}><ProjectImage src={green.image} name={`Phối cảnh ${green.name}`} green/><span className="al-image-caption">Phối cảnh tổng thể</span></Link>
          <div className="al-feature-copy"><span className="al-kicker">XANH · THÔNG MINH · SINH THÁI</span><h3>Không gian sống mới<br/>bên biển Cần Giờ.</h3><p className="al-location"><MapPin size={17}/>{green.location}</p><p>Khám phá siêu đô thị ESG++ qua phối cảnh tổng thể, vị trí, mặt bằng và quỹ căn bạn quan tâm.</p>
            <dl className="al-project-facts"><div><dt>Chủ đầu tư</dt><dd>{green.developer}</dd></div><div><dt>Quy mô dự án</dt><dd>2.870 ha</dd></div><div><dt>Loại hình</dt><dd>{green.category === 'high' ? 'Cao tầng' : 'Thấp tầng'}</dd></div><div><dt>Khu vực</dt><dd>{green.region}</dd></div></dl>
            <Link href={projectPath(green.id, 'inventory')} className="al-green-count"><strong>{greenCount}</strong><span>căn trong quỹ căn<small>{greenUnits.length ? 'Xem bảng hàng dự án' : 'Quỹ căn đang cập nhật'}</small></span></Link>
            <div className="al-actions"><Link className="al-button al-button-mint" href={projectPath(green.id)}>Chi tiết dự án</Link><Link className="al-button al-button-glass" href={projectPath(green.id, 'vr')}>Xem quỹ căn 360°</Link></div>
            <p className="al-source">{sourceStatus}</p>
          </div>
        </div>
        <nav className="al-project-nav" aria-label="Khám phá Vinhomes Green Paradise">{[
          {tab: 'overview', label: 'Tổng quan', Icon: Building2},
          {tab: 'location', label: 'Vị trí', Icon: MapPin},
          {tab: 'plan', label: 'Mặt bằng', Icon: Layers},
          {tab: 'inventory', label: 'Bảng hàng', Icon: List},
          {tab: 'gallery', label: 'Thư viện', Icon: Images},
          {tab: 'document', label: 'Tài liệu', Icon: FileText},
        ].map(({tab, label, Icon}) => <Link key={tab} href={projectPath(green.id, tab)}><Icon size={22}/><span>{label}</span></Link>)}</nav>
      </div>
    </section>}

    <section className="al-discover al-container" aria-labelledby="al-discover-title">
      <div className="al-section-heading"><div><span className="al-kicker">KHÁM PHÁ CÙNG {brand.toLocaleUpperCase('vi')}</span><h2 id="al-discover-title">Những dự án bạn quan tâm</h2></div><Link className="al-text-link" href="/du-an">Tất cả dự án</Link></div>
      <div className="al-project-list">{otherProjects.map(project => <article className="al-project" key={project.id}>
        <Link className="al-project-image" href={projectPath(project.id)} aria-label={`Xem ${project.name}`}><ProjectImage src={project.image} name={project.name}/></Link>
        <span className="al-project-developer">{project.developer}</span><h3><Link href={projectPath(project.id)}>{project.name}</Link></h3><p className="al-location"><MapPin size={16}/>{project.location}</p>
        <Link className="al-project-inventory" href={projectPath(project.id, 'inventory')}><span><strong>{format(units.filter(unit => unit.projectId === project.id).length)}</strong> căn trên hệ thống</span><span>Xem quỹ căn</span></Link>
      </article>)}</div>
    </section>

    <section className="al-journey" aria-labelledby="al-journey-title"><div className="al-container"><div className="al-section-heading"><div><span className="al-kicker">TỪ KHÁM PHÁ ĐẾN LỰA CHỌN</span><h2 id="al-journey-title">Đồng hành trên hành trình của bạn</h2></div></div><div className="al-services">
      <Link href={projectPath('green-paradise', 'vr')}><Globe size={32}/><div><h3>Trải nghiệm dự án 360°</h3><p>Khám phá phối cảnh và mặt bằng, xem vị trí căn bạn quan tâm.</p><span>Khám phá không gian</span></div></Link>
      <Link href="/quy-hang"><Building2 size={32}/><div><h3>Tìm quỹ căn phù hợp</h3><p>Tra cứu mã căn, phân khu, diện tích và ngân sách trong cùng một nơi.</p><span>Tra cứu quỹ căn</span></div></Link>
      <a href={publicContact.zaloHref} target="_blank" rel="noreferrer"><Phone size={32}/><div><h3>Kết nối tư vấn</h3><p>Trao đổi nhu cầu và xác nhận thông tin cùng đội ngũ tư vấn.</p><span>Liên hệ qua Zalo</span></div></a>
    </div></div></section>

    {latestArticles.length > 0 && <section className="al-news al-container" aria-labelledby="al-news-title"><div className="al-section-heading"><div><span className="al-kicker">THÔNG TIN & KIẾN THỨC</span><h2 id="al-news-title">Cùng bạn tìm hiểu bất động sản</h2></div><Link className="al-text-link" href="/tin-tuc">Tất cả tin tức</Link></div><div className="al-news-list">{latestArticles.map(article => <article key={article.id}><Link className="al-news-image" href={`/tin-tuc/${encodeURIComponent(article.id)}`} aria-label={article.title}><ProjectImage src={article.image} name={article.title}/></Link><span className="al-project-developer">{article.category}</span><h3><Link href={`/tin-tuc/${encodeURIComponent(article.id)}`}>{article.title}</Link></h3><p>{article.body.split('\n')[0]}</p></article>)}</div></section>}

    <section className="al-contact"><div className="al-container"><div><span className="al-kicker">{brand} · LUÔN SẴN SÀNG ĐỒNG HÀNH</span><h2>Tìm không gian sống<br/>dành cho bạn.</h2><p>Liên hệ để tìm hiểu dự án và quỹ căn bạn quan tâm.</p></div><div className="al-actions"><a className="al-button al-button-mint" href={`tel:${publicContact.phone}`}><Phone size={18}/>{publicContact.phone}</a><a className="al-button al-button-glass" href={publicContact.zaloHref} target="_blank" rel="noreferrer">Tư vấn qua Zalo</a></div></div></section>
  </main>;
}
