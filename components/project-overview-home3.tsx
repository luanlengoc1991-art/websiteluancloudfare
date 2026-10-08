'use client';
/* Project "Tổng quan" in the Spaciaz home-3 style: split hero, numbered cards, pill marquee, staggered
 * counters, icon grid, expanding unit cards (codes from the live inventory, linked to Mặt bằng căn). */
import {useState} from 'react';
import {ArrowUpRight, Award, Building2, Car, GraduationCap, HeartPulse, MapPin, Phone, Play, ShieldCheck, ShoppingBag, Sparkles, Trees, Trophy} from 'lucide-react';
import type {Asset, Project, Unit} from '@/lib/catalog';
import type {ProjectProfile} from '@/lib/project-profiles';
import type {PublicContact} from '@/lib/public-contact';
import {unitPlanPath} from '@/lib/project-routes';
import {Eyebrow, Img, LeadForm} from './spaciaz';

const lines = (t: string) => t.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br/>}</span>);
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});
const amenityIcons = [Trophy, Sparkles, Trees, GraduationCap, ShoppingBag, HeartPulse];

export default function ProjectOverviewHome3({project, profile, units, assets, statusOf, contact, onTab}: {project: Project; profile: ProjectProfile; units: Unit[]; assets: Asset[]; statusOf: (u: Unit) => string; contact: PublicContact; onTab: (tab: string) => void}) {
  const photos = [project.image, ...assets.filter(a => ['gallery', 'amenity', 'model'].includes(a.kind)).map(a => a.url)].filter(Boolean);
  const photo = (i: number) => photos[i % photos.length];
  const free = units.filter(u => statusOf(u) === 'Còn hàng');
  const picks = [...free.sort((a, b) => a.price - b.price), ...units.filter(u => statusOf(u) !== 'Còn hàng')].slice(0, 6);
  const [open, setOpen] = useState(0);
  const head = profile.stats[0];
  const pills = [...profile.amenities.map(a => a.title), ...(profile.products || []).map(p => p.title)];
  const features = [...(profile.connections || []).slice(0, 2).map(c => ({...c, Icon: Car})), ...profile.amenities.slice(0, 4).map((a, i) => ({...a, Icon: amenityIcons[i % amenityIcons.length]}))];
  const cards = [
    {n: '01.', title: 'Tổng quan', body: profile.intro, link: 'Quỹ căn 360°', tab: 'vr'},
    {n: '02.', title: 'Sản phẩm', body: (profile.products || []).map(p => `${p.title} ${p.body}`).join(' · ') || `${units.length} căn trong bảng hàng`, link: 'Xem bảng hàng', tab: 'inventory'},
    {n: '03.', title: 'Mặt bằng', body: `${profile.zones.length} khu chủ đề: ${profile.zones.map(z => z.name).join(', ')}.`, link: 'Xem mặt bằng', tab: 'plan'},
  ];

  return <div className="sz ph3">
    <section className="ph3-hero">
      <div className="ph3-hero-photo"><Img w={1600} eager src={project.image} alt={project.name}/></div>
      <div className="ph3-hero-panel">
        <div><Eyebrow>{project.name}</Eyebrow><h2 data-fx="title">{lines(profile.headline)}</h2><p>{profile.intro}</p>
          <button type="button" className="sz-btn is-white" onClick={() => onTab('inventory')}><span>Xem bảng hàng</span><i><ArrowUpRight size={16}/></i></button></div>
        <div className="ph3-hero-foot">
          <div className="ph3-badge"><b className="fx-count">{head.value}</b><span>{head.suffix}<br/>{head.label.toLowerCase()}</span></div>
          <button type="button" className="ph3-watch" onClick={() => onTab('vr')}>Xem 360° <Play size={14} fill="currentColor"/></button>
        </div>
      </div>
    </section>

    <section className="ph3-who">
      <Eyebrow>Về dự án</Eyebrow><h3 data-fx="title">Đại đô thị Vinhomes<br/>có golf nội khu</h3>
      <div className="ph3-cards">{cards.map((c, i) => <button type="button" key={c.n} data-fx="up" className={'ph3-card is-' + i} onClick={() => onTab(c.tab)}>
        {i === 2 && <Img w={900} src={photo(1)} alt=""/>}
        <small>{c.n}</small><strong>{c.title}</strong><p>{c.body}</p><u>{c.link}</u><i><ArrowUpRight size={15}/></i></button>)}</div>
    </section>

    <div className="ph3-pills" aria-hidden><div>{[0, 1].map(k => <span key={k}>{pills.map((p, i) => <span key={p + k}>{i % 2 === 0 && <em><Img w={320} src={photo(i)} alt=""/></em>}<b>{p}</b></span>)}</span>)}</div></div>

    <section className="ph3-stats">{profile.stats.map((s, i) => <div key={s.label} data-fx="up" style={{marginTop: [120, 0, 160, 60][i % 4]}}>
      <dt><b className="fx-count">{s.value}</b><sup>{s.suffix}</sup></dt><dd>{s.label}</dd></div>)}</section>

    <section className="ph3-diff">
      <div className="ph3-diff-left"><div className="ph3-diff-photo"><Img w={1200} src={photo(2)} alt=""/></div>
        <Eyebrow>{profile.focus.eyebrow}</Eyebrow><h3 data-fx="title">{lines(profile.focus.title)}</h3><p>{profile.focus.body}</p>
        <button type="button" className="sz-btn is-white" onClick={() => onTab('gallery')}><span>Thư viện ảnh</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="ph3-feats">{features.map(({title, body, Icon}) => <div key={title} data-fx="up"><i><Icon size={22}/></i><strong>{title}</strong><p>{body}</p></div>)}</div>
    </section>

    {picks.length > 0 && <section className="ph3-units">
      <div className="ph3-units-head"><div><Eyebrow light>Quỹ căn dự án</Eyebrow><h3 data-fx="title">Chọn căn đẹp<br/>giá tốt nhất</h3></div>
        <button type="button" className="sz-btn is-white" onClick={() => onTab('inventory')}><span>Toàn bộ {units.length} căn</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="ph3-acc">{picks.map((u, i) => <a key={u.id} href={unitPlanPath(u)} className={i === open ? 'is-open' : ''} onMouseEnter={() => setOpen(i)} onFocus={() => setOpen(i)}>
        <Img w={1200} src={photo(i)} alt=""/>
        <b className="ph3-acc-code">{u.code}</b>
        <div className="ph3-acc-info"><small><MapPin size={14}/>{u.zone || project.location}</small><strong>{u.code}</strong>
          <p>{u.type}{u.area ? ` · ${fmt(u.area)} m²` : ''}{u.direction ? ` · ${u.direction}` : ''}</p>
          <p className="ph3-acc-price">{u.price ? `${fmt(u.price)} tỷ` : 'Liên hệ'} · {statusOf(u)}</p>
          <span className="sz-btn is-white"><span>Mặt bằng căn</span><i><ArrowUpRight size={16}/></i></span></div>
      </a>)}</div>
      <div className="ph3-codes">{units.slice(0, 40).map(u => <a key={u.id} href={unitPlanPath(u)} className={statusOf(u) === 'Còn hàng' ? '' : 'is-off'}>{u.code}</a>)}
        {units.length > 40 && <button type="button" onClick={() => onTab('inventory')}>+{units.length - 40} căn</button>}</div>
    </section>}

    <section className="ph3-zones"><Eyebrow>Phân khu</Eyebrow><h3 data-fx="title">{profile.zones.length} khu chủ đề</h3>
      <div>{profile.zones.map((z, i) => <button type="button" key={z.code} data-fx="up" className={i % 2 ? 'is-low' : ''} onClick={() => onTab('zones')}>
        <span className="ph3-zone-photo"><Img w={700} src={photo(i + 3)} alt=""/><i><ArrowUpRight size={14}/></i></span>
        <span className="ph3-zone-tag"><small>{z.local}{z.area ? ' · ' + z.area : ''}</small><b>{z.name}</b></span><p>{z.body}</p></button>)}</div>
    </section>

    {profile.policies && <section className="ph3-awards"><Eyebrow>Chính sách bán hàng</Eyebrow><h3 data-fx="title">Ưu đãi<br/>khi sở hữu</h3>
      {profile.priceFrom && <p>Giá dự kiến từ <b>{profile.priceFrom.value}</b> {profile.priceFrom.label}</p>}
      {[0, 1].map(row => <div key={row} className={'ph3-award-row' + (row ? ' is-rev' : '')}><div>{[0, 1].map(k => <span key={k}>{(row ? [...(profile.products || []), ...(profile.connections || [])].map(p => ({value: p.title, label: p.body})) : [...profile.policies!, ...profile.policies!]).map((p, j) => <span key={p.label + k + j} className="ph3-award"><i><Award size={16}/></i><b>{p.value}</b><small>{p.label}</small></span>)}</span>)}</div></div>)}
    </section>}

    <section className="ph3-voice">
      <div className="ph3-voice-list"><Eyebrow>Pháp lý & tiến độ</Eyebrow>
        {profile.timeline.map(t => <blockquote key={t.title} data-fx="up"><p>“{t.body}”</p><cite><ShieldCheck size={16}/>{t.title}</cite></blockquote>)}
        {profile.legal && <ul>{profile.legal.map(l => <li key={l}><ShieldCheck size={16}/>{l}</li>)}</ul>}</div>
      <div className="ph3-voice-photo"><Img w={1200} src={photo(4)} alt=""/>
        <div className="ph3-rate"><b className="fx-count">{free.length || units.length}</b><span>căn còn hàng</span><small><Building2 size={14}/>{project.developer}</small></div></div>
    </section>

    <section className="ph3-enquiry">
      <div><Eyebrow>Tư vấn nhanh</Eyebrow><h3>Nhận bảng giá &<br/>giữ chỗ ưu tiên</h3><p>Đội ngũ tư vấn gửi thông tin {project.name} mới nhất cho bạn.</p>
        <a href={`tel:${contact.phone}`}><i><Phone size={18}/></i><span><small>Hotline / Zalo</small><b>{contact.phone}</b></span></a></div>
      <LeadForm projects={[project]} note={`Tư vấn ${project.name} (trang Tổng quan dự án)`} compact/>
    </section>
    <p className="pov-sources">Thông tin tổng quan tham khảo từ nguồn công khai: {profile.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}. Mã căn, giá và trạng thái lấy từ bảng hàng của website.</p>
  </div>;
}
