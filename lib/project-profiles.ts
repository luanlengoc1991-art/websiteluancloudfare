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
  products?: {title: string; body: string; detail?: string; image?: string}[];
  connections?: {title: string; body: string; detail?: string; image?: string}[];
  legal?: string[];
  policies?: {value: string; label: string}[];
  priceFrom?: {value: string; label: string};
  /** Images below are project files in R2/D1 (/api/files/<id>), replaceable in admin. */
  heroSlides?: {title: string; image: string}[];
  highlights?: string[];
  location?: {title: string; body: string[]};
  video?: {embed: string; url: string; title: string; poster?: string};
  amenityGallery?: {title: string; body: string; image: string}[];
  plans?: {title: string; body: string; image: string}[];
  payment?: {title: string; body: string}[];
  policyImages?: {title: string; image: string}[];
  faq?: {q: string; a: string}[];
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
      {title: 'Mở bán', body: 'Nhà phố & biệt thự mở bán từ tháng 6/2026; giai đoạn 1 phân khu phía Nam 55 ha với hơn 2.000 căn hộ và 2.500 nhà phố, biệt thự.'},
      {title: 'Bàn giao', body: 'Dự kiến bàn giao 2027–2028; sổ hồng cấp trong 6–12 tháng.'},
      {title: 'Hoàn thiện toàn khu', body: 'Mục tiêu hoàn thiện toàn bộ dự án trước năm 2035, quy mô khoảng 135.000 cư dân.'},
    ],
    heroSlides: [
      {title: 'Sân golf 36 hố – 200 ha', image: '/api/files/sgp-golf'},
      {title: '100 công viên lớn nhỏ', image: '/api/files/sgp-parks'},
      {title: 'Công viên Bách Thảo 27 ha', image: '/api/files/sgp-botanica'},
      {title: 'VinWonders 23 ha', image: '/api/files/sgp-vinwonders'},
      {title: 'Quần thể giáo dục 150 ha', image: '/api/files/sgp-edu'},
    ],
    highlights: ['Đô thị tri thức – hệ sinh thái toàn diện', 'Hạ tầng bứt phá: Metro – Vành đai – Quốc lộ', 'Vị trí tâm điểm cực tăng trưởng Tây Bắc TP.HCM'],
    location: {title: 'Tâm điểm cực tăng trưởng\nTây Bắc TP.HCM', body: [
      'Vinhomes Saigon Park tọa lạc ngay cửa ngõ giao thương Tây Bắc TP.HCM, thuộc các xã Tân Thới Nhì và Xuân Thới Sơn (Hóc Môn), trên hai mặt tiền huyết mạch Quốc lộ 22 và đường Đặng Công Bình – trục liên kết trung tâm thành phố với Long An, Tây Ninh và Bình Dương.',
      'Dự án hưởng lợi trực tiếp từ Vành đai 3, Metro số 2, số 4 và cao tốc TP.HCM – Mộc Bài; cư dân chỉ mất khoảng 20–30 phút đến sân bay Tân Sơn Nhất hoặc các quận nội thành.',
    ]},
    video: {embed: 'https://player.vimeo.com/video/1193112334?autoplay=1&title=0&byline=0&portrait=0', url: 'https://vimeo.com/1193112334', title: 'Phim tổng quan Vinhomes Saigon Park', poster: '/api/files/sgp-aerial'},
    amenityGallery: [
      {title: 'Sân golf 36 hố', body: 'Khu nghỉ dưỡng chuẩn resort, Vinpearl Golf Léman quy mô 200 ha.', image: '/api/files/sgp-golf'},
      {title: 'VinWonders 23 ha', body: 'Công viên giải trí, công viên nước hàng đầu châu Á.', image: '/api/files/sgp-vinwonders'},
      {title: 'Công viên Bách Thảo 27 ha', body: 'Botanica Park – rừng bách thảo giữa lòng đô thị.', image: '/api/files/sgp-botanica'},
      {title: 'Vườn hoa nhà kính 1,5 ha', body: 'Nằm trong quần thể vườn hoa nhà kính lớn nhất thế giới 15 ha.', image: '/api/files/sgp-greenhouse'},
      {title: 'Thư viện sống', body: 'Quy tụ hàng nghìn loài thực vật của 5 châu lục.', image: '/api/files/sgp-library'},
      {title: 'Vườn bao báp châu Phi', body: 'Không gian cây di sản độc đáo trong công viên.', image: '/api/files/sgp-baobab'},
      {title: '21 km đường dạo ven nước', body: 'Hơn 70 công viên nội khu tự điều hòa vi khí hậu.', image: '/api/files/sgp-walk'},
      {title: '100 công viên lớn nhỏ', body: 'Mảng xanh khổng lồ bao quanh từng khu ở.', image: '/api/files/sgp-parks'},
      {title: 'Quần thể giáo dục 150 ha', body: 'Hạ tầng tri thức: Vinschool, VinUni, viện nghiên cứu.', image: '/api/files/sgp-edu'},
      {title: '36 trường học', body: 'Hệ thống trường chất lượng cao các cấp.', image: '/api/files/sgp-school'},
      {title: 'Hệ sinh thái tri thức', body: 'Đại học nghiên cứu – tiện ích đô thị bậc nhất.', image: '/api/files/sgp-knowledge'},
      {title: 'Silicon Valley – Startup Village 1,6 ha', body: 'Saigon Park Tower và tổ hợp văn phòng 35 tầng.', image: '/api/files/sgp-silicon'},
      {title: 'Vincom Mega Mall 4,6 ha', body: 'Điểm đến giải trí mua sắm sôi động của khu vực.', image: '/api/files/sgp-vincom'},
      {title: 'Bệnh viện Vinmec 6,9 ha', body: 'Chăm sóc sức khỏe tiêu chuẩn quốc tế 5 sao.', image: '/api/files/sgp-vinmec'},
      {title: 'Global Village 19,3 ha', body: 'Trung tâm ẩm thực – văn hóa – giải trí quốc tế 24/7.', image: '/api/files/sgp-global'},
      {title: 'Phố Little HongKong 7,5 ha', body: 'Phố thương mại phong cách Hồng Kông.', image: '/api/files/sgp-hongkong'},
      {title: 'Làng Nhật Bản 1,5 ha', body: 'Làng cổ văn hóa & ẩm thực Nhật Bản.', image: '/api/files/sgp-japan'},
      {title: 'Trendy Fashion Town 2,3 ha', body: 'Làng thời trang cùng làng ẩm thực Cheers Town 1,8 ha.', image: '/api/files/sgp-fashion'},
      {title: 'Thương mại – giải trí', body: 'Quy mô bậc nhất khu vực, đáp ứng mọi nhu cầu.', image: '/api/files/sgp-commerce'},
      {title: 'VinWonders – thế giới trò chơi', body: 'Chuỗi trò chơi, show diễn cho cả gia đình.', image: '/api/files/sgp-vinwonders2'},
    ],
    plans: [
      {title: 'Tổng mặt bằng tiện ích', body: 'Vị trí các tiện ích trên toàn đại đô thị.', image: '/api/files/sgp-masterplan'},
      {title: 'Phối cảnh tổng thể', body: 'Toàn cảnh 1.080 ha cùng các trục giao thông.', image: '/api/files/sgp-aerial'},
      {title: 'Layout nhà phố điển hình', body: 'Mặt bằng các tầng nhà phố mẫu.', image: '/api/files/sgp-layout'},
    ],
    payment: [
      {title: 'Thanh toán theo tiến độ', body: 'Trả giãn nhiều đợt bằng vốn tự có theo tiến độ xây dựng của chủ đầu tư.'},
      {title: 'Thanh toán sớm', body: 'Trả trước 95% giá trị sản phẩm để nhận chiết khấu đến 22,5%.'},
      {title: 'Vay ngân hàng đến 80%', body: 'Ân hạn nợ gốc, hỗ trợ lãi suất 0% trong 18 tháng; lãi suất không quá 6%/năm trong 5 năm.'},
    ],
    policyImages: [
      {title: 'Nhà phố bàn giao thô từ 5,4 tỷ', image: '/api/files/sgp-policy-raw'},
      {title: 'Nhà phố hoàn thiện từ 6,2 tỷ', image: '/api/files/sgp-policy-full'},
      {title: 'Chính sách Vinhomes 2026', image: '/api/files/sgp-policy-2026'},
    ],
    faq: [
      {q: 'Dự án Vinhomes Saigon Park nằm ở đâu?', a: 'Cửa ngõ Tây Bắc TP.HCM, trên địa phận các xã Tân Thới Nhì và Xuân Thới Sơn (Hóc Môn), hai mặt tiền Quốc lộ 22 và đường Đặng Công Bình, tiếp giáp Vành đai 3 và cao tốc TP.HCM – Mộc Bài.'},
      {q: 'Dự án đã có sổ hồng chưa?', a: 'Quy hoạch 1/500 đã được phê duyệt. Biệt thự, nhà phố được chủ đầu tư làm sổ thay khách hàng; sổ hồng lâu dài cấp sau khi hoàn tất thủ tục khoảng 6–12 tháng.'},
      {q: 'Ai là chủ đầu tư?', a: 'Công ty CP Đô thị Đại học Quốc tế Berjaya Việt Nam – đơn vị thành viên Tập đoàn Vingroup.'},
      {q: 'Dự án có những loại hình sản phẩm nào?', a: 'Nhà phố, biệt thự và căn hộ cao tầng. Thấp tầng gồm nhà phố liền kề để ở 60 m² (5×12 m) và 75 m² (5×15 m), liền kề kinh doanh 123,5 m², biệt thự song lập kinh doanh 150 m² (10×15 m).'},
      {q: 'Khi nào mở bán và bàn giao?', a: 'Phân khu nhà phố & biệt thự mở bán từ tháng 6 (đang nhận giữ chỗ ưu tiên chọn căn); dự kiến bàn giao 2027–2028.'},
      {q: 'Chính sách thanh toán và vay vốn thế nào?', a: 'Ba lựa chọn: thanh toán theo tiến độ; thanh toán sớm 95% để nhận chiết khấu; vay ngân hàng đến 80% với ân hạn nợ gốc, lãi suất 0% trong 18 tháng và cam kết lãi suất không quá 6% trong 5 năm.'},
      {q: 'Tiện ích nội khu gồm những gì?', a: 'Vincom Mega Mall, bệnh viện Vinmec, hệ thống giáo dục Vinschool – VinUni – viện nghiên cứu, đại công viên trung tâm, VinWonders, khu thể thao phức hợp, hồ bơi phong cách resort và an ninh đa lớp 24/7.'},
      {q: 'Tiêu chuẩn bàn giao ra sao?', a: 'Thấp tầng bàn giao hoàn thiện mặt ngoài; bên trong giao thô hoặc hoàn thiện tùy phân khu, cho phép gia chủ tự thiết kế nội thất.'},
      {q: 'Tiềm năng tăng giá của dự án?', a: 'Hạ tầng Vành đai 3, cao tốc Mộc Bài, Metro số 2; mô hình all-in-one 1.080 ha kéo cư dân ở thực; mặt bằng giá Hóc Môn còn thấp; uy tín Vingroup bảo chứng tiến độ và thanh khoản.'},
      {q: 'Giữ chỗ (booking) có được hoàn tiền không?', a: 'Có. Booking thiện chí có hoàn lại 100% nếu khách chưa chọn được căn ưng ý; nếu quyết định mua, tiền giữ chỗ chuyển thành tiền cọc.'},
      {q: 'Đã có giá bán chi tiết chưa?', a: 'Giá bán và chính sách chính thức công bố vào ngày mở bán; các thông tin trước đó là dự kiến.'},
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
      {title: 'Nhà phố 50 m²', body: 'Liền kề', detail: 'Nhà phố liền kề diện tích gọn, tối ưu chi phí sở hữu, nằm trong các khu ở xanh.', image: '/api/files/sgp-house-1'},
      {title: 'Nhà phố 55 m²', body: 'Liền kề', detail: 'Mặt tiền rộng hơn, công năng linh hoạt cho gia đình trẻ.', image: '/api/files/sgp-house-3'},
      {title: 'Nhà phố 70 m²', body: 'Liền kề', detail: 'Không gian sống rộng rãi, phù hợp ở thực kết hợp kinh doanh nhỏ.', image: '/api/files/sgp-house-4'},
      {title: 'Nhà phố 112 m²', body: 'Liền kề lớn', detail: 'Diện tích lớn, phù hợp gia đình nhiều thế hệ hoặc kinh doanh.', image: '/api/files/sgp-house-5'},
      {title: 'Nhà phố xẻ khe 80 m²', body: 'Xẻ khe', detail: 'Thiết kế xẻ khe lấy sáng, thông gió tự nhiên, sân vườn nội khối.', image: '/api/files/sgp-house-10'},
      {title: 'Nhà phố xẻ khe 88 m²', body: 'Xẻ khe', detail: 'Phiên bản rộng hơn của dòng xẻ khe, nhiều mảng xanh.', image: '/api/files/sgp-house-11'},
      {title: 'Liền kề kinh doanh 123,5 m²', body: 'Kinh doanh', detail: 'Mặt tiền trục thương mại, khai thác dòng tiền cho thuê.', image: '/api/files/sgp-house-2'},
      {title: 'Biệt thự song lập 150 m²', body: 'Song lập', detail: 'Biệt thự song lập kinh doanh 10×15 m, không gian sống riêng tư.', image: '/api/files/sgp-house-6'},
    ],
    connections: [
      {title: 'Quốc lộ 22 Xuyên Á', body: '~16.000 tỷ đồng', detail: 'Tuyến huyết mạch nối TP.HCM – Tây Ninh – cửa khẩu Mộc Bài, hành lang Xuyên Á liên kết Campuchia – ASEAN.', image: '/api/files/sgp-road-1'},
      {title: 'Cao tốc TP.HCM – Mộc Bài', body: '~20.000 tỷ đồng', detail: 'Hành lang giao thương quốc tế & logistics xuyên biên giới giữa TP.HCM với ASEAN.', image: '/api/files/sgp-road-3'},
      {title: 'Metro số 2', body: '~57.000 tỷ đồng', detail: 'Bến Thành – Tham Lương, tuyến metro xuyên tâm dài nhất TP.HCM, trục TOD kích hoạt giá trị khu Tây Bắc.', image: '/api/files/sgp-road-2'},
      {title: 'Vành đai 3', body: '~75.400 tỷ đồng', detail: 'Kết nối Tây Bắc với toàn vùng kinh tế trọng điểm phía Nam, liên thông sân bay Long Thành & cảng Cái Mép – Thị Vải.', image: '/api/files/sgp-road-4'},
      {title: 'Vành đai 4', body: '~120.500 tỷ đồng', detail: 'Tuyến liên vùng lớn nhất Đông Nam Bộ, hành lang cho công nghiệp, đô thị sinh thái & kinh tế tri thức.', image: '/api/files/sgp-road-5'},
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
