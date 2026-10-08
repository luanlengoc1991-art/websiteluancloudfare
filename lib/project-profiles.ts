/** Rich "Tổng quan" content per project (public information, checked 10/2026). Projects without a profile
 *  keep the generic overview. Unit data (quỹ căn) is never taken from here. */
export type ProjectProfile = {
  /** home5 (default), home = Spaciaz main demo, home3 = Spaciaz home-3. */
  layout?: 'home5' | 'home' | 'home3';
  headline: string; intro: string;
  stats: {value: string; suffix?: string; label: string}[];
  zones: {code: string; name: string; local: string; area: string; body: string}[];
  focus: {eyebrow: string; title: string; body: string};
  timeline: {title: string; body: string}[];
  amenities: {title: string; body: string}[];
  sources: {label: string; url: string}[];
  /** Optional extras used by the home3 layout. */
  products?: {title: string; body: string}[];
  connections?: {title: string; body: string}[];
  legal?: string[];
  policies?: {value: string; label: string}[];
  priceFrom?: {value: string; label: string};
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
    layout: 'home3',
    headline: 'Chuẩn sống mới\ncửa ngõ Tây Bắc',
    intro: 'Đại đô thị 1.080 ha tại Xuân Thới Sơn & Tân Thới Nhì, Hóc Môn: sân golf 36 hố, VinWonders, công viên Bách Thảo và quần thể giáo dục 150 ha cho khoảng 135.000 cư dân.',
    stats: [
      {value: '1.080', suffix: 'ha', label: 'Quy mô đại đô thị'},
      {value: '135', suffix: 'nghìn', label: 'Cư dân dự kiến'},
      {value: '59', suffix: 'nghìn tỷ', label: 'Tổng vốn đầu tư'},
      {value: '70', suffix: '+', label: 'Công viên nội khu'},
    ],
    zones: [
      {code: '01', name: 'Ivy Park', local: 'Khu chủ đề', area: '', body: 'Nhà phố, biệt thự và căn hộ gắn với trục cảnh quan xanh của dự án.'},
      {code: '02', name: 'Global Park', local: 'Khu chủ đề', area: '', body: 'Thương mại, dịch vụ và không gian sống đa văn hóa sôi động.'},
      {code: '03', name: 'Laguna Park', local: 'Khu chủ đề', area: '', body: 'Sống quanh mặt nước, hồ cảnh quan và công viên ven hồ.'},
      {code: '04', name: 'Zen Park', local: 'Khu chủ đề', area: '', body: 'Nhịp sống thư thái với vườn cảnh quan và tiện ích chăm sóc sức khỏe.'},
      {code: '05', name: 'Golf Park', local: 'Khu chủ đề', area: '200 ha', body: 'Quần thể quanh sân golf 36 hố – đại đô thị Vinhomes có golf nội khu.'},
    ],
    focus: {eyebrow: 'Vì sao chọn Sài Gòn Park', title: 'Điều làm nên\nkhác biệt', body: 'Hệ tiện ích đủ đầy ngay trong khu đô thị, kết nối nhanh về trung tâm và pháp lý sở hữu lâu dài.'},
    timeline: [
      {title: 'Khởi công', body: 'Khởi công ngày 19/12/2025 theo Quyết định 80/QĐ-TTg.'},
      {title: 'Quy hoạch 1/500', body: 'Quy hoạch chi tiết 1/500 đã được phê duyệt; hơn 900 ha san lấp xong 3/2026.'},
      {title: 'Mở bán', body: 'Mở bán từ tháng 6/2026, hiện đang nhận giữ chỗ.'},
      {title: 'Bàn giao', body: 'Dự kiến bàn giao 2027–2028; sổ hồng cấp trong 6–12 tháng.'},
    ],
    amenities: [
      {title: 'Sân golf 36 hố', body: 'Khoảng 200 ha ngay trong khu đô thị.'},
      {title: 'VinWonders 22,7 ha', body: 'Siêu công viên chủ đề cho cả gia đình.'},
      {title: 'Công viên Bách Thảo 27 ha', body: 'Lá phổi xanh cùng 21 km đường dạo bộ.'},
      {title: 'Quần thể giáo dục 150 ha', body: '36 trường học các cấp và khu đại học.'},
      {title: 'Vincom Mega Mall', body: 'Trung tâm thương mại, mua sắm, giải trí.'},
      {title: 'Bệnh viện Vinmec', body: 'Chăm sóc sức khỏe chuẩn quốc tế.'},
    ],
    products: [
      {title: 'Nhà phố', body: '50 – 55 – 70 – 112 m²'},
      {title: 'Nhà phố xẻ khe', body: '80 – 88 m²'},
      {title: 'Biệt thự song lập', body: 'Không gian sống riêng tư'},
      {title: 'Căn hộ cao tầng', body: 'Đa dạng diện tích'},
    ],
    connections: [
      {title: 'Quốc lộ 22', body: 'Trục cửa ngõ Tây Bắc'},
      {title: 'Vành đai 3 & 4', body: 'Kết nối liên vùng'},
      {title: 'Cao tốc TP.HCM – Mộc Bài', body: 'Hướng Tây Ninh, Campuchia'},
      {title: 'Metro số 2', body: 'Bến Thành – Tham Lương'},
      {title: '20–30 phút', body: 'Đến Tân Sơn Nhất, nội thành'},
    ],
    legal: ['Sở hữu lâu dài', 'Quy hoạch 1/500 đã phê duyệt', 'Sổ hồng cấp trong 6–12 tháng', 'Chủ đầu tư: Berjaya Việt Nam – thành viên Vingroup'],
    policies: [
      {value: '22,5%', label: 'Chiết khấu thanh toán'},
      {value: '30%', label: 'Trả trước từ (~1,5 tỷ)'},
      {value: '80%', label: 'Hỗ trợ vay ngân hàng'},
      {value: '0%', label: 'Lãi suất trong 18 tháng'},
      {value: '6%', label: 'Lãi suất tối đa 5 năm'},
      {value: '30%', label: 'Voucher thanh toán đến'},
    ],
    priceFrom: {value: '5,4', label: 'tỷ · nhà phố bàn giao thô (hoàn thiện từ 6,2 tỷ)'},
    sources: [
      {label: 'vinhomessaigonspark.vn', url: 'https://vinhomessaigonspark.vn/'},
      {label: 'Vinhomes Market', url: 'https://market.vinhomes.vn/du-an/vinhomes-sai-gon-park'},
    ],
  },
};
