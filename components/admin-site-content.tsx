'use client';

import {useEffect, useRef, useState} from 'react';
import {Plus, Save} from 'lucide-react';
import type {Project} from '@/lib/catalog';
import type {AboutContent, Guide} from '@/lib/site-content';

export function useContentDraft<T>(initial: T) {
  const [draft, setDraft] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const current = useRef(initial);
  useEffect(() => {if (!dirty) {current.current = initial; setDraft(initial);}}, [initial, dirty]);
  return {draft, edit: (value: T) => {current.current = value; setDraft(value); setDirty(true);}, saved: (value: T) => {if (current.current === value) setDirty(false);}};
}

export function AdminAbout({content, projects, busy, onSave}: {content: AboutContent; projects: Project[]; busy: boolean; onSave: (data: AboutContent) => Promise<boolean>}) {
  const {draft, edit, saved} = useContentDraft(content);
  const text = (key: keyof AboutContent, label: string, multiline = false, hint = '') => <label className="field" key={key}><span>{label}</span>{multiline ? <textarea rows={3} maxLength={5000} value={String(draft[key])} onChange={event => edit({...draft, [key]: event.target.value})}/> : <input maxLength={300} value={String(draft[key])} onChange={event => edit({...draft, [key]: event.target.value})}/>} {hint && <small>{hint}</small>}</label>;
  return <form className="admin-content-form" onSubmit={async event => {event.preventDefault(); if (await onSave(draft)) saved(draft);}}>
    <div className="settings-card"><h2>Nội dung giới thiệu</h2><p>Chỉnh sửa nội dung đang hiển thị ở trang Giới thiệu.</p><div className="form-grid">{text('headline', 'Tiêu đề chính', false, 'Để trống để dùng tên nền tảng trong Cài đặt.')}{text('introduction', 'Lời giới thiệu', true, 'Để trống để dùng lời giới thiệu mặc định.')}</div></div>
    <div className="settings-card"><h2>Dự án xuất hiện trên trang</h2><p>Tên, ảnh, vị trí và số căn lấy trực tiếp từ Dự án và Quỹ căn.</p><div className="form-grid"><label className="field"><span>Dự án nổi bật</span><select value={draft.featuredProjectId} onChange={event => edit({...draft, featuredProjectId: event.target.value})}>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>{text('featuredScale', 'Quy mô dự án')}{text('featuredTagline', 'Mô tả ngắn dự án', true)}</div><fieldset className="admin-project-options"><legend>Dự án gợi ý (tối đa 6)</legend>{projects.map(project => <label key={project.id}><input type="checkbox" checked={draft.selectedProjectIds.includes(project.id)} disabled={!draft.selectedProjectIds.includes(project.id) && draft.selectedProjectIds.length >= 6} onChange={event => edit({...draft, selectedProjectIds: event.target.checked ? [...draft.selectedProjectIds, project.id] : draft.selectedProjectIds.filter(id => id !== project.id)})}/>{project.name}</label>)}</fieldset></div>
    <div className="settings-card"><h2>Các phần nội dung</h2><div className="form-grid">{text('platformTitle', 'Tiêu đề về nền tảng', true)}{text('platformBody', 'Mô tả nền tảng', true)}{text('journeyTitle', 'Tiêu đề hành trình')}{text('newsTitle', 'Tiêu đề tin tức')}{text('contactTitle', 'Tiêu đề tư vấn', true)}{text('contactBody', 'Mô tả tư vấn', true)}</div><p>Hotline, email và Zalo dùng chung với mục Cài đặt.</p></div>
    <div className="settings-card"><h2>Câu hỏi thường gặp</h2>{draft.faq.map((item, index) => <div className="admin-faq-editor" key={index}><label className="field"><span>Câu hỏi {index + 1}</span><input required maxLength={300} value={item.question} onChange={event => edit({...draft, faq: draft.faq.map((faq, i) => i === index ? {...faq, question: event.target.value} : faq)})}/></label><label className="field"><span>Trả lời</span><textarea required rows={3} maxLength={5000} value={item.answer} onChange={event => edit({...draft, faq: draft.faq.map((faq, i) => i === index ? {...faq, answer: event.target.value} : faq)})}/></label><button className="button subtle" type="button" onClick={() => edit({...draft, faq: draft.faq.filter((_, i) => i !== index)})}>Bỏ câu hỏi</button></div>)}<button className="button subtle" type="button" disabled={draft.faq.length >= 12} onClick={() => edit({...draft, faq: [...draft.faq, {question: '', answer: ''}]})}><Plus size={16}/>Thêm câu hỏi</button></div>
    <button className="button dark" disabled={busy}><Save size={17}/>{busy ? 'Đang lưu…' : 'Lưu trang giới thiệu'}</button>
  </form>;
}

function GuideForm({guide, busy, onSave}: {guide: Guide; busy: boolean; onSave: (data: Guide) => Promise<boolean>}) {
  const {draft, edit, saved} = useContentDraft(guide);
  return <form className="settings-card record-form" onSubmit={async event => {event.preventDefault(); if (await onSave(draft)) saved(draft);}}><h2>{guide.id === draft.id && guide.title ? 'Chỉnh sửa hướng dẫn' : 'Thêm hướng dẫn'}</h2><label className="field"><span>Tiêu đề</span><input required maxLength={300} value={draft.title} onChange={event => edit({...draft, title: event.target.value})}/></label><label className="field"><span>Nội dung</span><textarea required rows={10} maxLength={20000} value={draft.body} onChange={event => edit({...draft, body: event.target.value})}/></label><div className="form-grid"><label className="field"><span>Thứ tự hiển thị</span><input type="number" required min={1} max={1000} value={draft.order} onChange={event => edit({...draft, order: Number(event.target.value)})}/></label><label className="admin-check"><input type="checkbox" checked={draft.visible} onChange={event => edit({...draft, visible: event.target.checked})}/>Hiển thị ngoài website</label></div><button className="button dark" disabled={busy}><Save size={17}/>{busy ? 'Đang lưu…' : 'Lưu hướng dẫn'}</button></form>;
}

export function AdminGuides({guides, busy, onSave}: {guides: Guide[]; busy: boolean; onSave: (data: Guide) => Promise<boolean>}) {
  const [selected, setSelected] = useState(guides[0]?.id || '');
  const [newGuide, setNewGuide] = useState<Guide | null>(null);
  const active = guides.find(guide => guide.id === selected) || newGuide;
  return <div className="admin-guides"><div className="settings-card"><h2>Danh sách hướng dẫn</h2><p>Nội dung lưu ở backend và dùng chung với trang Hướng dẫn.</p><button className="button dark" type="button" disabled={busy} onClick={() => {const guide = {id: crypto.randomUUID(), title: '', body: '', order: Math.min(1000, Math.max(0, ...guides.map(item => item.order)) + 1), visible: true}; setNewGuide(guide); setSelected(guide.id);}}><Plus size={16}/>Thêm hướng dẫn</button><nav aria-label="Chọn hướng dẫn">{guides.map(guide => <button type="button" key={guide.id} className={selected === guide.id ? 'selected' : ''} onClick={() => {setSelected(guide.id); setNewGuide(null);}}><span>{guide.order}. {guide.title}</span><small>{guide.visible ? 'Đang hiển thị' : 'Đang ẩn'}</small></button>)}</nav></div>{active && <GuideForm key={active.id} guide={active} busy={busy} onSave={onSave}/>}</div>;
}
