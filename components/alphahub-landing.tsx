'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowRight, Building2, CalendarDays, ChevronDown, Mail, Minus, Phone, Plus, Search} from 'lucide-react';
import Link from './site-link';
import AlphaHubRequestForm from './alphahub-request-form';
import {usePublicContact} from './public-contact-provider';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from './ui/dialog';
import {projectPath} from '@/lib/project-routes';
import type {Article, Project, Unit} from '@/lib/catalog';
import type {AboutContent, Guide} from '@/lib/site-content';

type Props = {projects: Project[]; units: Unit[]; articles: Article[]; guides: Guide[]; faq: AboutContent['faq']};
type Question = {id: string; title: string; body: string; href?: string; action?: string};
type Topic = {id: string; title: string; group: 'projects' | 'guides'; questions: Question[]};

const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');
const formatDate = (value: string) => {const [year, month, day] = value.split('-'); return year && month && day ? `${day}/${month}/${year}` : value;};

function Cover({src, alt, hero = false, fallback}: {src: string; alt: string; hero?: boolean; fallback?: string}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const source = src && !failedSources.includes(src) ? src : fallback && !failedSources.includes(fallback) ? fallback : '';
  const markFailed = (failed: string) => setFailedSources(current => current.includes(failed) ? current : [...current, failed]);
  useEffect(() => {
    // Catch failures that occur before the image's onError handler is hydrated.
    if (source && imageRef.current?.complete && imageRef.current.naturalWidth === 0) markFailed(source);
  }, [source]);
  return source ? <img ref={imageRef} src={source} alt={alt} loading={hero ? 'eager' : 'lazy'} fetchPriority={hero ? 'high' : 'auto'} onError={() => markFailed(source)}/> : <span className="ah-cover-fallback" role={alt ? 'img' : undefined} aria-label={alt || undefined}><Building2 size={hero ? 120 : 48} strokeWidth={.8}/></span>;
}

export default function AlphaHubLanding({projects, units, articles, guides, faq}: Props) {
  const contact = usePublicContact();
  const [visitOpen, setVisitOpen] = useState(false);
  const [topicId, setTopicId] = useState('');
  const [query, setQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [unitCode, setUnitCode] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const featured = projects.find(project => project.id === 'green-paradise') || projects[0];
  const topics = useMemo<Topic[]>(() => [
    ...projects.slice(0, 6).map(project => ({
      id: 'project-' + project.id, title: project.name, group: 'projects' as const,
      questions: [
        {id: project.id + '-location', title: `${project.name} ở đâu?`, body: `Dự án được giới thiệu tại ${project.location}, thuộc danh mục ${project.developer} trên AlphaHub. Xem trang dự án để tìm hiểu vị trí, kết nối và các tài liệu đã cập nhật.`, href: projectPath(project.id), action: 'Khám phá dự án'},
        {id: project.id + '-experience', title: 'Tôi có thể xem mặt bằng và quỹ căn 360° như thế nào?', body: 'Mở trang dự án, chọn Quỹ căn 360° để khám phá không gian và vị trí sản phẩm. Hình ảnh, panorama và mặt bằng hiển thị theo dữ liệu đã được bổ sung cho từng dự án.', href: projectPath(project.id, 'vr'), action: 'Xem quỹ căn 360°'},
        {id: project.id + '-inventory', title: 'Làm sao để tra cứu giá và tình trạng căn?', body: `${units.filter(unit => unit.projectId === project.id).length.toLocaleString('vi-VN')} sản phẩm đang được hiển thị trong quỹ căn của dự án trên hệ thống. Bạn có thể xem mã căn, diện tích, hướng và giá tham khảo trong bảng hàng. Hãy xác nhận giá, chính sách và trạng thái thực tế cùng đội ngũ tư vấn trước khi giao dịch.`, href: projectPath(project.id, 'inventory'), action: 'Mở bảng hàng'},
      ],
    })),
    {id: 'guides', title: 'Hướng dẫn sử dụng', group: 'guides' as const, questions: guides.filter(guide => guide.visible).map(guide => ({id: 'guide-' + guide.id, title: guide.title, body: guide.body}))},
    {id: 'consultation', title: 'Tư vấn và giao dịch', group: 'guides' as const, questions: faq.map((question, index) => ({id: 'consultation-' + index, title: question.question, body: question.answer}))},
  ], [projects, units, guides, faq]);
  const activeTopic = topics.find(topic => topic.id === topicId) || topics[0];
  const needle = normalize(query.trim());
  const visibleQuestions = activeTopic.questions.filter(question => !needle || normalize(question.title + ' ' + question.body).includes(needle));
  const expandedQuestion = openQuestion === null ? visibleQuestions[0]?.id : openQuestion;
  const questionCount = topics.reduce((count, topic) => count + topic.questions.length, 0);
  const latestArticles = [...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const selectTopic = (id: string) => {setTopicId(id); setQuery(''); setOpenQuestion(null);};

  return <main className="ah" id="ah-top">
    <section className="ah-hero" aria-labelledby="ah-title">
      <div className="ah-hero-background" aria-hidden="true"><Cover src={featured?.image || ''} alt="" hero fallback={featured?.id === 'green-paradise' ? '/images/green-paradise.webp' : undefined}/></div>
      <div className="ah-container">
        <h1 id="ah-title">Tư vấn cùng <span>AlphaHub</span></h1>
        <div className="ah-service-grid">
          <div className="ah-glass ah-consult-card" id="ah-tu-van">
            <h2>Yêu cầu tư vấn</h2>
            <AlphaHubRequestForm kind="consultation" projects={projects}/>
          </div>
          <article className="ah-glass ah-service-card">
            <span className="ah-service-icon"><CalendarDays size={27} aria-hidden="true"/></span>
            <h2>Đặt lịch tham quan</h2>
            <p>Trực tiếp tham quan, tìm hiểu dự án và trải nghiệm không gian sống cùng đội ngũ AlphaHub.</p>
            <button className="ah-text-link" type="button" onClick={() => setVisitOpen(true)}>Đặt lịch ngay <ArrowRight size={18} aria-hidden="true"/></button>
          </article>
          <article className="ah-glass ah-service-card ah-lookup-card">
            <span className="ah-service-icon"><Search size={27} aria-hidden="true"/></span>
            <h2>Tra cứu<br className="ah-desktop-break"/> mã căn</h2>
            <p>Tìm sản phẩm bạn quan tâm trong quỹ căn AlphaHub.</p>
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

    <section className="ah-faq-section" id="ah-cau-hoi" aria-labelledby="ah-faq-title">
      <div className="ah-container">
        <h2 id="ah-faq-title">Câu hỏi thường gặp <span>({questionCount})</span></h2>
        <div className="ah-faq-layout">
          <nav className="ah-glass ah-faq-sidebar" aria-label="Danh mục câu hỏi">
            <h3>Dự án, khu và tiện ích</h3>
            {topics.filter(topic => topic.group === 'projects').map(topic => <button type="button" key={topic.id} aria-pressed={activeTopic.id === topic.id} onClick={() => selectTopic(topic.id)}>{topic.title}</button>)}
            <h3>Hướng dẫn và thủ tục</h3>
            {topics.filter(topic => topic.group === 'guides').map(topic => <button type="button" key={topic.id} aria-pressed={activeTopic.id === topic.id} onClick={() => selectTopic(topic.id)}>{topic.title}</button>)}
          </nav>
          <label className="ah-glass ah-mobile-topics"><span>Danh mục câu hỏi</span><span className="ah-select-wrap"><select aria-label="Danh mục câu hỏi" value={activeTopic.id} onChange={event => selectTopic(event.target.value)}><optgroup label="Dự án, khu và tiện ích">{topics.filter(topic => topic.group === 'projects').map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</optgroup><optgroup label="Hướng dẫn và thủ tục">{topics.filter(topic => topic.group === 'guides').map(topic => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</optgroup></select><ChevronDown size={18} aria-hidden="true"/></span></label>
          <div className="ah-faq-panel">
            <div className="ah-faq-panel-heading"><h3>{activeTopic.group === 'projects' ? 'Dự án, khu và tiện ích' : 'Hướng dẫn và thủ tục'}</h3><label className="ah-search-input"><Search size={18} aria-hidden="true"/><input type="search" aria-label="Tìm kiếm câu hỏi" placeholder="Nhập từ khóa để tìm kiếm" value={query} onChange={event => {setQuery(event.target.value); setOpenQuestion(null);}}/></label></div>
            <p className="ah-topic-title">{activeTopic.title}</p>
            <div className="ah-questions" aria-live="polite">
              {visibleQuestions.map(question => <details key={question.id} open={expandedQuestion === question.id}><summary onClick={event => {event.preventDefault(); setOpenQuestion(expandedQuestion === question.id ? '' : question.id);}}><span>{question.title}</span>{expandedQuestion === question.id ? <Minus size={19} aria-hidden="true"/> : <Plus size={19} aria-hidden="true"/>}</summary><div className="ah-answer"><p>{question.body}</p>{question.href && <Link className="ah-answer-link" href={question.href}>{question.action} <ArrowRight size={15} aria-hidden="true"/></Link>}</div></details>)}
              {!visibleQuestions.length && <div className="ah-faq-empty"><p>Chưa có câu hỏi phù hợp.</p>{query && <button type="button" onClick={() => setQuery('')}>Xóa từ khóa</button>}<a href="#ah-chia-se">Gửi câu hỏi cho AlphaHub <ArrowRight size={15}/></a></div>}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="ah-share-section" id="ah-chia-se" aria-labelledby="ah-share-title">
      <div className="ah-glass ah-share-card">
        <h2 id="ah-share-title">Góc chia sẻ</h2>
        <p>Chia sẻ thắc mắc để AlphaHub đồng hành cùng bạn trong hành trình tìm hiểu bất động sản.</p>
        <AlphaHubRequestForm kind="question" projects={projects}/>
      </div>
    </section>

    <section className="ah-news-section" aria-labelledby="ah-news-title">
      <div className="ah-container">
        <div className="ah-news-heading"><h2 id="ah-news-title">Tin tức</h2><div><p>Khám phá thông tin dự án, kiến thức và trải nghiệm giúp bạn tìm thấy không gian sống phù hợp.</p><Link className="ah-button ah-news-button" href="/tin-tuc">Khám phá ngay <ArrowRight size={18} aria-hidden="true"/></Link></div></div>
        <div className="ah-news-grid">{latestArticles.map(article => <article key={article.id} className="ah-news-card"><Link className="ah-news-cover" href={'/tin-tuc/' + encodeURIComponent(article.id)} aria-label={`Đọc ${article.title}`}><Cover src={article.image} alt={article.title}/></Link><h3><Link href={'/tin-tuc/' + encodeURIComponent(article.id)}>{article.title}</Link></h3><p>{article.body.replace(/\s+/g, ' ').trim().slice(0, 250)}</p><time dateTime={article.date}>{formatDate(article.date)}</time></article>)}</div>
        {!latestArticles.length && <p className="ah-news-empty">Bài viết mới đang được cập nhật.</p>}
      </div>
    </section>

    <aside className="ah-contact-strip" aria-label="Liên hệ AlphaHub"><div className="ah-container"><span>Cùng AlphaHub tìm lựa chọn phù hợp.</span><a href={`tel:${contact.phone}`}><Phone size={17} aria-hidden="true"/>{contact.phone}</a><a href={contact.zaloHref} target="_blank" rel="noreferrer">Nhắn Zalo <ArrowRight size={16} aria-hidden="true"/></a><a href={`mailto:${contact.email}`}><Mail size={17} aria-hidden="true"/>Email tư vấn</a></div></aside>

    <Dialog open={visitOpen} onOpenChange={setVisitOpen}><DialogContent className="ah-dialog"><DialogHeader><DialogTitle>Đặt lịch tham quan</DialogTitle><DialogDescription>Chọn dự án và thời gian mong muốn. Đội ngũ AlphaHub sẽ liên hệ xác nhận lịch với bạn.</DialogDescription></DialogHeader><AlphaHubRequestForm kind="visit" projects={projects}/></DialogContent></Dialog>
  </main>;
}
