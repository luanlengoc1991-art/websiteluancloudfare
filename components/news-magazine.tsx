'use client';
import {useMemo, useState} from 'react';
import Link from './site-link';
import {ArrowLeft, Pencil, Plus, Search} from 'lucide-react';
import ContactForm from './contact-form';
import type {Article} from '@/lib/catalog';

const vnDate = (iso: string) => {
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
};
const excerpt = (body: string) => {
  const text = body.replace(/\s+/g, ' ').trim();
  return text.length > 150 ? text.slice(0, 147).trimEnd() + '…' : text;
};

function Cover({src, alt}: {src: string; alt: string}) {
  const [broken, setBroken] = useState(false);
  if (broken || !src) return <div className="news-fallback" role="img" aria-label={alt}/>;
  return <img src={src} alt={alt} onError={() => setBroken(true)}/>;
}

export default function NewsMagazine({articles, routeId, query, onQuery, category, onCategory, canEdit, onCreate, onEdit}: {articles: Article[]; routeId?: string; query: string; onQuery: (value: string) => void; category: string; onCategory: (value: string) => void; canEdit: boolean; onCreate: () => void; onEdit: (article: Article) => void}) {
  const categories = useMemo(() => ['Tất cả', ...Array.from(new Set(articles.map(article => article.category)))], [articles]);
  const selected = category === 'all' ? 'Tất cả' : category;
  const visible = articles.filter(article => article.title.toLowerCase().includes(query.toLowerCase()) && (selected === 'Tất cả' || article.category === selected));
  const [featured, ...rest] = visible;
  const mosaic = rest.slice(0, 3);
  const rows = rest.slice(3);
  const opened = routeId ? articles.find(article => article.id === routeId) : undefined;

  return <section className="news-magazine">
    <div className="news-hero"><h1>Tin tức</h1></div>
    <div className="news-tabs" role="tablist" aria-label="Chuyên mục tin tức">
      {categories.map(name => <button key={name} type="button" role="tab" aria-selected={selected === name} onClick={() => onCategory(name === 'Tất cả' ? 'all' : name)}>{name}</button>)}
    </div>
    {routeId && <div className="container news-article-wrap">{opened ? <article className="news-article"><Link href="/tin-tuc" className="news-back"><ArrowLeft size={16}/>Tin tức</Link><p>{opened.category} · {vnDate(opened.date)}</p><h2>{opened.title}</h2><Cover src={opened.image} alt={opened.title}/>{opened.body.split('\n').filter(Boolean).map(paragraph => <p key={paragraph}>{paragraph}</p>)}{canEdit && <button className="button subtle" type="button" onClick={() => onEdit(opened)}><Pencil size={15}/>Sửa bài viết</button>}</article> : <div className="news-article"><h2>Không tìm thấy bài viết</h2><p>Bài này không còn trong danh mục.</p><Link href="/tin-tuc" className="news-read">Về tin tức</Link></div>}</div>}
    {!routeId && <div className="container news-layout">
      <div>
        <div className="news-heading"><h2>{selected === 'Tất cả' ? 'Mới cập nhật' : selected}</h2>{canEdit && <button className="news-write" type="button" onClick={onCreate}><Plus size={16}/>Viết bài</button>}</div>
        {featured ? <article className="news-feature">
          <div>
            <h3><Link href={`/tin-tuc/${featured.id}`}>{featured.title}</Link></h3>
            <p>{excerpt(featured.body)}</p>
            <time dateTime={featured.date}>{vnDate(featured.date)}</time>
            <div className="news-feature-actions"><Link className="news-read" href={`/tin-tuc/${featured.id}`}>Đọc bài viết</Link>{canEdit && <button type="button" onClick={() => onEdit(featured)}><Pencil size={15}/>Sửa</button>}</div>
          </div>
          <Link href={`/tin-tuc/${featured.id}`} className="news-feature-photo" aria-label={featured.title}><Cover src={featured.image} alt=""/></Link>
        </article> : <p className="news-empty">Chưa có bài viết phù hợp. Thử chuyên mục hoặc từ khóa khác.</p>}
        {mosaic.length > 0 && <div className="news-mosaic">{mosaic.map(article => <article key={article.id}><Link href={`/tin-tuc/${article.id}`}><Cover src={article.image} alt=""/><strong>{article.title}</strong><time dateTime={article.date}>{vnDate(article.date)}</time></Link>{canEdit && <button type="button" onClick={() => onEdit(article)}>Sửa</button>}</article>)}</div>}
        {rows.length > 0 && <div className="news-rows">{rows.map(article => <article key={article.id}><Link href={`/tin-tuc/${article.id}`} className="news-row-photo" aria-hidden="true"><Cover src={article.image} alt=""/></Link><div><h3><Link href={`/tin-tuc/${article.id}`}>{article.title}</Link></h3><p>{excerpt(article.body)}</p><time dateTime={article.date}>{vnDate(article.date)}</time></div></article>)}</div>}
      </div>
      <aside className="news-side">
        <form className="news-panel" onSubmit={event => event.preventDefault()}>
          <h2>Tìm kiếm</h2>
          <label className="news-search"><Search size={18}/><input type="search" value={query} onChange={event => onQuery(event.target.value)} placeholder="Nhập nội dung cần tìm" aria-label="Tìm bài viết"/></label>
        </form>
        <div className="news-panel news-consult">
          <h2>Tư vấn nhu cầu</h2>
          <ContactForm note="Đăng ký từ trang tin tức"/>
        </div>
      </aside>
    </div>}
  </section>;
}
