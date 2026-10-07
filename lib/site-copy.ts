/** Public page texts editable in Quản trị → Nội dung trang. Stored as overrides in D1 (records kind 'copy', id 'main');
 *  an empty override falls back to the default below. "\n" starts a new line in headings. */
export type CopyField = {key: string; label: string; default: string; long?: boolean};
export type CopyGroup = {id: string; title: string; page: string; fields: CopyField[]};

export const copyGroups: CopyGroup[] = [
  {id: 'home', title: 'Trang chủ (Tổng quan)', page: '/', fields: [
    {key: 'home.services.eyebrow', label: 'Nhãn khối khám phá', default: 'Khám phá cùng Alpha Hub'},
    {key: 'home.services.title', label: 'Tiêu đề khối khám phá', default: 'Mọi thông tin bạn cần\nđể chọn đúng nơi an cư', long: true},
    {key: 'home.showcase.title', label: 'Tiêu đề dự án tiêu biểu (nền tối)', default: 'Thiết kế ấn tượng,\ngiá trị bền vững', long: true},
    {key: 'home.different.title', label: 'Tiêu đề "Vì sao chọn"', default: 'Điều làm nên\nsự khác biệt', long: true},
    {key: 'home.partners', label: 'Dòng chạy chủ đầu tư', default: 'Đồng hành cùng các chủ đầu tư uy tín'},
    {key: 'home.team.eyebrow', label: 'Nhãn dự án nổi bật', default: 'Dự án nổi bật'},
    {key: 'home.team.title', label: 'Tiêu đề dự án nổi bật', default: 'Không gian sống\nđáng để chọn', long: true},
    {key: 'home.enquiry.eyebrow', label: 'Nhãn form tư vấn', default: 'Tư vấn nhanh'},
    {key: 'home.news.eyebrow', label: 'Nhãn tin tức', default: 'Tin tức & kiến thức'},
  ]},
  {id: 'projects', title: 'Trang Dự án', page: '/du-an', fields: [
    {key: 'projects.hero.title', label: 'Tiêu đề lớn đầu trang', default: 'Dự án nổi bật\ntrên Alpha Hub', long: true},
    {key: 'projects.ring.eyebrow', label: 'Nhãn danh mục', default: 'Danh mục dự án'},
    {key: 'projects.ring.title', label: 'Tiêu đề danh mục (xấp thẻ 3D)', default: 'Không gian sống chọn lọc,\ngiá trị bền vững', long: true},
    {key: 'projects.featured.title', label: 'Tiêu đề dự án tiêu biểu', default: 'Thiết kế ấn tượng,\ngiá trị bền vững', long: true},
    {key: 'projects.list.title', label: 'Tiêu đề danh sách', default: 'Danh sách dự án'},
    {key: 'projects.enquiry.title', label: 'Tiêu đề form tư vấn', default: 'Nhận bảng giá & lịch tham quan\ndự án bạn quan tâm', long: true},
  ]},
  {id: 'inventory', title: 'Trang Quỹ căn', page: '/quy-hang', fields: [
    {key: 'inventory.hero.title', label: 'Tiêu đề khối căn nổi bật', default: 'Khám phá những căn\nđang được quan tâm', long: true},
    {key: 'inventory.notes.title', label: 'Tiêu đề khối lưu ý', default: 'Điều bạn nên biết'},
    {key: 'inventory.enquiry.title', label: 'Tiêu đề form tư vấn', default: 'Chưa tìm được\ncăn ưng ý?', long: true},
    {key: 'inventory.enquiry.body', label: 'Mô tả form tư vấn', default: 'Để lại thông tin, chúng tôi sẽ gửi danh sách căn phù hợp với nhu cầu và ngân sách của bạn.', long: true},
  ]},
  {id: 'unitplan', title: 'Trang Mặt bằng căn', page: '/mat-bang-can', fields: [
    {key: 'unitplan.related.title', label: 'Tiêu đề căn liên quan', default: 'Các căn liên quan'},
  ]},
  {id: 'pages', title: 'Mô tả đầu các trang', page: '/tin-tuc', fields: [
    {key: 'news.banner', label: 'Tin tức', default: 'Tin dự án, hướng dẫn tra cứu quỹ căn và kiến thức bất động sản từ Alpha Hub.', long: true},
    {key: 'guide.banner', label: 'Hướng dẫn', default: 'Cách tra cứu quỹ căn, xem mặt bằng 360°, giữ chỗ và quản lý khách hàng trên Alpha Hub.', long: true},
    {key: 'favorites.banner', label: 'Yêu thích', default: 'Các căn và dự án bạn đã lưu để xem lại và so sánh.', long: true},
  ]},
  {id: 'contact', title: 'Trang Liên hệ', page: '/lien-he', fields: [
    {key: 'contact.banner', label: 'Mô tả đầu trang', default: 'Đội ngũ tư vấn Alpha Hub luôn sẵn sàng đồng hành cùng bạn trong hành trình tìm kiếm không gian sống.', long: true},
    {key: 'contact.form.title', label: 'Tiêu đề form', default: 'Để lại lời nhắn'},
    {key: 'contact.form.body', label: 'Mô tả form', default: 'Chia sẻ dự án và nhu cầu của bạn — chúng tôi sẽ gửi thông tin quỹ căn, bảng giá và lịch tham quan phù hợp.', long: true},
  ]},
  {id: 'footer', title: 'Chân trang (mọi trang)', page: '/', fields: [
    {key: 'footer.title', label: 'Tiêu đề lớn', default: 'Ngôi nhà mơ ước\nđang chờ bạn', long: true},
    {key: 'footer.body', label: 'Mô tả', default: 'Dù bạn đang tìm hiểu dự án hay đã có căn hộ trong tâm trí, Alpha Hub sẵn sàng đồng hành để hiện thực hóa điều đó.', long: true},
    {key: 'footer.cta', label: 'Nút tròn', default: 'Nhận\ntư vấn'},
    {key: 'footer.tagline', label: 'Câu dưới logo', default: 'Không gian kết nối dự án, quỹ căn và những cơ hội mới.', long: true},
  ]},
];
export const copyDefaults: Record<string, string> = Object.fromEntries(copyGroups.flatMap(g => g.fields.map(f => [f.key, f.default])));
export type SiteCopy = Record<string, string>;
/** Keeps only known keys and bounded strings. */
export function cleanCopy(value: unknown): SiteCopy {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([k, v]) => k in copyDefaults && typeof v === 'string').map(([k, v]) => [k, (v as string).slice(0, 2000)]));
}
