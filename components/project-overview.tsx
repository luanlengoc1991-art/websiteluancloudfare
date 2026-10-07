'use client';
/* Project "Tổng quan" in the Spaciaz home-5 layout: dark hero with pill photos, name strip, who-we-are with big
 * figures, subdivision cards over a dark band, media grid, photo call-out, staggered numbered steps, highlight
 * slider, live inventory summary and enquiry. Units come from the live inventory only. */
import {useEffect, useState} from 'react';
import {ArrowUpRight, ChevronLeft, ChevronRight, Leaf, MapPin, Palmtree, Phone} from 'lucide-react';
import type {Asset, Project, Unit} from '@/lib/catalog';
import type {ProjectProfile} from '@/lib/project-profiles';
import type {PublicContact} from '@/lib/public-contact';
import {Eyebrow, Img, LeadForm} from './spaciaz';

const lines = (t: string) => t.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br/>}</span>);
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});

export default function ProjectOverview({project, profile, units, assets, statusOf, contact, onTab}: {project: Project; profile: ProjectProfile; units: Unit[]; assets: Asset[]; statusOf: (u: Unit) => string; contact: PublicContact; onTab: (tab: string) => void}) {
  const photos = [project.image, ...assets.filter(a => ['gallery', 'amenity', 'model'].includes(a.kind)).map(a => a.url)];
  const photo = (i: number) => photos[i % photos.length];
  const free = units.filter(u => statusOf(u) === 'Còn hàng');
  const prices = units.map(u => u.price).filter(p => p > 0);
  const [slide, setSlide] = useState(0);
  const n = profile.amenities.length;
  useEffect(() => {if (n < 2) return; const t = setTimeout(() => setSlide(s => (s + 1) % n), 6000); return () => clearTimeout(t);}, [slide, n]);
  const strip = [project.developer, ...profile.zones.map(z => z.name), ...profile.amenities.map(a => a.title), project.location];
  const tiles = [['Thư viện ảnh', 'gallery'], ['Tiện ích', 'amenity'], ['Mặt bằng dự án', 'plan'], ['Nhà mẫu', 'model']] as const;
  return <div className="p5">
    <section className="p5-hero">
      <h2>{lines(profile.headline)}</h2>
      <button type="button" className="sz-btn is-white p5-hero-btn" onClick={() => onTab('vr')}><span>Khám phá quỹ căn 360°</span><i><ArrowUpRight size={16}/></i></button>
      <div className="p5-hero-foot"><p>{profile.intro}</p><div className="p5-pills">{[0, 1, 2].map(i => <span key={i}><Img w={640} src={photo(i)} alt=""/></span>)}</div></div>
    </section>

    <section className="p5-strip"><p>{project.name} · {project.location}</p>
      <div className="p5-strip-track">{[0, 1].map(k => <span key={k} aria-hidden={k > 0 || undefined}>{strip.map((s, i) => <b key={i}>{s}</b>)}</span>)}</div></section>

    <section className="p5-who">
      <div><Eyebrow>Về dự án</Eyebrow><h3>{lines(profile.focus.title)}</h3><span className="p5-who-art"><Img w={1280} src={photo(1)} alt=""/></span></div>
      <div>
        <div className="p5-who-cols">
          <div><Palmtree size={44} strokeWidth={1.2}/><strong>Nghỉ dưỡng <i/></strong><p>{profile.zones[0]?.body.split(':')[1]?.split('.')[0]?.trim() || profile.focus.body}</p></div>
          <div><Leaf size={44} strokeWidth={1.2}/><strong>Sinh thái biển <i/></strong><p>{profile.intro.split(':')[1]?.trim() || profile.intro}</p></div>
        </div>
        {profile.stats.map(s => <div key={s.label} className="p5-fig"><strong><span className="fx-count">{s.value}</span>{s.suffix && <small>{s.suffix}</small>}</strong><span><b>{s.label}</b></span></div>)}
      </div>
    </section>

    <section className="p5-zones">
      <div className="p5-zones-bg"><Img w={2560} src={photo(2)} alt=""/></div>
      <div className="p5-center"><Eyebrow light>Phân khu dự án</Eyebrow><h3>Bốn phân khu</h3></div>
      <div className="p5-zone-grid">{profile.zones.map((z, i) => <button type="button" key={z.code} className="p5-zone" onClick={() => onTab(i === 0 ? 'inventory' : 'zones')}>
        <span className="p5-zone-img"><Img w={1280} src={photo(i)} alt={z.name}/><i><ArrowUpRight size={16}/></i></span>
        <strong>{z.name}</strong><small>{z.local} · {z.area}</small><p>{z.body}</p></button>)}</div>
    </section>

    <section className="p5-sec">
      <div className="p5-head"><div><Eyebrow>Hình ảnh & không gian</Eyebrow><h3>Khám phá<br/>dự án</h3></div><button type="button" className="sz-btn is-ghost" onClick={() => onTab('gallery')}><span>Xem thư viện</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="p5-grid">{tiles.map(([label, tab], i) => <button type="button" key={tab} className="p5-tile" onClick={() => onTab(tab)}>
        <span className="p5-tile-img"><Img w={1280} src={photo(i + 1)} alt={label}/><em>{project.status}</em></span>
        <small><MapPin size={13}/>{project.location}</small><strong>{label}</strong></button>)}</div>
    </section>

    <section className="p5-callout"><Img w={2560} src={photo(3)} alt=""/>
      <div><h3>{lines(profile.headline)}</h3><div className="p5-callout-foot"><p>{profile.focus.body}</p><button type="button" className="sz-btn is-mint" onClick={() => onTab('amenity')}><span>Khám phá tiện ích</span><i><ArrowUpRight size={16}/></i></button></div></div>
    </section>

    <section className="p5-sec">
      <div className="p5-values-head"><Eyebrow>Hạ tầng & tiến độ</Eyebrow><h3>Từng bước hình thành<br/>đô thị biển</h3></div>
      <div className="p5-values">{profile.timeline.map((s, i) => <div key={s.title} className="p5-value" style={{['--i' as string]: i % 3}}>
        <span>{String(i + 1).padStart(2, '0')}.</span><strong>{s.title}</strong><p>{s.body}</p></div>)}
        <button type="button" className="p5-value is-inv" style={{['--i' as string]: profile.timeline.length % 3}} onClick={() => onTab('inventory')}>
          <span>{String(profile.timeline.length + 1).padStart(2, '0')}.</span><strong>{units.length} căn trong bảng hàng</strong><p>{free.length} căn còn hàng{prices.length ? ` · giá từ ${fmt(Math.min(...prices))} đến ${fmt(Math.max(...prices))} tỷ` : ''}. Xem bảng hàng →</p></button></div>
    </section>

    <section className="p5-quote"><Img w={2560} src={photo(0)} alt=""/>
      <span className="p5-badge">★ Điểm nhấn của dự án</span>
      <div className="p5-quote-body">
        <button type="button" aria-label="Trước" onClick={() => setSlide((slide - 1 + n) % n)}><ChevronLeft size={18}/></button>
        <blockquote key={slide}><p>“{profile.amenities[slide]?.title}”</p><footer>{profile.amenities[slide]?.body}</footer></blockquote>
        <button type="button" aria-label="Tiếp" onClick={() => setSlide((slide + 1) % n)}><ChevronRight size={18}/></button>
      </div>
    </section>

    <section className="p5-enquiry">
      <div><Eyebrow>Tư vấn nhanh</Eyebrow><h3>Nhận thông tin<br/>mới nhất</h3><p>Bảng giá, chính sách và lịch tham quan {project.name}.</p>
        <a href={`tel:${contact.phone}`}><i><Phone size={18}/></i><span><small>Hotline / Zalo</small><b>{contact.phone}</b></span></a></div>
      <LeadForm projects={[project]} note={`Tư vấn ${project.name} (trang Tổng quan dự án)`} compact/>
    </section>
    <p className="p5-sources">Thông tin tổng quan tham khảo từ nguồn công khai: {profile.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}. Thông tin có thể thay đổi theo chủ đầu tư.</p>
  </div>;
}
