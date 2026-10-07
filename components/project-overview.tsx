'use client';
/* Project "Tổng quan" in the Spaciaz home-10 layout: photo hero with stats, zone accordion, photo + card,
 * staggered numbered steps, photo grid, highlights, enquiry form. Units come from the live inventory. */
import {useState} from 'react';
import {ArrowUpRight, MapPin, Phone, Plus} from 'lucide-react';
import type {Asset, Project, Unit} from '@/lib/catalog';
import type {ProjectProfile} from '@/lib/project-profiles';
import type {PublicContact} from '@/lib/public-contact';
import {Eyebrow, Img, LeadForm} from './spaciaz';

const lines = (t: string) => t.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br/>}</span>);
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});

export default function ProjectOverview({project, profile, units, assets, statusOf, contact, onTab}: {project: Project; profile: ProjectProfile; units: Unit[]; assets: Asset[]; statusOf: (u: Unit) => string; contact: PublicContact; onTab: (tab: string) => void}) {
  const [open, setOpen] = useState(0);
  const photos = [project.image, ...assets.filter(a => ['gallery', 'amenity', 'model'].includes(a.kind)).map(a => a.url)];
  const photo = (i: number) => photos[i % photos.length];
  const free = units.filter(u => statusOf(u) === 'Còn hàng');
  const prices = units.map(u => u.price).filter(p => p > 0);
  const tile = (label: string, tab: string, i: number) => ({label, tab, src: photo(i + 1)});
  const tiles = [tile('Thư viện ảnh', 'gallery', 0), tile('Tiện ích', 'amenity', 1), tile('Mặt bằng dự án', 'plan', 2), tile('Nhà mẫu', 'model', 3)];
  return <div className="pov">
    <section className="pov-hero"><Img w={2560} eager src={project.image} alt={project.name}/>
      <div className="pov-hero-copy"><h2>{lines(profile.headline)}</h2><p>{profile.intro}</p>
        <button type="button" className="sz-btn is-white" onClick={() => onTab('vr')}><span>Khám phá quỹ căn 360°</span><i><ArrowUpRight size={16}/></i></button></div>
      <dl className="pov-stats">{profile.stats.map(s => <div key={s.label}><dt><span className="fx-count">{s.value}</span>{s.suffix ? <small>{s.suffix}</small> : <sup>+</sup>}</dt><dd>{s.label}</dd></div>)}</dl>
    </section>

    <section className="pov-sec">
      <div className="pov-head"><div><Eyebrow>Phân khu dự án</Eyebrow><h3>Bốn phân khu,<br/>một siêu đô thị biển</h3></div><button type="button" className="sz-btn is-ghost" onClick={() => onTab('zones')}><span>Xem phân khu</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="pov-acc">{profile.zones.map((z, i) => <div key={z.code} className={'pov-acc-row' + (open === i ? ' is-open' : '')}>
        <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><small>{z.code}.</small><strong>{z.name}<em>{z.local} · {z.area}</em></strong><Plus size={18}/></button>
        <div className="pov-acc-body"><div><p>{z.body}</p><button type="button" className="pov-link" onClick={() => onTab(i === 0 ? 'inventory' : 'zones')}>{i === 0 ? 'Xem quỹ căn phân khu' : 'Tìm hiểu thêm'}<i><ArrowUpRight size={15}/></i></button></div><Img w={1280} src={photo(i)} alt={z.name}/></div>
      </div>)}</div>
    </section>

    <section className="pov-focus"><Img w={2560} src={photo(1)} alt=""/>
      <div className="pov-focus-card"><Eyebrow>{profile.focus.eyebrow}</Eyebrow><h3>{lines(profile.focus.title)}</h3><p>{profile.focus.body}</p><button type="button" className="pov-link" onClick={() => onTab('amenity')}>Khám phá tiện ích<i><ArrowUpRight size={15}/></i></button></div>
    </section>

    <section className="pov-sec">
      <div className="pov-steps-head"><Eyebrow>Hạ tầng & tiến độ</Eyebrow><h3>Từng bước hình thành<br/>đô thị biển</h3></div>
      <div className="pov-steps">{profile.timeline.map((s, i) => <div key={s.title} className="pov-step" style={{['--i' as string]: i % 3}}>
        <span className="pov-num">{String(i + 1).padStart(2, '0')}</span><strong>{s.title}</strong><p>{s.body}</p></div>)}
        <div className="pov-step-photo"><Img w={1280} src={photo(2)} alt=""/></div></div>
    </section>

    <section className="pov-band">
      <div className="pov-head"><div><Eyebrow>Hình ảnh & không gian</Eyebrow><h3>Khám phá<br/>{project.name}</h3></div><button type="button" className="sz-btn is-ghost" onClick={() => onTab('gallery')}><span>Xem thư viện</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="pov-grid">{tiles.map(t => <button type="button" key={t.label} onClick={() => onTab(t.tab)} className="pov-tile">
        <span className="pov-tile-img"><Img w={1280} src={t.src} alt={t.label}/><em>{project.status}</em></span>
        <small><MapPin size={13}/>{project.location}</small><strong>{t.label}</strong></button>)}</div>
    </section>

    <section className="pov-sec pov-center">
      <Eyebrow>Tiện ích nổi bật</Eyebrow><h3>Điểm nhấn của dự án</h3>
      <div className="pov-cards">{profile.amenities.map(a => <article key={a.title}><span className="pov-star">★★★★★</span><strong>“{a.title}”</strong><p>{a.body}</p></article>)}</div>
    </section>

    <section className="pov-inv">
      <div><Eyebrow>Quỹ căn dự án</Eyebrow><h3>{units.length} căn trong bảng hàng</h3><p>{free.length} căn còn hàng{prices.length ? ` · giá từ ${fmt(Math.min(...prices))} đến ${fmt(Math.max(...prices))} tỷ` : ''}. Dữ liệu theo bảng hàng cập nhật của dự án.</p></div>
      <div className="pov-inv-actions"><button type="button" className="sz-btn is-mint" onClick={() => onTab('inventory')}><span>Xem bảng hàng</span><i><ArrowUpRight size={16}/></i></button><button type="button" className="sz-btn is-ghost" onClick={() => onTab('vr')}><span>Quỹ căn 360°</span><i><ArrowUpRight size={16}/></i></button></div>
    </section>

    <section className="pov-enquiry"><Img w={2560} src={photo(3)} alt=""/>
      <div className="pov-enquiry-form"><p>Để lại thông tin, đội ngũ tư vấn gửi bảng giá, chính sách và lịch tham quan {project.name}.</p><LeadForm projects={[project]} note={`Tư vấn ${project.name} (trang Tổng quan dự án)`} compact/></div>
      <div className="pov-enquiry-copy"><Eyebrow light>Tư vấn nhanh</Eyebrow><h3>Nhận thông tin<br/>mới nhất</h3><a href={`tel:${contact.phone}`}><i><Phone size={18}/></i><span><small>Hotline / Zalo</small><b>{contact.phone}</b></span></a></div>
    </section>
    <p className="pov-sources">Thông tin tổng quan tham khảo từ nguồn công khai: {profile.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}. Thông tin có thể thay đổi theo chủ đầu tư.</p>
  </div>;
}
