'use client';

import {useState} from 'react';
import {Plus, Search} from 'lucide-react';
import type {Guide} from '@/lib/site-content';

export default function GuideCenter({brand, guides}: {brand: string; guides: Guide[]}) {
  const [query, setQuery] = useState('');
  const visible = guides.filter(guide => guide.visible && (guide.title + ' ' + guide.body).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  return <><section className="compact-hero"><div className="container"><span className="eyebrow">TRUNG TÂM HỖ TRỢ</span><h1>Hướng dẫn sử dụng</h1><div className="searchbox"><Search size={18}/><input type="search" aria-label="Tìm kiếm hướng dẫn" placeholder="Tìm kiếm hướng dẫn..." value={query} onChange={event => setQuery(event.target.value)}/></div></div></section><section className="container guide-list"><h2>Bắt đầu với {brand}</h2>{visible.map((guide, index) => <details key={guide.id}><summary><span className="guide-number">{String(index + 1).padStart(2, '0')}</span>{guide.title}<Plus size={18}/></summary><p style={{whiteSpace: 'pre-line'}}>{guide.body}</p></details>)}{visible.length === 0 && <p className="muted">Chưa có hướng dẫn phù hợp.</p>}</section></>;
}
