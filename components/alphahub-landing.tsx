'use client';

import {useEffect, useRef, useState} from 'react';
import {ArrowRight, CalendarDays, ChevronDown, Mail, Minus, Phone, Plus, Search} from 'lucide-react';
import Link from './site-link';
import AlphaHubRequestForm from './alphahub-request-form';
import {usePublicContact} from './public-contact-provider';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from './ui/dialog';
import {projectPath} from '@/lib/project-routes';
import {alphaHubContent} from '@/lib/alphahub-content';
import type {Article, Project, Unit} from '@/lib/catalog';

type Props = {projects: Project[]; units: Unit[]; articles: Article[]};
const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');

function Background() {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  const custom = usePublicContact().alphahubImage;
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true);
  }, []);
  return <img ref={image} src={failed ? '/images/green-paradise.webp' : custom || alphaHubContent.backgroundImage} alt="" fetchPriority="high" onError={() => setFailed(true)}/>;
}

export default function AlphaHubLanding({projects, units, articles}: Props) {
  const contact = usePublicContact();
  const [visitOpen, setVisitOpen] = useState(false);
  const [topicId, setTopicId] = useState<string>(alphaHubContent.topics[0].id);
  const [query, setQuery] = useState('');
  const [openPoint, setOpenPoint] = useState('');
  const [showAllPoints, setShowAllPoints] = useState(false);
  const [unitCode, setUnitCode] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const activeTopic = alphaHubContent.topics.find(topic => topic.id === topicId) || alphaHubContent.topics[0];
  const needle = normalize(query.trim());
  const topicPoints = [
    {title: activeTopic.title, body: activeTopic.body},
    ...activeTopic.points,
    ...alphaHubContent.values,
    ...alphaHubContent.outlook,
  ];
  const points = topicPoints.map((point, index) => ({...point, id: activeTopic.id + '-' + index})).filter(point => !needle || normalize(point.title + ' ' + point.body).includes(needle));
  const visiblePoints = needle || showAllPoints ? points : points.slice(0, 6);
  const selectTopic = (id: string) => {setTopicId(id); setQuery(''); setOpenPoint(''); setShowAllPoints(false);};
  const latestArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return <main className="ah" id="ah-top">
    <div className="ah-background" aria-hidden="true"><Background/></div>
    <section className="ah-hero" aria-labelledby="ah-title">
      <div className="ah-container">
        <h1 id="ah-title">Tư vấn cùng AlphaHub</h1>
        <p className="sr-only">{alphaHubContent.title}. {alphaHubContent.introduction}</p>
        <div className="ah-service-grid">
          <div className="ah-glass ah-consult-card" id="ah-tu-van">
            <h2>Yêu cầu tư vấn</h2>
            <AlphaHubRequestForm kind="consultation" projects={projects}/>
          </div>
          <article className="ah-glass ah-service-card">
            <span className="ah-service-icon"><CalendarDays size={27} aria-hidden="true"/></span>
            <h2>Đặt lịch tham quan</h2>
            <p>Tham quan dự án và nhà mẫu, trao đổi trực tiếp với đội ngũ tư vấn AlphaHub.</p>
            <button className="ah-text-link ah-visit-link" type="button" onClick={() => setVisitOpen(true)}>Đặt lịch ngay <ArrowRight size={18} aria-hidden="true"/></button>
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
        <h2 id="ah-about-title">Câu hỏi thường gặp</h2>
        <div className="ah-faq-layout">
          <nav className="ah-glass ah-faq-sidebar" aria-label="Nội dung giới thiệu">
            <h3>Giải pháp nền tảng</h3>
            {alphaHubContent.topics.slice(0, 6).map(topic => <button type="button" key={topic.id} aria-pressed={activeTopic.id === topic.id} onClick={() => selectTopic(topic.id)}>{topic.title}</button>)}
            <h3>Lợi ích cộng hưởng</h3>
            {alphaHubContent.topics.slice(6).map(topic => <button type="button" key={topic.id} aria-pressed={activeTopic.id === topic.id} onClick={() => selectTopic(topic.id)}>{topic.title}</button>)}
          </nav>
          <label className="ah-glass ah-mobile-topics"><span>Khám phá AlphaHub</span><span className="ah-select-wrap"><select aria-label="Nội dung giới thiệu" value={activeTopic.id} onChange={event => selectTopic(event.target.value)}><optgroup label="Giải pháp nền tảng">{alphaHubContent.topics.slice(0, 6).map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</optgroup><optgroup label="Lợi ích cộng hưởng">{alphaHubContent.topics.slice(6).map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</optgroup></select><ChevronDown size={18} aria-hidden="true"/></span></label>
          <div className="ah-faq-panel">
            <div className="ah-faq-panel-heading"><h3>{alphaHubContent.topics.slice(0, 6).some(topic => topic.id === activeTopic.id) ? 'Giải pháp nền tảng' : 'Lợi ích cộng hưởng'}</h3><label className="ah-search-input"><Search size={18} aria-hidden="true"/><input type="search" aria-label="Tìm nội dung giới thiệu" placeholder="Nhập từ khóa để tìm kiếm" value={query} onChange={event => {setQuery(event.target.value); setOpenPoint('');}}/></label></div>
            <p className="ah-topic-title">{activeTopic.title}</p>
            <div className="ah-questions" aria-live="polite">
              {visiblePoints.map(point => <details key={point.id} open={openPoint === point.id}><summary onClick={event => {event.preventDefault(); setOpenPoint(openPoint === point.id ? '' : point.id);}}><span>{point.title}</span>{openPoint === point.id ? <Minus size={19} aria-hidden="true"/> : <Plus size={19} aria-hidden="true"/>}</summary><div className="ah-answer"><p>{point.body}</p>{point.id === 'inventory-0' && <p>{projects.length.toLocaleString('vi-VN')} dự án trên hệ thống · {units.length.toLocaleString('vi-VN')} sản phẩm trong quỹ căn.</p>}{point.id.endsWith('-0') && <Link className="ah-answer-link" href={activeTopic.href}>{activeTopic.action} <ArrowRight size={16} aria-hidden="true"/></Link>}</div></details>)}
              {!points.length && <div className="ah-faq-empty"><p>Chưa có nội dung phù hợp.</p><button type="button" onClick={() => setQuery('')}>Xóa từ khóa</button></div>}
            </div>
            {!needle && points.length > 6 && <button className="ah-more-questions" type="button" onClick={() => setShowAllPoints(value => !value)}>{showAllPoints ? 'Thu gọn' : 'Xem thêm'} <ChevronDown size={16} aria-hidden="true"/></button>}
          </div>
        </div>
      </div>
    </section>

    <section className="ah-share-section" aria-labelledby="ah-share-title">
      <div className="ah-glass ah-share-card">
        <div className="ah-share-inner">
          <h2 id="ah-share-title">Góc chia sẻ</h2>
          <p>Chia sẻ thắc mắc để cùng xây dựng Câu hỏi thường gặp hữu ích hơn.</p>
          <AlphaHubRequestForm kind="question" projects={projects}/>
        </div>
      </div>
    </section>

    <section className="ah-news-section" aria-labelledby="ah-news-title">
      <div className="ah-container">
        <div className="ah-news-heading"><h2 id="ah-news-title">Tin tức</h2><div><p>Khám phá cách AlphaHub đồng hành cùng khách hàng, từng bước hiện thực hóa giấc mơ sở hữu bất động sản.</p><Link className="ah-button ah-news-button" href="/tin-tuc">Khám phá ngay <ArrowRight size={18} aria-hidden="true"/></Link></div></div>
        <div className="ah-news-grid">{latestArticles.map(article => {
          const href = '/tin-tuc/' + encodeURIComponent(article.id);
          return <article key={article.id} className="ah-news-card">
            <Link className="ah-news-cover" href={href} aria-label={article.title}><img src={article.image || '/images/green-paradise.webp'} alt={article.title} loading="lazy" onError={event => {if (!event.currentTarget.src.endsWith('/images/green-paradise.webp')) event.currentTarget.src = '/images/green-paradise.webp';}}/></Link>
            <h3><Link href={href}>{article.title}</Link></h3>
            <p>{article.body}</p>
            <time dateTime={article.date}>{article.date.split('-').reverse().join('/')}</time>
          </article>;
        })}</div>
      </div>
    </section>

    <aside className="ah-contact-strip" id="ah-lien-he" aria-label="Liên hệ AlphaHub"><div className="ah-container"><span>Cùng AlphaHub kết nối những giá trị thực.</span><a href={`tel:${contact.phone}`}><Phone size={17} aria-hidden="true"/>{contact.phone}</a><a href={contact.zaloHref} target="_blank" rel="noreferrer">Nhắn Zalo <ArrowRight size={16} aria-hidden="true"/></a><a href={`mailto:${contact.email}`}><Mail size={17} aria-hidden="true"/>Email tư vấn</a></div></aside>

    <Dialog open={visitOpen} onOpenChange={setVisitOpen}><DialogContent className="ah-dialog"><DialogHeader><DialogTitle>Đặt lịch tham quan</DialogTitle><DialogDescription>Chọn dự án và thời gian mong muốn. Đội ngũ AlphaHub sẽ liên hệ xác nhận lịch với bạn.</DialogDescription></DialogHeader><AlphaHubRequestForm kind="visit" projects={projects}/></DialogContent></Dialog>
  </main>;
}
