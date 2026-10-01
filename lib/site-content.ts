import {guides} from './catalog';

export type Guide = {id: string; title: string; body: string; order: number; visible: boolean};
export type AboutContent = {
  headline: string; introduction: string; featuredProjectId: string; featuredTagline: string; featuredScale: string;
  selectedProjectIds: string[]; platformTitle: string; platformBody: string; journeyTitle: string; newsTitle: string;
  faq: {question: string; answer: string}[]; contactTitle: string; contactBody: string;
};

export const seedGuides: Guide[] = guides.map(([title, body], index) => ({id: `guide-${index + 1}`, title, body, order: index + 1, visible: true}));
export const defaultAbout: AboutContent = {
  headline: '', introduction: '', featuredProjectId: 'green-paradise', featuredTagline: 'Không gian sống xanh bên biển Cần Giờ.', featuredScale: '2.870 ha',
  selectedProjectIds: ['saigon-park', 'ha-long', 'hai-van'], platformTitle: 'Một nơi để tìm hiểu.\nMột hành trình để lựa chọn.',
  platformBody: 'Kết nối thông tin dự án, mặt bằng 360° và quỹ căn để bạn dễ dàng khám phá không gian sống phù hợp.',
  journeyTitle: 'Ba bước, một hành trình', newsTitle: 'Cùng bạn tìm hiểu bất động sản',
  faq: [
    {question: 'Tôi tìm quỹ căn ở đâu?', answer: 'Mở trang Quỹ căn để lọc theo dự án, mã căn, phân khu, diện tích và khoảng giá. Bảng hàng từng dự án cũng có thể mở trực tiếp từ phần giới thiệu dự án.'},
    {question: 'Tôi có thể xem mặt bằng 360° không?', answer: 'Chọn Quỹ căn 360° trong dự án để khám phá phối cảnh và mặt bằng. Hình ảnh, vị trí căn được hiển thị theo dữ liệu đang có trên hệ thống.'},
    {question: 'Làm sao để được tư vấn về dự án?', answer: 'Bạn có thể gọi hotline, nhắn Zalo hoặc để lại thông tin ở cuối trang. Giá và tình trạng căn cần được xác nhận cùng đội ngũ tư vấn trước khi giao dịch.'},
  ],
  contactTitle: 'Tìm không gian sống\ndành cho bạn.', contactBody: 'Trao đổi nhu cầu, tìm hiểu dự án và quỹ căn bạn quan tâm.',
};

/** Keep hidden overrides when merging, so hiding a built-in guide does not restore it. */
export function mergeGuides(records: {kind: string; id: string; data: Guide}[]): Guide[] {
  const result = new Map(seedGuides.map(guide => [guide.id, guide]));
  for (const row of records) if (row.kind === 'guide') result.set(row.id, row.data);
  return [...result.values()].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
