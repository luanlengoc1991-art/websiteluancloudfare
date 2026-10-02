'use client';

import {useEffect, useRef, useState} from 'react';
import {ArrowDown, ArrowUpRight, Building2, Check, Compass, Database, Eye, Globe, Layers, MapPin, Monitor, MousePointer2, Phone, Search, ShieldCheck, SlidersHorizontal, Smartphone, Sparkles, Users, type LucideIcon} from 'lucide-react';
import Link from './site-link';
import {usePublicContact} from './public-contact-provider';
import {projectPath} from '@/lib/project-routes';
import type {Project, Unit} from '@/lib/catalog';

type Props = {projects: Project[]; units: Unit[]};
type Feature = {icon: LucideIcon; title: string; body: string; future?: boolean};

const experiences: Feature[] = [
  {icon: Globe, title: 'Không gian dự án 360°', body: 'Khám phá phối cảnh, tiện ích và nhà mẫu từ nhiều góc nhìn khi dự án có dữ liệu panorama.'},
  {icon: Layers, title: 'Mô hình 3D tương tác', body: 'Hướng tới trực quan hóa tòa nhà, tầng, trục và vị trí sản phẩm trong một không gian thống nhất.', future: true},
  {icon: Building2, title: 'Quỹ căn đa dạng', body: 'Tìm hiểu nhiều dự án, khu vực và loại hình bất động sản trên cùng một nền tảng.'},
  {icon: Database, title: 'Dữ liệu cập nhật tập trung', body: 'Thông tin đã công bố, bảng hàng và nội dung dự án được quản lý từ một nguồn dữ liệu chung.'},
];
const interactive: Feature[] = [
  {icon: Globe, title: 'Tour dự án 360°', body: 'Tham quan không gian dự án qua các điểm nhìn panorama được bổ sung cho từng dự án.'},
  {icon: MousePointer2, title: 'Điểm tương tác thông minh', body: 'Liên kết vị trí với hình ảnh, video, tiện ích, sản phẩm và tài liệu trong hành trình khám phá.', future: true},
  {icon: MapPin, title: 'Vị trí sản phẩm trực quan', body: 'Đọc mặt bằng và tìm hiểu vị trí căn qua thông tin, tọa độ đã cập nhật trên hệ thống.'},
  {icon: Layers, title: 'Mô hình kiến trúc 3D', body: 'Kết nối tòa nhà, tầng, trục và căn để khách hàng hình dung rõ hơn cấu trúc của dự án.', future: true},
];
const sources: Feature[] = [
  {icon: Database, title: 'Kết nối đa nguồn', body: 'Tổ chức thông tin dự án và bảng hàng từ nguồn được phép sử dụng, có ghi nhận nguồn tham khảo.'},
  {icon: Layers, title: 'Cập nhật tập trung', body: 'Thay đổi nội dung dùng chung được phản ánh trên các trang công khai và công cụ tra cứu.'},
  {icon: ShieldCheck, title: 'Kiểm soát chất lượng', body: 'Chuẩn hóa thông tin trước khi công bố; xác nhận giá và trạng thái thực tế cùng đội ngũ tư vấn.'},
  {icon: Eye, title: 'Phân phối đúng đối tượng', body: 'Nội dung công khai, tài liệu cần đăng nhập và dữ liệu riêng được phân quyền theo tài khoản.'},
];
const roles = [
  {name: 'Khách hàng', icon: Search, heading: 'Hiểu rõ hơn trước khi lựa chọn.', body: 'Khám phá dự án, thu hẹp quỹ căn theo nhu cầu và xem thông tin sản phẩm trong một hành trình liền mạch.', items: ['Tìm dự án theo nhu cầu', 'Tra cứu giá, diện tích và hướng', 'Lưu và so sánh các căn quan tâm'], href: '/quy-hang', action: 'Khám phá quỹ căn'},
  {name: 'Chuyên viên tư vấn', icon: Users, heading: 'Tư vấn bằng trải nghiệm.', body: 'Dẫn dắt khách hàng từ tổng quan dự án đến mặt bằng, quỹ căn và từng sản phẩm trên cùng một giao diện.', items: ['Trình bày thông tin dự án', 'Gửi liên kết tới từng sản phẩm', 'Kết nối tư vấn trên nhiều thiết bị'], href: '/du-an', action: 'Khám phá dự án'},
  {name: 'Đơn vị phân phối', icon: Building2, heading: 'Một nguồn dữ liệu cho cả đội ngũ.', body: 'Tập trung nội dung dự án và bảng hàng để xây dựng cách giới thiệu sản phẩm rõ ràng, thống nhất.', items: ['Quản lý nội dung dùng chung', 'Cập nhật bảng hàng tập trung', 'Cấp quyền chỉnh sửa theo tài khoản'], href: '/dang-nhap', action: 'Đăng nhập nền tảng'},
  {name: 'Chủ đầu tư', icon: Layers, heading: 'Xây dựng giá trị số cho dự án.', body: 'Định hướng số hóa hình ảnh, mặt bằng và thông tin sản phẩm thành một không gian tư vấn có thể phát triển lâu dài.', items: ['Tổ chức tài nguyên dự án', 'Kết nối thông tin và hình ảnh', 'Mở rộng trải nghiệm theo dữ liệu thực tế'], href: '#ah-lien-he', action: 'Trao đổi về dự án'},
];
const values = [
  ['Tiên phong', 'Ứng dụng công nghệ để xây dựng cách khám phá và tư vấn bất động sản trực quan hơn.'],
  ['Trực quan', 'Kết nối thông tin với hình ảnh và vị trí để khách hàng dễ hiểu, dễ hình dung.'],
  ['Nhất quán', 'Một nguồn nội dung dùng chung, một trải nghiệm liền mạch trên nhiều thiết bị.'],
  ['Minh bạch', 'Phân biệt dữ liệu tham khảo và dữ liệu đã xác nhận; công bố thông tin rõ ràng.'],
  ['Mở rộng', 'Phát triển không gian dự án cùng với nhu cầu, nội dung và dữ liệu của từng đối tác.'],
];
const steps = [
  ['Tiếp nhận dữ liệu', 'Hình ảnh, mặt bằng, quy hoạch, tiện ích và thông tin sản phẩm.'],
  ['Xây dựng không gian 360°', 'Tổ chức điểm nhìn và hành trình khám phá từ panorama của dự án.'],
  ['Gắn nội dung tương tác', 'Liên kết vị trí với phân khu, sản phẩm, hình ảnh và tài liệu.'],
  ['Phát triển mô hình 3D', 'Mở rộng khả năng trực quan hóa khi có mô hình và dữ liệu phù hợp.'],
  ['Kết nối quỹ căn', 'Chuẩn hóa mã căn, giá, trạng thái, chính sách và thông tin sản phẩm.'],
  ['Vận hành và cập nhật', 'Quản lý nội dung và quỹ hàng trên một nền tảng thống nhất.'],
];

function Features({items}: {items: Feature[]}) {
  return <div className="ah-feature-grid">{items.map(({icon: Icon, title, body, future}) => <article className="ah-glass ah-feature" key={title}>
    <span className="ah-icon"><Icon size={24} aria-hidden="true"/></span>
    {future && <span className="ah-roadmap">Định hướng phát triển</span>}
    <h3>{title}</h3><p>{body}</p>
  </article>)}</div>;
}

export default function AlphaHubLanding({projects, units}: Props) {
  const contact = usePublicContact();
  const [role, setRole] = useState(0);
  const [value, setValue] = useState(0);
  const [failedSource, setFailedSource] = useState('');
  const heroImage = useRef<HTMLImageElement>(null);
  const featured = projects.find(project => project.id === 'saigon-park') || projects[0];
  const tourHref = featured ? projectPath(featured.id, 'vr') : '/du-an';
  const image = featured?.image && featured.image !== failedSource ? featured.image : undefined;
  useEffect(() => {
    // An image can fail before React attaches onError during hydration.
    if (image && heroImage.current?.complete && heroImage.current.naturalWidth === 0) setFailedSource(image);
  }, [image]);
  const activeRole = roles[role];
  const RoleIcon = activeRole.icon;
  const format = (count: number) => count.toLocaleString('vi-VN');

  return <main className="ah" id="ah-top">
    <section className="ah-hero ah-container" aria-labelledby="ah-title">
      <div className="ah-hero-copy">
        <span className="ah-kicker"><span className="ah-dot"/> KHÔNG GIAN KẾT NỐI BẤT ĐỘNG SẢN</span>
        <p className="ah-wordmark">Alpha<span>Hub</span></p>
        <h1 id="ah-title">Tiên phong số hóa.<br/><em>Kiến tạo tương lai.</em></h1>
        <p className="ah-intro">Khám phá dự án và quỹ căn trong một trải nghiệm trực quan — từ vị trí, tiện ích đến từng sản phẩm.</p>
        <div className="ah-actions"><Link className="ah-button ah-primary" href={tourHref}>Trải nghiệm dự án 360° <ArrowUpRight size={18}/></Link><Link className="ah-button ah-outline" href="/quy-hang">Khám phá quỹ căn <ArrowUpRight size={18}/></Link></div>
        <div className="ah-hero-promises"><span><Globe size={16}/>Không gian trực quan</span><span><Building2 size={16}/>Quỹ căn đa dạng</span><span><Database size={16}/>Dữ liệu tập trung</span></div>
      </div>
      <div className="ah-hero-visual">
        <div className="ah-orbit ah-orbit-one"/><div className="ah-orbit ah-orbit-two"/>
        <div className="ah-scene ah-glass"><div className="ah-scene-image">{image ? <img ref={heroImage} src={image} alt={`Phối cảnh ${featured?.name || 'dự án'}`} fetchPriority="high" onError={() => setFailedSource(image)}/> : <div className="ah-scene-fallback"><Building2 size={110} strokeWidth={.6} aria-hidden="true"/><span>Phối cảnh đang cập nhật</span></div>}<div className="ah-scene-shade"/><span className="ah-scene-label"><Globe size={16}/> KHÁM PHÁ DỰ ÁN</span><div className="ah-scene-compass"><Compass size={27}/><small>BẮC</small></div><Link className="ah-scene-pin" href={tourHref} aria-label="Mở trải nghiệm dự án 360 độ"><Globe size={28}/></Link><div className="ah-scene-caption"><span>KHÔNG GIAN SỐ · TRẢI NGHIỆM THỰC</span><strong>{featured?.name || 'Khám phá cùng AlphaHub'}</strong></div></div><div className="ah-scene-bottom"><span><MapPin size={15}/>{featured?.location || 'Danh mục dự án AlphaHub'}</span><Link href={tourHref}>Khám phá <ArrowUpRight size={16}/></Link></div></div>
        <div className="ah-floating ah-floating-top ah-glass"><span className="ah-icon"><Layers size={20}/></span><div><strong>Một nền tảng.</strong><span>Nhiều góc nhìn.</span></div></div>
        <Link className="ah-floating ah-floating-bottom ah-glass" href="/quy-hang"><span className="ah-dot"/><div><strong>{format(units.length)} sản phẩm</strong><span>trong quỹ căn trên hệ thống</span></div><ArrowUpRight size={20}/></Link>
      </div>
      <a className="ah-scroll" href="#ah-trai-nghiem"><ArrowDown size={16}/>Khám phá AlphaHub</a>
    </section>

    <section className="ah-container ah-section" id="ah-trai-nghiem" aria-labelledby="ah-experience-title">
      <div className="ah-heading ah-centered"><span className="ah-kicker">TẤT CẢ ĐƯỢC KẾT NỐI</span><h2 id="ah-experience-title">Một nền tảng cho toàn bộ hành trình<br/><em>trải nghiệm bất động sản.</em></h2><p>Kết nối không gian, thông tin và con người để mỗi lựa chọn đều có thêm cơ sở.</p></div>
      <Features items={experiences}/>
    </section>

    <section className="ah-container ah-section ah-split" aria-labelledby="ah-stock-title">
      <div className="ah-heading"><span className="ah-kicker">TỪ TOÀN CẢNH ĐẾN TỪNG CĂN</span><h2 id="ah-stock-title">Nguồn quỹ căn phong phú.<br/><em>Lựa chọn dành cho bạn.</em></h2><p>AlphaHub tập hợp dự án và quỹ căn theo nhiều khu vực, loại hình và khoảng giá, phục vụ nhu cầu an cư, đầu tư và kinh doanh.</p><ul className="ah-checklist"><li><Check/>Đa dạng dự án và khu vực</li><li><Check/>Căn hộ, shophouse, liền kề và biệt thự</li><li><Check/>Thông tin sản phẩm được cập nhật tập trung</li></ul><div className="ah-actions"><Link className="ah-button ah-primary" href="/quy-hang">Tìm quỹ căn phù hợp <ArrowUpRight size={17}/></Link><Link className="ah-text-link" href="/du-an">Dự án nổi bật <ArrowUpRight size={17}/></Link></div></div>
      <div className="ah-catalog ah-glass"><div className="ah-catalog-heading"><Building2 size={23}/><span>KHÁM PHÁ CÙNG ALPHAHUB</span><ArrowUpRight size={18}/></div>{projects.slice(0, 3).map(project => <Link className="ah-catalog-row" key={project.id} href={projectPath(project.id, 'inventory')}><span className="ah-icon"><Building2 size={22}/></span><div><strong>{project.name}</strong><span>{project.location}</span></div><b>{format(units.filter(unit => unit.projectId === project.id).length)}<small>căn</small></b></Link>)}<div className="ah-catalog-stats"><div><strong>{format(projects.length)}</strong><span>dự án trên hệ thống</span></div><div><strong>{format(units.length)}</strong><span>sản phẩm để khám phá</span></div></div><p className="ah-caption">Quỹ căn có dữ liệu tham khảo; xác nhận giá và trạng thái trước khi giao dịch.</p></div>
    </section>

    <section className="ah-container ah-section ah-manifesto ah-glass" aria-labelledby="ah-digital-title"><span className="ah-kicker">SỐ HÓA TOÀN DIỆN TRẢI NGHIỆM BẤT ĐỘNG SẢN</span><h2 id="ah-digital-title">Biến thông tin rời rạc thành<br/><em>một hành trình liền mạch.</em></h2><p>AlphaHub kết nối hình ảnh, mặt bằng và dữ liệu sản phẩm trên một nền tảng chung. Khách hàng có thể khám phá dự án, tìm căn và đọc thông tin rõ ràng hơn trước khi trao đổi cùng chuyên viên tư vấn.</p><div className="ah-pillars"><div><Eye size={25}/><h3>Trải nghiệm trực quan</h3><p>Hiểu dự án qua phối cảnh, hình ảnh, mặt bằng và không gian 360°.</p></div><div><Database size={25}/><h3>Dữ liệu phong phú</h3><p>Tra cứu theo khu vực, loại hình, khoảng giá và nhu cầu sử dụng.</p></div><div><ShieldCheck size={25}/><h3>Lựa chọn có cơ sở</h3><p>Đối chiếu vị trí, diện tích, hướng, giá và thông tin từng sản phẩm.</p></div></div></section>

    <section className="ah-container ah-section" aria-labelledby="ah-space-title"><div className="ah-heading"><span className="ah-kicker">KHÔNG GIAN CÓ THỂ KHÁM PHÁ</span><h2 id="ah-space-title">Không chỉ nhìn thấy.<br/><em>Còn có thể tương tác.</em></h2><p>Định hướng của AlphaHub là kết nối tổng quan, tiện ích, phân khu và sản phẩm thành một hành trình tư vấn trực quan. Trải nghiệm từng dự án phụ thuộc vào tài nguyên đã được bổ sung.</p></div><Features items={interactive}/></section>

    <section className="ah-container ah-section ah-future ah-glass" aria-labelledby="ah-future-title"><div className="ah-heading"><span className="ah-kicker">TỪ HIỆN THỰC HÔM NAY ĐẾN DIỆN MẠO NGÀY MAI</span><h2 id="ah-future-title">Nhìn thấy điều đang có.<br/><em>Hình dung điều sẽ trở thành.</em></h2><p>Hình ảnh thực tế, phối cảnh và quy hoạch giúp khách hàng tìm hiểu dự án ở hiện tại và hình dung không gian sống khi hoàn thiện.</p></div><div className="ah-future-grid">{[[MapPin, 'Hiện trạng thực tế', 'Vị trí, cảnh quan và kết nối giao thông.'], [Layers, 'Quy hoạch tổng thể', 'Phân khu, tiện ích và tổ chức không gian.'], [Sparkles, 'Diện mạo tương lai', 'Phối cảnh không gian sống và tiện ích.'], [Compass, 'Vị trí sản phẩm', 'Hướng căn và kết nối tới các khu vực xung quanh.']].map(([Icon, title, body]) => {const IconComponent = Icon as LucideIcon;return <div key={String(title)}><IconComponent size={24}/><h3>{String(title)}</h3><p>{String(body)}</p></div>;})}</div></section>

    <section className="ah-container ah-section ah-split" aria-labelledby="ah-search-title"><div className="ah-search-visual ah-glass" aria-hidden="true"><div className="ah-search-demo"><Search size={20}/><span>Dự án · Loại hình · Ngân sách</span><SlidersIcon/></div><div className="ah-search-chips"><span>Phân khu</span><span>Diện tích</span><span>Hướng căn</span><span>Khoảng giá</span></div><div className="ah-search-result"><span className="ah-icon"><Building2 size={32}/></span><div><strong>Từ nhu cầu của bạn</strong><p>Đến những lựa chọn phù hợp</p></div><ArrowUpRight size={26}/></div><div className="ah-connected"><span>Bảng hàng</span><i/><span>Mặt bằng</span><i/><span>Thông tin căn</span></div></div><div className="ah-heading"><span className="ah-kicker">TÌM ĐÚNG DỰ ÁN. CHỌN ĐÚNG SẢN PHẨM.</span><h2 id="ah-search-title">Không chỉ tìm thấy căn.<br/><em>Hãy hiểu rõ căn.</em></h2><p>Công cụ tìm kiếm và bộ lọc giúp bạn thu hẹp quỹ căn theo mã căn, loại hình, phân khu, diện tích và ngân sách.</p><p>Thông tin vị trí, giá, hướng, trạng thái, hình ảnh và tài liệu liên quan được kết nối trong cùng hành trình tìm hiểu sản phẩm.</p><Link className="ah-button ah-primary" href="/quy-hang">Bắt đầu tìm kiếm <Search size={17}/></Link></div></section>

    <section className="ah-container ah-section" aria-labelledby="ah-data-title"><div className="ah-heading ah-centered"><span className="ah-kicker">DỮ LIỆU VẬN HÀNH PHÍA SAU TRẢI NGHIỆM</span><h2 id="ah-data-title">Một nguồn dữ liệu.<br/><em>Nhiều góc nhìn trên toàn hệ thống.</em></h2><p>Thông tin được tổ chức, cập nhật và công bố theo quyền truy cập để tạo nên một trải nghiệm nhất quán.</p></div><Features items={sources}/></section>

    <section className="ah-container ah-section ah-advice ah-glass" aria-labelledby="ah-advice-title"><div className="ah-heading"><span className="ah-kicker">TƯ VẤN BẰNG TRẢI NGHIỆM</span><h2 id="ah-advice-title">Giúp khách hàng nhìn thấy<br/><em>điều bạn đang nói.</em></h2><p>Dẫn dắt khách hàng từ toàn cảnh dự án đến vị trí, tiện ích và từng sản phẩm trong một hành trình liền mạch.</p><ul className="ah-checklist"><li><Check/>Trình chiếu tại văn phòng và sự kiện</li><li><Check/>Tư vấn từ xa qua liên kết dự án hoặc căn</li><li><Check/>Tìm và so sánh sản phẩm trong buổi tư vấn</li><li><Check/>Trình bày mặt bằng, hình ảnh và tài liệu</li></ul></div><div className="ah-devices"><div className="ah-desktop"><Monitor size={68} strokeWidth={1}/><strong>Phòng bán hàng số</strong><span>Mọi lúc. Mọi nơi.</span></div><div className="ah-phone ah-glass"><Smartphone size={38} strokeWidth={1.3}/><span>Tiếp tục khám phá<br/>trên mọi thiết bị</span></div><p>Máy tính · Máy tính bảng · Điện thoại<br/>Truy cập ngay trên trình duyệt.</p></div></section>

    <section className="ah-container ah-section" aria-labelledby="ah-roles-title"><div className="ah-heading ah-centered"><span className="ah-kicker">CÙNG TẠO NÊN GIÁ TRỊ</span><h2 id="ah-roles-title">Một nền tảng.<br/><em>Giá trị cho mọi vai trò.</em></h2></div><div className="ah-roles ah-glass"><div className="ah-role-tabs" role="tablist" aria-label="Vai trò trên AlphaHub">{roles.map((item, index) => <button key={item.name} id={`ah-role-${index}`} role="tab" aria-selected={role === index} aria-controls="ah-role-panel" tabIndex={role === index ? 0 : -1} onClick={() => setRole(index)} onKeyDown={event => {if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {event.preventDefault();const next = event.key === 'Home' ? 0 : event.key === 'End' ? roles.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + roles.length) % roles.length;setRole(next);document.getElementById(`ah-role-${next}`)?.focus();}}}><item.icon size={18}/>{item.name}</button>)}</div><div className="ah-role-panel" id="ah-role-panel" role="tabpanel" aria-labelledby={`ah-role-${role}`}><div className="ah-role-symbol"><RoleIcon size={78} strokeWidth={1}/><span>ALPHAHUB · {activeRole.name.toLocaleUpperCase('vi')}</span></div><div><h3>{activeRole.heading}</h3><p>{activeRole.body}</p><ul className="ah-checklist">{activeRole.items.map(item => <li key={item}><Check/>{item}</li>)}</ul><Link className="ah-text-link" href={activeRole.href}>{activeRole.action} <ArrowUpRight size={17}/></Link></div></div></div></section>

    <section className="ah-container ah-section" aria-labelledby="ah-process-title"><div className="ah-heading"><span className="ah-kicker">HÀNH TRÌNH SỐ HÓA DỰ ÁN</span><h2 id="ah-process-title">Từ dự án thực tế đến<br/><em>không gian bán hàng số.</em></h2><p>Một quy trình phát triển trải nghiệm dự án, bắt đầu từ dữ liệu và mở rộng theo nhu cầu thực tế.</p></div><ol className="ah-process">{steps.map(([title, body], index) => <li className="ah-glass" key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></li>)}</ol></section>

    <section className="ah-container ah-section ah-values ah-glass" aria-labelledby="ah-values-title"><div className="ah-heading ah-centered"><span className="ah-kicker">ĐIỀU ALPHAHUB THEO ĐUỔI</span><h2 id="ah-values-title">Giá trị cốt lõi.</h2></div><div className="ah-value-buttons" aria-label="Khám phá giá trị cốt lõi">{values.map(([label], index) => <button key={label} aria-pressed={value === index} onClick={() => setValue(index)}>{label}</button>)}</div><p className="ah-value-description" aria-live="polite">{values[value][1]}</p></section>

    <section className="ah-container ah-section ah-partners" aria-labelledby="ah-partners-title"><span className="ah-icon"><Users size={30}/></span><div className="ah-heading ah-centered"><span className="ah-kicker">KẾT NỐI ĐỂ CÙNG PHÁT TRIỂN</span><h2 id="ah-partners-title">Đồng hành cùng các đơn vị<br/><em>phát triển và phân phối bất động sản.</em></h2><p>AlphaHub hướng tới hợp tác cùng chủ đầu tư, đơn vị phân phối và đối tác công nghệ để xây dựng trải nghiệm giới thiệu dự án trực quan, thống nhất và hiệu quả hơn.</p></div></section>

    <section className="ah-container ah-section ah-contact ah-glass" id="ah-lien-he" aria-labelledby="ah-contact-title"><span className="ah-kicker">HÀNH TRÌNH MỚI BẮT ĐẦU TỪ ĐÂY</span><h2 id="ah-contact-title">Sẵn sàng khám phá bất động sản<br/><em>theo một cách mới?</em></h2><p>Tìm hiểu dự án, khám phá quỹ căn và kết nối với đội ngũ tư vấn.<br/>Đồng hành cùng AlphaHub để phát triển không gian giới thiệu dự án của bạn.</p><div className="ah-actions"><Link className="ah-button ah-primary" href={tourHref}>Trải nghiệm dự án 360° <Globe size={18}/></Link><Link className="ah-button ah-outline" href="/quy-hang">Khám phá quỹ căn <ArrowUpRight size={18}/></Link><a className="ah-button ah-outline" href={contact.zaloHref} target="_blank" rel="noreferrer">Liên hệ số hóa dự án <Phone size={18}/></a></div><a className="ah-contact-phone" href={`tel:${contact.phone}`}><Phone size={15}/>{contact.phone}</a><a className="ah-back-top" href="#ah-top" aria-label="Về đầu trang AlphaHub"><ArrowUpRight size={20}/></a></section>
  </main>;
}

function SlidersIcon() {return <SlidersHorizontal size={18}/>;}
