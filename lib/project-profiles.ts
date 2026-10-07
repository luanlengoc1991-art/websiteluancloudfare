/** Rich "Tổng quan" content per project (public information, checked 10/2026). Projects without a profile
 *  keep the generic overview. Unit data (quỹ căn) is never taken from here. */
export type ProjectProfile = {
  headline: string; intro: string;
  stats: {value: string; suffix?: string; label: string}[];
  zones: {code: string; name: string; local: string; area: string; body: string}[];
  focus: {eyebrow: string; title: string; body: string};
  timeline: {title: string; body: string}[];
  amenities: {title: string; body: string}[];
  sources: {label: string; url: string}[];
};

export const projectProfiles: Record<string, ProjectProfile> = {
  'green-paradise': {
    headline: 'Siêu đô thị\nbiển Cần Giờ',
    intro: 'Khu đô thị lấn biển ESG++ quy mô 2.870 ha tại Cần Giờ, TP. Hồ Chí Minh: sinh thái, nghỉ dưỡng, giải trí, thương mại và công nghệ trong một điểm đến bên biển.',
    stats: [
      {value: '2.870', suffix: 'ha', label: 'Quy mô toàn khu'},
      {value: '4', label: 'Phân khu chức năng chính'},
      {value: '108', suffix: 'tầng', label: 'Tháp Landmark biểu tượng'},
    ],
    zones: [
      {code: '01', name: 'The Haven Bay', local: 'Vịnh Tiên', area: '771 ha', body: 'Phân khu mở bán đầu tiên: cặp sân golf 18 hố chuẩn quốc tế, chuỗi khách sạn 5 sao ven biển, trung tâm outlet, quảng trường chào đón và tổ hợp thể thao biển. Quỹ căn biệt thự, liền kề, shophouse trên website thuộc phân khu này.'},
      {code: '02', name: 'The Green Bay', local: 'Vịnh Ngọc', area: '587 ha', body: 'Không gian sống xanh quanh vịnh, nhịp sống nghỉ dưỡng với công viên, mặt nước và các dải nhà phố thấp tầng.'},
      {code: '03', name: 'The Grand Island', local: 'Đảo Mặt Trời', area: '450 ha', body: 'Đảo nghỉ dưỡng và giải trí với hệ sinh thái khách sạn, vui chơi và thương mại hướng biển.'},
      {code: '04', name: 'The Paradise', local: 'Mũi Danh Vọng', area: '303 ha', body: 'Mũi đất biểu tượng của dự án, nơi quy hoạch tháp Landmark 108 tầng và bến du thuyền Landmark Harbour.'},
    ],
    focus: {eyebrow: 'Tâm điểm Vịnh Tiên', title: 'Sống giữa sân golf,\nbiển và tiện ích nghỉ dưỡng', body: 'The Haven Bay mở ra chuỗi tiện ích ngay từ giai đoạn đầu: sân golf 18 hố, khách sạn ven biển, outlet và quảng trường lớn — điểm khởi đầu của siêu đô thị biển Cần Giờ.'},
    timeline: [
      {title: 'Hạ tầng cấp 1–2', body: 'Giai đoạn 2025–2026 tập trung hoàn thiện hạ tầng cấp 1, cấp 2 và cảnh quan phân khu đầu tiên.'},
      {title: 'Cầu Cần Giờ', body: 'Cầu nối Nhà Bè – Cần Giờ khởi công năm 2025, rút ngắn thời gian về trung tâm còn khoảng 35–40 phút.'},
      {title: 'Kết nối vùng', body: 'Hưởng lợi từ Vành đai 3, Vành đai 4 và sân bay Long Thành trong mạng lưới giao thông phía Nam.'},
      {title: 'Bàn giao đợt đầu', body: 'Dự kiến cuối 2026 bàn giao một phần sản phẩm thấp tầng thuộc phân khu mở bán đầu tiên.'},
      {title: 'Phát triển đồng loạt', body: 'Từ 2026 triển khai thi công đồng loạt các phân khu: nhà thấp tầng, shophouse, trường học, công viên, trung tâm thương mại.'},
    ],
    amenities: [
      {title: 'Tháp Landmark 108 tầng', body: 'Khách sạn 6 sao, trung tâm thương mại cao cấp, hội nghị quốc tế và đài quan sát 360°.'},
      {title: 'Sân golf 18 hố', body: 'Cặp sân golf chuẩn quốc tế tại phân khu The Haven Bay – Vịnh Tiên.'},
      {title: 'Landmark Harbour', body: 'Bến du thuyền quốc tế hướng vịnh Cần Giờ.'},
      {title: 'Tổ hợp giải trí 122 ha', body: 'Khu vui chơi, nhà hát Blue Wave và chuỗi khách sạn quy mô lớn ven biển.'},
    ],
    sources: [
      {label: 'Vinhomes Market', url: 'https://market.vinhomes.vn/du-an/vinhomes-green-paradise-can-gio'},
      {label: 'Wiki Batdongsan – 4 phân khu', url: 'https://wiki.batdongsan.com.vn/wiki/4-phan-khu-vinhomes-green-paradise-can-gio-848472'},
    ],
  },
};
