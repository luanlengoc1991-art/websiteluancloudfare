/** Rich "Tổng quan" content per project (public information, checked 10/2026). Projects without a profile
 *  keep the generic overview. Unit data (quỹ căn) is never taken from here. */
export type ProjectProfile = {
  /** home5 (default) or home = Spaciaz main demo layout. */
  layout?: 'home5' | 'home';
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
  'saigon-park': {
    layout: 'home',
    headline: 'Đại đô thị\ncửa ngõ Tây Bắc',
    intro: 'Khu đô thị 1.080 ha tại Hóc Môn, TP. Hồ Chí Minh với sân golf nội khu, quần thể giáo dục 150 ha và công viên chủ đề, cho quy mô khoảng 135.000 cư dân.',
    stats: [
      {value: '1.080', suffix: 'ha', label: 'Quy mô dự án'},
      {value: '36', suffix: 'hố', label: 'Sân golf Vinpearl Léman nội khu'},
      {value: '150', suffix: 'ha', label: 'Quần thể giáo dục'},
    ],
    zones: [
      {code: '01', name: 'Ivy Park', local: 'Khu chủ đề', area: '', body: 'Khu ở chủ đề quốc tế với nhà phố, biệt thự và căn hộ, gắn với trục cảnh quan xanh của dự án.'},
      {code: '02', name: 'Global Park', local: 'Khu chủ đề', area: '', body: 'Khu đô thị năng động với thương mại, dịch vụ và không gian sống đa văn hóa.'},
      {code: '03', name: 'Laguna Park', local: 'Khu chủ đề', area: '', body: 'Không gian sống quanh mặt nước, hồ cảnh quan và công viên ven hồ.'},
      {code: '04', name: 'Zen Park', local: 'Khu chủ đề', area: '', body: 'Nhịp sống thư thái với công viên, vườn cảnh quan và tiện ích chăm sóc sức khỏe.'},
      {code: '05', name: 'Golf Park', local: 'Khu chủ đề', area: '', body: 'Quần thể quanh sân golf Vinpearl Léman 36 hố khoảng 200 ha – đại đô thị Vinhomes có golf nội khu.'},
    ],
    focus: {eyebrow: 'Vì sao chọn Sài Gòn Park', title: 'Golf, giáo dục và công viên\nngay trong khu đô thị', body: 'Sân golf 36 hố, quần thể giáo dục 150 ha với hệ thống trường Vinschool, công viên nước VinWonders 22,7 ha và rừng bách thảo 27 ha phục vụ cư dân ngay trong dự án.'},
    timeline: [
      {title: 'Khởi công', body: 'Khởi công ngày 19/12/2025 theo Quyết định 80/QĐ-TTg của Thủ tướng Chính phủ.'},
      {title: 'San lấp mặt bằng', body: 'Đến 3/2026 cơ bản hoàn tất san lấp hơn 900 ha tại các phân khu trọng điểm.'},
      {title: 'Mở bán giai đoạn 1', body: 'Dự kiến từ khoảng tháng 6/2026, phân khu phía Nam 55 ha: hơn 2.000 căn hộ và 2.500 nhà phố, biệt thự.'},
      {title: 'Hoàn thiện toàn khu', body: 'Mục tiêu hoàn thiện toàn bộ dự án trước năm 2035, quy mô dân số khoảng 135.000 người.'},
    ],
    amenities: [
      {title: 'Sân golf Vinpearl Léman 36 hố', body: 'Khoảng 200 ha, điểm nhấn nghỉ dưỡng và thể thao ngay trong khu đô thị.'},
      {title: 'Quần thể giáo dục 150 ha', body: 'Khoảng 36 trường học các cấp, gồm hệ thống Vinschool và trường công lập, tư thục.'},
      {title: 'VinWonders 22,7 ha', body: 'Công viên nước chủ đề gia đình phục vụ cư dân và du khách.'},
      {title: 'Botanical Park 27 ha', body: 'Công viên rừng bách thảo, lá phổi xanh của khu đô thị.'},
    ],
    sources: [
      {label: 'Vinhomes Market', url: 'https://market.vinhomes.vn/du-an/vinhomes-sai-gon-park'},
      {label: 'Adong Land', url: 'https://adongland.vn/vinhomes-saigon-park/'},
    ],
  },
};
