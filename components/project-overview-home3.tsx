'use client';
/* Project "Tổng quan" in the Spaciaz home-3 style: split hero, numbered cards, pill marquee, staggered
 * counters, icon grid, expanding unit cards (codes from the live inventory, linked to Mặt bằng căn). */
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Award, Banknote, Building2, Car, ChevronDown, Clock, GraduationCap, HeartPulse, Landmark, MapPin, Phone, Play, ShieldCheck, ShoppingBag, Sparkles, Trees, Trophy, Wallet} from 'lucide-react';
import type {Asset, Project, Unit} from '@/lib/catalog';
import type {ProjectProfile} from '@/lib/project-profiles';
import type {PublicContact} from '@/lib/public-contact';
import {unitPlanPath} from '@/lib/project-routes';
import {Eyebrow, Img, LeadForm} from './spaciaz';

const lines = (t: string) => t.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br/>}</span>);
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});
const amenityIcons = [Trophy, Sparkles, Trees, GraduationCap, ShoppingBag, HeartPulse];

/** Count-up number owned by React (site-effects' .fx-count edits the DOM text and breaks hydration). */
function Count({value}: {value: string}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const target = Number(value.replace(/\./g, ''));
    const el = ref.current;
    if (!el || !/^\d[\d.]*$/.test(value) || target < 2) {setShown(value); return;}
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now(), dur = Math.min(2000, 900 + target * 2);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        setShown(t < 1 ? Math.round(target * (1 - Math.pow(1 - t, 3))).toLocaleString('vi-VN') : value);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, {threshold: .3});
    io.observe(el);
    return () => {io.disconnect(); cancelAnimationFrame(raf);};
  }, [value]);
  return <b ref={ref}>{shown}</b>;
}

export default function ProjectOverviewHome3({project, profile, units, assets, statusOf, contact, onTab}: {project: Project; profile: ProjectProfile; units: Unit[]; assets: Asset[]; statusOf: (u: Unit) => string; contact: PublicContact; onTab: (tab: string) => void}) {
  const photos = [project.image, ...assets.filter(a => ['gallery', 'amenity', 'model'].includes(a.kind)).map(a => a.url)].filter(Boolean);
  const photo = (i: number) => photos[i % photos.length];
  const free = units.filter(u => statusOf(u) === 'Còn hàng');
  const picks = [...free.sort((a, b) => a.price - b.price), ...units.filter(u => statusOf(u) !== 'Còn hàng')].slice(0, 6);
  const slides = [{title: 'Phối cảnh tổng thể', image: project.image, eyebrow: project.name, headline: profile.headline, body: profile.intro, stat: profile.stats[0]}, ...(profile.heroSlides || [])].filter(s => s.image);
  const [slide, setSlide] = useState(0);
  const [prev, setPrev] = useState(-1);
  const heroRef = useRef<HTMLElement>(null);
  const [seenSlides] = useState(() => new Set<number>());
  seenSlides.add(slide).add((slide + 1) % Math.max(1, slides.length));
  const go = (i: number) => setSlide(cur => {if (cur !== i) setPrev(cur); return i;});
  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setTimeout(() => go((slide + 1) % slides.length), 6500);
    return () => window.clearTimeout(t);
  }, [slide, slides.length]);
  const tilt = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), el = heroRef.current;
    el?.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 6 + 'deg');
    el?.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -4 + 'deg');
  };
  const [open, setOpen] = useState(0);
  const [product, setProduct] = useState(0);
  const [road, setRoad] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [allAmenities, setAllAmenities] = useState(false);
  const [faq, setFaq] = useState(0);
  const [about, setAbout] = useState(0);
  const gal = profile.amenityGallery || [];
  const pg = (i: number) => gal.length ? gal[i % gal.length].image : photo(i);
  const houses = (profile.products || []).filter(p => p.image);
  const roads = (profile.connections || []).filter(c => c.detail);
  const payIcons = [Clock, Banknote, Landmark];
  const head = profile.stats[0];
  const pills = [...profile.amenities.map(a => a.title), ...(profile.products || []).map(p => p.title)];
  const features = [...(profile.connections || []).slice(0, 2).map(c => ({...c, Icon: Car})), ...profile.amenities.slice(0, 4).map((a, i) => ({...a, Icon: amenityIcons[i % amenityIcons.length]}))];
  const cur = slides[slide] || slides[0];
  const imgOf = (id: string, i: number) => [...gal, ...(profile.plans || []), ...houses.map(h => ({image: h.image!}))].find(x => x.image.endsWith(id))?.image || photo(i);
  const aboutTabs = [
    {key: 'overview', label: 'Tổng quan', title: profile.tagline || project.name, body: profile.location?.body[0] || profile.intro, image: project.image, chips: (profile.facts || []).map(f => `${f.label}: ${f.value}`), cta: 'Quỹ căn 360°', tab: 'vr'},
    {key: 'product', label: 'Sản phẩm', title: project.category === 'high' ? 'Căn hộ\ncao tầng' : 'Nhà phố &\nbiệt thự', body: `${units.length} căn trong bảng hàng, ${free.length} căn còn hàng. ${profile.priceFrom ? `Giá dự kiến từ ${profile.priceFrom.value} ${profile.priceFrom.label}.` : ''}`, image: houses[0]?.image || photo(1), chips: (profile.products || []).map(p => p.title), cta: 'Xem bảng hàng', tab: 'inventory'},
    {key: 'plan', label: 'Mặt bằng', title: `${profile.zones.length} khu chủ đề`, body: profile.zones.map(z => `${z.name}: ${z.body}`).slice(0, 2).join(' '), image: imgOf('sgp-masterplan', 2), chips: profile.zones.map(z => z.name), cta: 'Xem mặt bằng', tab: 'plan'},
    {key: 'location', label: 'Vị trí', title: profile.location?.title || project.location, body: profile.location?.body[1] || project.location, image: imgOf('sgp-aerial', 3), chips: (profile.connections || []).map(c => c.title), cta: 'Xem vị trí', tab: 'location'},
    {key: 'amenity', label: 'Tiện ích', title: gal.length ? 'Thành phố\ncông viên tri thức' : 'Tiện ích\nnổi bật', body: profile.focus.body, image: imgOf('sgp-golf', 4), chips: profile.amenities.map(a => a.title), cta: 'Xem tiện ích', tab: 'amenity'},
    {key: 'policy', label: 'Chính sách', title: 'Ưu đãi\nkhi sở hữu', body: (profile.payment || []).map(p => `${p.title}: ${p.body}`).join(' '), image: imgOf('sgp-vincom', 5), chips: (profile.policies || []).map(p => `${p.value} ${p.label.toLowerCase()}`), cta: 'Tài liệu & bảng giá', tab: 'document'},
  ].filter(t => t.key === 'overview' || (t.key === 'product' ? units.length || (profile.products || []).length : t.key === 'plan' ? profile.zones.length : t.key === 'amenity' ? profile.amenities.length : t.key === 'policy' ? (profile.payment || profile.policies) : true));
  useEffect(() => {
    const t = window.setTimeout(() => setAbout(a => (a + 1) % aboutTabs.length), 9000);
    return () => window.clearTimeout(t);
  }, [about, aboutTabs.length]);
  const at = aboutTabs[about];
  const [seenAbout] = useState(() => new Set<number>());
  seenAbout.add(about).add((about + 1) % aboutTabs.length);
  const sections = ([['tong-quan', 'Tổng quan', 1], ['ve-du-an', 'Về dự án', 1], ['khac-biet', 'Khác biệt', profile.stats.length], ['video', 'Video', profile.video], ['vi-tri', 'Vị trí', profile.location], ['tien-ich', 'Tiện ích', gal.length], ['san-pham', 'Sản phẩm', houses.length], ['quy-can', 'Quỹ căn', picks.length], ['phan-khu', 'Phân khu', profile.zones.length], ['mat-bang', 'Mặt bằng', profile.plans], ['chinh-sach', 'Chính sách', profile.payment], ['tien-do', 'Tiến độ', profile.timeline.length || profile.legal], ['hoi-dap', 'Hỏi đáp', profile.faq], ['lien-he', 'Liên hệ', 1]] as const).filter(x => x[2]).map(x => [x[0], x[1]] as const);
  const [active, setActive] = useState('tong-quan');
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let tick = 0;
    const spy = () => {
      if (tick) return;
      tick = requestAnimationFrame(() => {
        tick = 0;
        let cur = 'tong-quan';
        document.querySelectorAll<HTMLElement>('.ph3 > section[id]').forEach(el => {if (el.getBoundingClientRect().top < 220) cur = el.id;});
        setActive(cur);
      });
    };
    spy();
    window.addEventListener('scroll', spy, {passive: true});
    return () => {window.removeEventListener('scroll', spy); cancelAnimationFrame(tick);};
  }, []);
  useEffect(() => {
    const link = navRef.current?.querySelector<HTMLElement>('a.is-on');
    const box = navRef.current;
    if (link && box) box.scrollTo({left: link.offsetLeft - box.clientWidth / 2 + link.clientWidth / 2, behavior: 'smooth'});
  }, [active]);
  const jump = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({top: id === 'tong-quan' ? 0 : el.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth'});
    history.replaceState(null, '', '#' + id);
  };

  return <div className="sz ph3">
    <nav className="ph3-nav" aria-label="Mục lục trang">
      <a href="#tong-quan" className="ph3-nav-brand" onClick={e => jump(e, 'tong-quan')}><b>{project.name}</b><small>{project.location}</small></a>
      <div ref={navRef}>{sections.map(([id, label]) => <a key={id} href={'#' + id} className={active === id ? 'is-on' : ''} onClick={e => jump(e, id)}>{label}</a>)}</div>
      <button type="button" className="ph3-nav-cta" onClick={() => onTab('inventory')}>Bảng hàng <ArrowUpRight size={15}/></button>
    </nav>
    <section id="tong-quan" ref={heroRef} className="ph3-hero" onMouseMove={tilt} onMouseLeave={() => heroRef.current?.style.setProperty('--rx', '0deg') || heroRef.current?.style.setProperty('--ry', '0deg')}>
      <div className="ph3-hero-stage">{slides.map((s, i) => <div key={s.image} className={'ph3-slide' + (i === slide ? ' is-on' : i === prev ? ' is-prev' : '')}>
        {(i === slide || i === prev || i === (slide + 1) % slides.length || seenSlides.has(i)) && <Img w={1600} eager src={s.image} alt={s.title}/>}</div>)}</div>
      <div className="ph3-hero-copy" key={'c' + slide}>
        <Eyebrow light>{cur.eyebrow || project.name}</Eyebrow><h2>{lines(cur.headline || cur.title)}</h2><p>{cur.body || profile.intro}</p>
        <div className="ph3-hero-btns"><button type="button" className="sz-btn is-mint" onClick={() => onTab('inventory')}><span>Xem bảng hàng</span><i><ArrowUpRight size={16}/></i></button>
          <button type="button" className="ph3-watch" onClick={() => onTab('vr')}>Xem 360° <Play size={14} fill="currentColor"/></button></div>
      </div>
      {profile.priceFrom && <div className="ph3-hero-float"><small>Giá dự kiến từ</small><b>{profile.priceFrom.value} <em>tỷ</em></b><span>{profile.priceFrom.label.replace(/^tỷ · /, '')}</span></div>}
      <div className="ph3-hero-foot">
        <div className="ph3-badge" key={'b' + slide}><Count value={cur.stat?.value || head.value}/><span>{cur.stat?.suffix ?? head.suffix}<br/>{(cur.stat?.label || head.label).toLowerCase()}</span></div>
        <div className="ph3-hero-nav"><span key={'t' + slide}><b>{String(slide + 1).padStart(2, '0')}</b> / {String(slides.length).padStart(2, '0')} · {slides[slide].title}</span>
          <div>{slides.map((s, i) => <button type="button" key={s.image} aria-label={s.title} className={i === slide ? 'is-on' : ''} onClick={() => go(i)}><i/></button>)}</div></div>
      </div>
    </section>

    <section id="ve-du-an" className="ph3-about">
      <div className="ph3-about-head"><Eyebrow>Về dự án</Eyebrow><h3 data-fx="title">Khám phá {project.name}</h3></div>
      <div className="ph3-about-box" data-fx="up">
        <div className="ph3-about-photo">{aboutTabs.map((t, i) => <div key={t.key} className={i === about ? 'is-on' : ''}>{(i === about || i === (about + 1) % aboutTabs.length || seenAbout.has(i)) && <Img w={1200} eager src={t.image} alt={t.label}/>}</div>)}</div>
        <div className="ph3-about-copy" key={'t' + about}>
          <small>{String(about + 1).padStart(2, '0')} / {String(aboutTabs.length).padStart(2, '0')} · {at.label}</small>
          <h4>{lines(at.title)}</h4><p>{at.body}</p>
          {at.chips.length > 0 && <ul>{at.chips.slice(0, 8).map(c => <li key={c}>{c}</li>)}</ul>}
          <button type="button" className="sz-btn is-mint" onClick={() => onTab(at.tab)}><span>{at.cta}</span><i><ArrowUpRight size={16}/></i></button>
        </div>
        <div className="ph3-about-tabs" role="tablist">{aboutTabs.map((t, i) => <button type="button" role="tab" aria-selected={i === about} key={t.key} className={i === about ? 'is-on' : ''} onClick={() => setAbout(i)}>
          <span><Img w={240} src={t.image} alt=""/></span><b><small>0{i + 1}</small>{t.label}</b><i/></button>)}</div>
      </div>
    </section>

    {pills.length > 0 && <div className="ph3-pills" aria-hidden><div>{[0, 1].map(k => <span key={k}>{pills.map((p, i) => <span key={p + k}>{i % 2 === 0 && <em><Img w={320} src={pg(i)} alt=""/></em>}<b>{p}</b></span>)}</span>)}</div></div>}

    {profile.stats.length > 0 && <section id="khac-biet" className="ph3-stats">{profile.stats.map((s, i) => <div key={s.label} data-fx="up" style={{marginTop: [120, 0, 160, 60][i % 4]}}>
      <dt><Count value={s.value}/><sup>{s.suffix}</sup></dt><dd>{s.label}</dd></div>)}</section>}

    {features.length > 0 && <section className="ph3-diff">
      <div className="ph3-diff-left"><div className="ph3-diff-photo"><Img w={900} src={pg(0)} alt=""/></div>
        <Eyebrow>{profile.focus.eyebrow}</Eyebrow><h3 data-fx="title">{lines(profile.focus.title)}</h3><p>{profile.focus.body}</p>
        <button type="button" className="sz-btn is-white" onClick={() => onTab('gallery')}><span>Thư viện ảnh</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="ph3-feats">{features.map(({title, body, Icon}) => <div key={title} data-fx="up"><i><Icon size={22}/></i><strong>{title}</strong><p>{body}</p></div>)}</div>
    </section>}

    {profile.video && <section id="video" className="ph3-video">
      <div className="ph3-video-head"><div><Eyebrow>Video dự án</Eyebrow><h3 data-fx="title">{profile.video.title}</h3></div>
        {profile.highlights && <ul>{profile.highlights.map(h => <li key={h}><Sparkles size={16}/>{h}</li>)}</ul>}</div>
      <div className="ph3-video-frame" data-fx="zoom">{playing
        ? <iframe src={profile.video.embed} title={profile.video.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>
        : <button type="button" onClick={() => setPlaying(true)} aria-label="Phát video"><Img w={1600} src={profile.video.poster || project.image} alt=""/><i><Play size={30} fill="currentColor"/></i><span>Xem phim tổng quan</span></button>}</div>
      <a className="ph3-video-link" href={profile.video.url} target="_blank" rel="noreferrer">Mở video trên Vimeo <ArrowUpRight size={14}/></a>
    </section>}

    {profile.location && <section id="vi-tri" className="ph3-loc">
      <div className="ph3-loc-copy"><Eyebrow>Vị trí & kết nối</Eyebrow><h3 data-fx="title">{lines(profile.location.title)}</h3>{profile.location.body.map(p => <p key={p.slice(0, 20)}>{p}</p>)}
        <button type="button" className="sz-btn is-white" onClick={() => onTab('location')}><span>Xem bản đồ vị trí</span><i><ArrowUpRight size={16}/></i></button></div>
      {roads.length > 0 && <div className="ph3-roads">
        <div className="ph3-roads-photo"><Img w={1200} src={roads[road].image} alt={roads[road].title}/><span><Car size={16}/>{roads[road].title} · {roads[road].body}</span></div>
        <ol>{roads.map((r, i) => <li key={r.title} className={i === road ? 'is-on' : ''} onMouseEnter={() => setRoad(i)} onClick={() => setRoad(i)}>
          <b>{String(i + 1).padStart(2, '0')}</b><div><strong>{r.title}<em>{r.body}</em></strong><p>{r.detail}</p></div></li>)}</ol>
      </div>}
    </section>}

    {gal.length > 0 && <section id="tien-ich" className="ph3-amen">
      <div className="ph3-amen-head"><div><Eyebrow light>Tiện ích nội khu</Eyebrow><h3 data-fx="title">Thành phố công viên<br/>sinh thái hàng đầu châu Á</h3></div>
        <p>Hơn 70 công viên, 21 km đường dạo ven nước, VinWonders, sân golf 36 hố, quần thể giáo dục 150 ha cùng chuỗi phố thương mại quốc tế.</p></div>
      <div className="ph3-amen-grid">{(allAmenities ? gal : gal.slice(0, 9)).map((a, i) => <figure key={a.title} data-fx="up" className={[0, 6].includes(i % 10) ? 'is-wide' : ''}>
        <Img w={i % 10 === 0 ? 1200 : 720} src={a.image} alt={a.title}/><figcaption><b>{a.title}</b><span>{a.body}</span></figcaption></figure>)}</div>
      {gal.length > 9 && <button type="button" className="sz-btn is-white ph3-more" onClick={() => setAllAmenities(v => !v)}><span>{allAmenities ? 'Thu gọn' : `Xem thêm ${gal.length - 9} tiện ích`}</span><i><ChevronDown size={16} style={{transform: allAmenities ? 'rotate(180deg)' : ''}}/></i></button>}
    </section>}

    {houses.length > 0 && <section id="san-pham" className="ph3-prod">
      <div className="ph3-prod-list"><Eyebrow>Loại hình sản phẩm</Eyebrow><h3 data-fx="title">Nhà phố &<br/>biệt thự</h3>
        <ul>{houses.map((p, i) => <li key={p.title}><button type="button" className={i === product ? 'is-on' : ''} onMouseEnter={() => setProduct(i)} onClick={() => setProduct(i)}><small>{p.body}</small><b>{p.title}</b><ArrowUpRight size={16}/></button></li>)}</ul>
        {profile.priceFrom && <p className="ph3-prod-price">Giá dự kiến từ <b>{profile.priceFrom.value} tỷ</b><br/>{profile.priceFrom.label.replace(/^tỷ · /, '')}</p>}</div>
      <div className="ph3-prod-view"><div key={product} className="ph3-prod-photo"><Img w={1400} src={houses[product].image!} alt={houses[product].title}/></div>
        <div className="ph3-prod-card"><small>{houses[product].body}</small><strong>{houses[product].title}</strong><p>{houses[product].detail}</p>
          <button type="button" className="sz-btn is-mint" onClick={() => onTab('inventory')}><span>Xem căn còn hàng</span><i><ArrowUpRight size={16}/></i></button></div></div>
    </section>}

    {picks.length > 0 && <section id="quy-can" className="ph3-units">
      <div className="ph3-units-head"><div><Eyebrow light>Quỹ căn dự án</Eyebrow><h3 data-fx="title">Chọn căn đẹp<br/>giá tốt nhất</h3></div>
        <button type="button" className="sz-btn is-white" onClick={() => onTab('inventory')}><span>Toàn bộ {units.length} căn</span><i><ArrowUpRight size={16}/></i></button></div>
      <div className="ph3-acc">{picks.map((u, i) => <a key={u.id} href={unitPlanPath(u)} className={i === open ? 'is-open' : ''} onMouseEnter={() => setOpen(i)} onFocus={() => setOpen(i)}>
        <Img w={1000} src={houses.length ? houses[i % houses.length].image : photo(i)} alt=""/>
        <b className="ph3-acc-code">{u.code}</b>
        <div className="ph3-acc-info"><small><MapPin size={14}/>{u.zone || project.location}</small><strong>{u.code}</strong>
          <p>{u.type}{u.area ? ` · ${fmt(u.area)} m²` : ''}{u.direction ? ` · ${u.direction}` : ''}</p>
          <p className="ph3-acc-price">{u.price ? `${fmt(u.price)} tỷ` : 'Liên hệ'} · {statusOf(u)}</p>
          <span className="sz-btn is-white"><span>Mặt bằng căn</span><i><ArrowUpRight size={16}/></i></span></div>
      </a>)}</div>
      <div className="ph3-codes">{units.slice(0, 40).map(u => <a key={u.id} href={unitPlanPath(u)} className={statusOf(u) === 'Còn hàng' ? '' : 'is-off'}>{u.code}</a>)}
        {units.length > 40 && <button type="button" onClick={() => onTab('inventory')}>+{units.length - 40} căn</button>}</div>
    </section>}

    {profile.zones.length > 0 && <section id="phan-khu" className="ph3-zones"><Eyebrow>Phân khu</Eyebrow><h3 data-fx="title">{profile.zones.length} khu chủ đề</h3>
      <div>{profile.zones.map((z, i) => <button type="button" key={z.code} data-fx="up" className={i % 2 ? 'is-low' : ''} onClick={() => onTab('zones')}>
        <span className="ph3-zone-photo"><Img w={700} src={pg(i * 3 + 2)} alt=""/><i><ArrowUpRight size={14}/></i></span>
        <span className="ph3-zone-tag"><small>{z.local}{z.area ? ' · ' + z.area : ''}</small><b>{z.name}</b></span><p>{z.body}</p></button>)}</div>
    </section>}

    {profile.plans && <section id="mat-bang" className="ph3-plans"><Eyebrow>Mặt bằng</Eyebrow><h3 data-fx="title">Tổng quan đô thị</h3>
      <div>{profile.plans.map((p, i) => <a key={p.title} href={p.image} target="_blank" rel="noreferrer" data-fx="up" className={i === 0 ? 'is-big' : ''}>
        <Img w={i === 0 ? 1800 : 900} src={p.image} alt={p.title}/><span><b>{p.title}</b><small>{p.body}</small></span><i><ArrowUpRight size={16}/></i></a>)}</div>
    </section>}

    {profile.payment && <section id="chinh-sach" className="ph3-policy">
      <div className="ph3-policy-head"><Eyebrow light>Chính sách bán hàng</Eyebrow><h3 data-fx="title">Phương thức thanh toán<br/>linh hoạt</h3></div>
      <div className="ph3-pay">{profile.payment.map((p, i) => {const Icon = payIcons[i % payIcons.length]; return <div key={p.title} data-fx="up"><span>0{i + 1}</span><i><Icon size={24}/></i><strong>{p.title}</strong><p>{p.body}</p></div>;})}</div>
      {profile.policies && <dl className="ph3-offers">{profile.policies.map(p => <div key={p.label} data-fx="up"><dt>{p.value}</dt><dd>{p.label}</dd></div>)}</dl>}
      {profile.policyImages && <div className="ph3-posters">{profile.policyImages.map(p => <a key={p.title} href={p.image} target="_blank" rel="noreferrer" data-fx="up"><Img w={700} src={p.image} alt={p.title}/><span><Wallet size={15}/>{p.title}</span></a>)}</div>}
    </section>}

    {profile.policies && <section className="ph3-awards"><Eyebrow>Chính sách bán hàng</Eyebrow><h3 data-fx="title">Ưu đãi<br/>khi sở hữu</h3>
      {profile.priceFrom && <p>Giá dự kiến từ <b>{profile.priceFrom.value}</b> {profile.priceFrom.label}</p>}
      {[0, 1].map(row => <div key={row} className={'ph3-award-row' + (row ? ' is-rev' : '')}><div>{[0, 1].map(k => <span key={k}>{(row ? [...(profile.products || []), ...(profile.connections || [])].map(p => ({value: p.title, label: p.body})) : [...profile.policies!, ...profile.policies!]).map((p, j) => <span key={p.label + k + j} className="ph3-award"><i><Award size={16}/></i><b>{p.value}</b><small>{p.label}</small></span>)}</span>)}</div></div>)}
    </section>}

    {(profile.timeline.length > 0 || profile.legal) && <section id="tien-do" className="ph3-time3">
      <div className="ph3-time3-head"><div><Eyebrow>Pháp lý & tiến độ</Eyebrow><h3 data-fx="title">Các mốc phát triển</h3></div>
        <div className="ph3-time3-stat"><Count value={String(free.length || units.length)}/><span>căn còn hàng<br/><small>{project.developer}</small></span></div></div>
      <ol>{profile.timeline.map((t, i) => <li key={t.title} data-fx="up"><em>{t.date || String(i + 1).padStart(2, '0')}</em><i/><strong>{t.title}</strong><p>{t.body}</p></li>)}</ol>
      {profile.legal && <ul className="ph3-legal">{profile.legal.map(l => <li key={l} data-fx="up"><ShieldCheck size={20}/>{l}</li>)}</ul>}
    </section>}

    {profile.faq && <section id="hoi-dap" className="ph3-faq3">
      <div className="ph3-faq3-head"><div><Eyebrow>FAQs</Eyebrow><h3 data-fx="title">Câu hỏi thường gặp</h3></div>
        <a href={`tel:${contact.phone}`} className="sz-btn is-mint"><span>Hỏi tư vấn {contact.phone}</span><i><Phone size={16}/></i></a></div>
      <div className="ph3-faq3-grid">{profile.faq.map((f, i) => <div key={f.q} className={i === faq ? 'is-open' : ''}>
        <button type="button" onClick={() => setFaq(i === faq ? -1 : i)} aria-expanded={i === faq}><span>{String(i + 1).padStart(2, '0')}</span>{f.q}<ChevronDown size={18}/></button>
        <div><p>{f.a}</p></div></div>)}</div>
    </section>}

    <section id="lien-he" className="ph3-enquiry">
      <div><Eyebrow>Tư vấn nhanh</Eyebrow><h3>Nhận bảng giá &<br/>giữ chỗ ưu tiên</h3><p>Đội ngũ tư vấn gửi thông tin {project.name} mới nhất cho bạn.</p>
        <a href={`tel:${contact.phone}`}><i><Phone size={18}/></i><span><small>Hotline / Zalo</small><b>{contact.phone}</b></span></a></div>
      <LeadForm projects={[project]} note={`Tư vấn ${project.name} (trang Tổng quan dự án)`} compact/>
    </section>
    <p className="pov-sources">{profile.sources.length > 0 && <>Thông tin tổng quan tham khảo từ nguồn công khai: {profile.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}. </>}Mã căn, giá và trạng thái lấy từ bảng hàng của website.</p>
  </div>;
}
