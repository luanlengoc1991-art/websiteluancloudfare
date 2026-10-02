'use client';

import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {ArrowRight, Building2, CalendarDays, ChevronDown, HeartHandshake, Mail, Minus, Phone, Plus, Search, ShieldCheck, Sparkles} from 'lucide-react';
import Link from './site-link';
import AlphaHubRequestForm from './alphahub-request-form';
import {usePublicContact} from './public-contact-provider';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from './ui/dialog';
import {projectPath} from '@/lib/project-routes';
import {alphaHubContent} from '@/lib/alphahub-content';
import type {Project, Unit} from '@/lib/catalog';

type Props = {projects: Project[]; units: Unit[]};
const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');

function Background() {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true);
  }, []);
  return <img ref={image} src={failed ? '/images/green-paradise.webp' : alphaHubContent.backgroundImage} alt="" fetchPriority="high" onError={() => setFailed(true)}/>;
}

export default function AlphaHubLanding({projects, units}: Props) {
  const contact = usePublicContact();
  const [visitOpen, setVisitOpen] = useState(false);
  const [topicId, setTopicId] = useState<string>(alphaHubContent.topics[0].id);
  const [query, setQuery] = useState('');
  const [openPoint, setOpenPoint] = useState<string | null>(null);
  const [unitCode, setUnitCode] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const activeTopic = alphaHubContent.topics.find(topic => topic.id === topicId) || alphaHubContent.topics[0];
  const needle = normalize(query.trim());
  const points = activeTopic.points.map((point, index) => ({...point, id: activeTopic.id + '-' + index})).filter(point => !needle || normalize(activeTopic.title + ' ' + point.title + ' ' + point.body).includes(needle));
  const expandedPoint = openPoint === null ? points[0]?.id : openPoint;
  const selectTopic = (id: string) => {setTopicId(id); setQuery(''); setOpenPoint(null);};
  const developers = [...new Set(projects.map(project => project.developer).filter(Boolean))];
  const valueIcons = [ShieldCheck, HeartHandshake, Sparkles];

  return <main className="ah" id="ah-top" style={{'--ah-background': `url("${alphaHubContent.backgroundImage}")`} as CSSProperties}>
    <section className="ah-hero" aria-labelledby="ah-title">
      <div className="ah-hero-background" aria-hidden="true"><Background/></div>
      <div className="ah-container">
        <p className="ah-brand-kicker">ALPHAHUB</p>
        <h1 id="ah-title">{alphaHubContent.title}</h1>
        <p className="ah-hero-introduction">{alphaHubContent.introduction}</p>
        <div className="ah-service-grid">
          <div className="ah-glass ah-consult-card" id="ah-tu-van">
            <h2>Yêu cầu tư vấn</h2>
            <AlphaHubRequestForm kind="consultation" projects={projects}/>
          </div>
          <article className="ah-glass ah-service-card">
            <span className="ah-service-icon"><Building2 size={27} aria-hidden="true"/></span>
            <h2>Khám phá dự án</h2>
            <p>Quỹ hàng phong phú với căn hộ cao tầng, biệt thự, liền kề và shophouse từ nhiều dự án.</p>
            <Link className="ah-text-link" href="/du-an">Xem danh sách dự án <ArrowRight size={18} aria-hidden="true"/></Link>
            <button className="ah-text-link ah-visit-link" type="button" onClick={() => setVisitOpen(true)}><CalendarDays size={16} aria-hidden="true"/>Đặt lịch tham quan</button>
          </article>
          <article className="ah-glass ah-service-card ah-lookup-card">
            <span className="ah-service-icon"><Search size={27} aria-hidden="true"/></span>
            <h2>Tra cứu<br className="ah-desktop-break"/> mã căn</h2>
            <p>Công cụ trực quan giúp bạn kết nối nhu cầu với những sản phẩm phù hợp.</p>
            <form aria-label="Tra cứu mã căn" onSubmit={event => {
              event.preventDefault();
              const code = unitCode.trim();
              const unit = units.find(item => normalize(item.code.trim()) === normalize(code));
              if (unit) {window.location.assign(`${projectPath(unit.projectId, 'inventory')}?product=${encodeURIComponent(unit.code)}`); return;}
              setLookupMessage('Chưa tìm thấy mã căn này. Bạn có thể xem toàn bộ quỹ căn hoặc liên hệ để được hỗ trợ.');
            }}>
              <label className="ah-search-input"><Search size={18} aria-hidden="true"/><input name="code" aria-label="Mã căn cần tra cứu" value={unitCode} onChange={event => {setUnitCode(event.target.value); setLookupMessage('');}} placeholder="Nhập mã căn" required maxLength={100}/></label>
              <button className="ah-button ah-lookup-button" type="submit">Tra cứu</button>
              {lookupMessage && <p className="ah-lookup-message" role="status">{lookupMessage}</p>}
            </form>
            <Link className="ah-text-link" href="/quy-hang">Khám phá toàn bộ quỹ căn <ArrowRight size={18} aria-hidden="true"/></Link>
          </article>
        </div>
      </div>
    </section>

    <section className="ah-faq-section" id="ah-gioi-thieu" aria-labelledby="ah-about-title">
      <div className="ah-container">
        <h2 id="ah-about-title">Về AlphaHub</h2>
        <div className="ah-faq-layout">
          <nav className="ah-glass ah-faq-sidebar" aria-label="Nội dung giới thiệu">
            <h3>Giải pháp nền tảng</h3>
            {alphaHubContent.topics.filter(topic => topic.group === 'platform').map(topic => <button type="button" key={topic.id} aria-pressed={activeTopic.id === topic.id} onClick={() => selectTopic(topic.id)}>{topic.title}</button>)}
            <h3>Lợi ích cộng hưởng</h3>
            {alphaHubContent.topics.filter(topic => topic.group === 'benefits').map(topic => <button type="button" key={topic.id} aria-pressed={activeTopic.id === topic.id} onClick={() => selectTopic(topic.id)}>{topic.title}</button>)}
          </nav>
          <label className="ah-glass ah-mobile-topics"><span>Khám phá AlphaHub</span><span className="ah-select-wrap"><select aria-label="Nội dung giới thiệu" value={activeTopic.id} onChange={event => selectTopic(event.target.value)}><optgroup label="Giải pháp nền tảng">{alphaHubContent.topics.filter(topic => topic.group === 'platform').map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</optgroup><optgroup label="Lợi ích cộng hưởng">{alphaHubContent.topics.filter(topic => topic.group === 'benefits').map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</optgroup></select><ChevronDown size={18} aria-hidden="true"/></span></label>
          <div className="ah-faq-panel">
            <div className="ah-faq-panel-heading"><h3>{activeTopic.group === 'platform' ? 'Giải pháp nền tảng' : 'Lợi ích cộng hưởng'}</h3><label className="ah-search-input"><Search size={18} aria-hidden="true"/><input type="search" aria-label="Tìm nội dung giới thiệu" placeholder="Nhập từ khóa để tìm kiếm" value={query} onChange={event => {setQuery(event.target.value); setOpenPoint(null);}}/></label></div>
            <p className="ah-topic-title">{activeTopic.title}</p>
            <p className="ah-topic-body">{activeTopic.body}</p>
            {activeTopic.id === 'inventory' && <div className="ah-catalog-summary"><span><strong>{projects.length.toLocaleString('vi-VN')}</strong> dự án trên hệ thống</span><span><strong>{units.length.toLocaleString('vi-VN')}</strong> sản phẩm trong quỹ căn</span></div>}
            <div className="ah-questions" aria-live="polite">
              {points.map(point => <details key={point.id} open={expandedPoint === point.id}><summary onClick={event => {event.preventDefault(); setOpenPoint(expandedPoint === point.id ? '' : point.id);}}><span>{point.title}</span>{expandedPoint === point.id ? <Minus size={19} aria-hidden="true"/> : <Plus size={19} aria-hidden="true"/>}</summary><div className="ah-answer"><p>{point.body}</p></div></details>)}
              {!points.length && <div className="ah-faq-empty"><p>Chưa có nội dung phù hợp.</p><button type="button" onClick={() => setQuery('')}>Xóa từ khóa</button></div>}
            </div>
            <Link className="ah-answer-link" href={activeTopic.href}>{activeTopic.action} <ArrowRight size={16} aria-hidden="true"/></Link>
          </div>
        </div>
      </div>
    </section>

    <section className="ah-share-section" aria-labelledby="ah-outlook-title">
      <div className="ah-glass ah-share-card ah-outlook-card">
        <span className="ah-section-kicker">GÓC NHÌN THỊ TRƯỜNG 2026</span>
        <h2 id="ah-outlook-title">Khởi đầu của chu kỳ tăng trưởng bền vững</h2>
        <p>Bắt nhịp xu thế thị trường, mở rộng góc nhìn trong hành trình tìm hiểu bất động sản.</p>
        <div className="ah-outlook-grid">{alphaHubContent.outlook.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
        <div className="ah-outlook-action"><h3>Sẵn sàng đầu tư thông minh?</h3><p>Nắm luật, hiểu quy hoạch và sử dụng đòn bẩy an toàn. Kết nối AlphaHub để tìm hiểu những lựa chọn phù hợp.</p><div><Link className="ah-button ah-primary" href="/dang-ky">Đăng ký thành viên <ArrowRight size={17}/></Link><Link className="ah-text-link" href="/du-an">Xem danh sách dự án <ArrowRight size={17}/></Link></div></div>
      </div>
    </section>

    <section className="ah-news-section" aria-labelledby="ah-values-title">
      <div className="ah-container">
        <div className="ah-news-heading"><h2 id="ah-values-title">Giá trị cốt lõi</h2><div><p>Những nguyên tắc định hướng mọi hành động của chúng tôi.</p><a className="ah-button ah-news-button" href="#ah-tu-van">Tư vấn miễn phí <ArrowRight size={18} aria-hidden="true"/></a></div></div>
        <div className="ah-news-grid ah-values-grid">{alphaHubContent.values.map((value, index) => {const Icon = valueIcons[index]; return <article key={value.title} className="ah-glass ah-value-card"><span className="ah-service-icon"><Icon size={29} aria-hidden="true"/></span><h3>{value.title}</h3><p>{value.body}</p></article>;})}</div>
        <div className="ah-developers"><h3>Khám phá dự án từ các chủ đầu tư</h3><div>{developers.map(developer => <span key={developer}>{developer}</span>)}</div></div>
      </div>
    </section>

    <aside className="ah-contact-strip" id="ah-lien-he" aria-label="Liên hệ AlphaHub"><div className="ah-container"><span>Cùng AlphaHub kết nối những giá trị thực.</span><a href={`tel:${contact.phone}`}><Phone size={17} aria-hidden="true"/>{contact.phone}</a><a href={contact.zaloHref} target="_blank" rel="noreferrer">Nhắn Zalo <ArrowRight size={16} aria-hidden="true"/></a><a href={`mailto:${contact.email}`}><Mail size={17} aria-hidden="true"/>Email tư vấn</a></div></aside>

    <Dialog open={visitOpen} onOpenChange={setVisitOpen}><DialogContent className="ah-dialog"><DialogHeader><DialogTitle>Đặt lịch tham quan</DialogTitle><DialogDescription>Chọn dự án và thời gian mong muốn. Đội ngũ AlphaHub sẽ liên hệ xác nhận lịch với bạn.</DialogDescription></DialogHeader><AlphaHubRequestForm kind="visit" projects={projects}/></DialogContent></Dialog>
  </main>;
}
