'use client';
/* Project "Tổng quan" (Spaciaz main-demo style) built to look complete with few photos: one hero photo,
 * one feature photo, everything else typographic cards. Unit figures come from the live inventory. */
import {ArrowUpRight, Building2, FileText, Globe, GraduationCap, Images, Leaf, List, Map, MapPin, Phone, Sparkles, Trees} from 'lucide-react';
import type {Asset, Project, Unit} from '@/lib/catalog';
import type {ProjectProfile} from '@/lib/project-profiles';
import type {PublicContact} from '@/lib/public-contact';
import {Eyebrow, Img, LeadForm} from './spaciaz';

const lines = (t: string) => t.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br/>}</span>);
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});

export default function ProjectOverviewHome({project, profile, units, assets, statusOf, contact, onTab}: {project: Project; profile: ProjectProfile; units: Unit[]; assets: Asset[]; statusOf: (u: Unit) => string; contact: PublicContact; onTab: (tab: string) => void}) {
  const extra = assets.filter(a => ['gallery', 'amenity', 'model'].includes(a.kind)).map(a => a.url);
  const feature = extra[0] || project.image;
  const free = units.filter(u => statusOf(u) === 'Còn hàng');
  const prices = units.map(u => u.price).filter(p => p > 0);
  const picks = [...free].sort((a, b) => a.price - b.price).slice(0, 4);
  const amenityIcons = [Trees, GraduationCap, Sparkles, Leaf];
  const explore = [
    {title: 'Quỹ căn 360°', body: 'Phối cảnh và vị trí từng căn trên bản đồ dự án.', tab: 'vr', Icon: Globe},
    {title: 'Bảng hàng', body: `${units.length} căn · ${free.length} còn hàng`, tab: 'inventory', Icon: List},
    {title: 'Mặt bằng', body: 'Tổng mặt bằng và vị trí các phân khu.', tab: 'plan', Icon: Map},
    {title: 'Thư viện', body: 'Hình ảnh phối cảnh và tiện ích dự án.', tab: 'gallery', Icon: Images},
    {title: 'Tài liệu', body: 'Bảng giá, chính sách bán hàng.', tab: 'document', Icon: FileText},
  ];
  return <div className="sz pvh">
    <section className="pvh-hero"><Img w={2560} eager src={project.image} alt={project.name}/>
      <div className="pvh-hero-copy"><Eyebrow light>{project.name}</Eyebrow><h2>{lines(profile.headline)}</h2><p>{profile.intro}</p>
        <div className="pvh-hero-btns"><button type="button" className="sz-btn is-white" onClick={() => onTab('vr')}><span>Khám phá quỹ căn 360°</span><i><ArrowUpRight size={16}/></i></button>
          <button type="button" className="sz-btn is-mint" onClick={() => onTab('inventory')}><span>Xem bảng hàng</span><i><ArrowUpRight size={16}/></i></button></div></div>
      <dl className="pvh-stats">{profile.stats.map(s => <div key={s.label}><dt>{s.value}<small>{s.suffix}</small></dt><dd>{s.label}</dd></div>)}
        <div><dt>{units.length}<small>căn</small></dt><dd>Trong bảng hàng · {free.length} còn hàng</dd></div></dl>
    </section>

    <section className="pvh-about">
      <div><Eyebrow>Về dự án</Eyebrow><h3>{lines(profile.focus.title)}</h3></div>
      <div><p className="pvh-lead">{profile.focus.body}</p>
        <div className="pvh-facts"><div><Building2 size={20}/><span>Chủ đầu tư</span><b>{project.developer}</b></div><div><MapPin size={20}/><span>Vị trí</span><b>{project.location}</b></div><div><Leaf size={20}/><span>Trạng thái</span><b>{project.status}</b></div></div></div>
    </section>

    <section className="pvh-explore">{explore.map(({title, body, tab, Icon}, i) => <button type="button" key={tab} className="pvh-card" onClick={() => onTab(tab)}>
      <small>0{i + 1}</small><Icon size={30} strokeWidth={1.5}/><strong>{title}</strong><p>{body}</p><i><ArrowUpRight size={16}/></i></button>)}</section>

    <section className="pvh-zones">
      <div className="pvh-zones-head"><Eyebrow light>Phân khu</Eyebrow><h3>{profile.zones.length} khu chủ đề</h3></div>
      <div className="pvh-zone-grid">{profile.zones.map(z => <button type="button" key={z.code} className="pvh-zone" onClick={() => onTab('zones')}>
        <span>{z.code}</span><strong>{z.name}</strong><em>{z.local}{z.area ? ' · ' + z.area : ''}</em><p>{z.body}</p></button>)}</div>
    </section>

    <section className="pvh-why">
      <div className="pvh-why-photo"><Img w={1600} src={feature} alt=""/><span><b>{project.name}</b>{project.location}</span></div>
      <div><Eyebrow>{profile.focus.eyebrow}</Eyebrow><h3>Tiện ích nổi bật</h3>
        <ul>{profile.amenities.map((a, i) => {const Icon = amenityIcons[i % amenityIcons.length]; return <li key={a.title}><i><Icon size={20}/></i><div><strong>{a.title}</strong><p>{a.body}</p></div></li>;})}</ul></div>
    </section>

    <section className="pvh-time">
      <div className="pvh-time-head"><Eyebrow>Tiến độ</Eyebrow><h3>Các mốc phát triển</h3></div>
      <ol>{profile.timeline.map((t, i) => <li key={t.title}><span>{String(i + 1).padStart(2, '0')}</span><strong>{t.title}</strong><p>{t.body}</p></li>)}</ol>
    </section>

    {units.length > 0 && <section className="pvh-inv">
      <div className="pvh-inv-head"><div><Eyebrow light>Quỹ căn dự án</Eyebrow><h3>{units.length} căn trong bảng hàng</h3><p>{free.length} căn còn hàng{prices.length ? ` · giá từ ${fmt(Math.min(...prices))} đến ${fmt(Math.max(...prices))} tỷ` : ''}</p></div>
        <button type="button" className="sz-btn is-mint" onClick={() => onTab('inventory')}><span>Xem toàn bộ bảng hàng</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="pvh-inv-grid">{picks.map(u => <button type="button" key={u.id} onClick={() => onTab('inventory')}><b>{u.code}</b><span>{u.type}{u.area ? ` · ${fmt(u.area)} m²` : ''}</span><strong>{u.price ? `${fmt(u.price)} tỷ` : 'Liên hệ'}</strong></button>)}</div>
    </section>}

    <section className="pvh-enquiry">
      <div><Eyebrow>Tư vấn nhanh</Eyebrow><h3>Nhận bảng giá &<br/>lịch tham quan</h3><p>Đội ngũ tư vấn gửi thông tin {project.name} mới nhất cho bạn.</p>
        <a href={`tel:${contact.phone}`}><i><Phone size={18}/></i><span><small>Hotline / Zalo</small><b>{contact.phone}</b></span></a></div>
      <LeadForm projects={[project]} note={`Tư vấn ${project.name} (trang Tổng quan dự án)`} compact/>
    </section>
    <p className="pov-sources">Thông tin tổng quan tham khảo từ nguồn công khai: {profile.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}. Thông tin có thể thay đổi theo chủ đầu tư.</p>
  </div>;
}
