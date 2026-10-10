import type {Article, Project, Unit} from './catalog';
import type {AboutContent, Guide} from './site-content';
import {profileFor} from './project-profiles';
import {projectPath, unitPlanPath} from './project-routes';
import {normalizeCustomerMessage as normalize} from './customer-care';

/** Plain-text snapshot of what the public website shows, sent with each chatbot question.
 *  Built in the browser from the same merged data the pages render, so answers match the site. */
export type KnowledgeInput = {
  projects: Project[]; units: Unit[]; statusOf: (u: Unit) => string; articles: Article[];
  about: AboutContent; guides: Guide[]; contact: {phone: string; email: string; address?: string};
  question: string; projectId?: string;
};

const MAX_UNITS = 700;
const money = (n: number) => n ? n.toLocaleString('vi-VN', {maximumFractionDigits: 3}) + ' tỷ' : 'Liên hệ';
const cut = (s: string, n: number) => {const t = (s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t;};

/** Projects the question is about: the selected one plus any named in the question or owning a quoted unit code. */
export function focusProjects({projects, units, question, projectId}: Pick<KnowledgeInput, 'projects' | 'units' | 'question' | 'projectId'>) {
  const q = normalize(question), ids = new Set<string>();
  if (projectId) ids.add(projectId);
  for (const p of projects) {
    const name = normalize(p.name).replace(/^vinhomes\s+/, '');
    if (q.includes(normalize(p.name)) || (name.length > 3 && q.includes(name)) || q.includes(p.id.replaceAll('-', ' '))) ids.add(p.id);
  }
  for (const u of units) if (u.code.length > 2 && q.includes(normalize(u.code))) ids.add(u.projectId);
  return ids;
}

function unitLine(u: Unit, statusOf: (u: Unit) => string) {
  return [u.code, u.type, u.zone, u.tower, u.area ? `DT đất ${u.area} m²` : '', u.builtArea ? `DTXD ${u.builtArea} m²` : '', u.direction, u.model ? `mẫu ${u.model}` : '',
    `giá ${money(u.price)}`, statusOf(u), unitPlanPath(u)].filter(v => v && v !== 'Đang cập nhật').join(' | ');
}

export function buildKnowledge(input: KnowledgeInput) {
  const {projects, units, statusOf, articles, about, guides, contact} = input;
  const focus = focusProjects(input);
  const out: string[] = [];
  out.push('# LIÊN HỆ', `Hotline/Zalo: ${contact.phone}`, contact.email ? `Email: ${contact.email}` : '', contact.address ? `Địa chỉ: ${contact.address}` : '');
  out.push('', '# CÁC TRANG CHÍNH', 'Trang chủ: / · Dự án: /du-an · Quỹ căn toàn quốc: /quy-hang · Mặt bằng căn: /mat-bang-can · Tin tức: /tin-tuc · Hướng dẫn: /huong-dan · Liên hệ: /lien-he · Giới thiệu: /gioi-thieu');
  out.push('', '# GIỚI THIỆU ALPHA HUB', cut([about.headline, about.introduction, about.platformTitle, about.platformBody].filter(Boolean).join('. '), 800));
  for (const f of about.faq || []) out.push(`Hỏi: ${f.question} — Đáp: ${cut(f.answer, 400)}`);

  out.push('', '# DANH SÁCH DỰ ÁN');
  for (const p of projects) {
    const all = units.filter(u => u.projectId === p.id), prices = all.map(u => u.price).filter(n => n > 0);
    const count = (s: string) => all.filter(u => statusOf(u) === s).length;
    out.push(`## ${p.name} (id ${p.id})`,
      `Vị trí: ${p.location} · Khu vực: ${p.region} · Chủ đầu tư: ${p.developer} · Loại hình: ${p.category} · Tình trạng: ${p.status}`,
      `Quỹ căn trên website: ${all.length} căn (còn hàng ${count('Còn hàng')}, giữ chỗ ${count('Đang giữ chỗ')}, đã bán ${count('Đã bán')})${prices.length ? `, giá từ ${money(Math.min(...prices))} đến ${money(Math.max(...prices))}` : ''}.`,
      `Trang dự án: ${projectPath(p.id)} · Bảng hàng: ${projectPath(p.id, 'inventory')}`,
      `Mô tả: ${cut(p.description, focus.has(p.id) ? 2000 : 300)}`);
  }

  for (const id of focus) {
    const p = projects.find(x => x.id === id); if (!p) continue;
    const f = profileFor(p, units, statusOf);
    out.push('', `# CHI TIẾT DỰ ÁN ${p.name}`, cut(`${f.headline}. ${f.intro}`, 1500));
    const list = (title: string, rows?: string[]) => {if (rows?.length) out.push(`${title}:`, ...rows.map(r => '- ' + r));};
    list('Số liệu', f.stats.map(s => `${s.label}: ${s.value}${s.suffix || ''}`));
    list('Thông tin', f.facts?.map(x => `${x.label}: ${x.value}`));
    list('Điểm nổi bật', f.highlights);
    list('Phân khu', f.zones.map(z => `${z.name}${z.local ? ` (${z.local})` : ''}${z.area ? `, ${z.area}` : ''}: ${cut(z.body, 300)}`));
    if (f.location) list(`Vị trí – ${f.location.title}`, f.location.body.map(b => cut(b, 300)));
    list('Kết nối hạ tầng', f.connections?.map(c => `${c.title}: ${cut(c.body + (c.detail ? ' ' + c.detail : ''), 300)}`));
    list('Tiện ích', f.amenities.map(a => `${a.title}: ${cut(a.body, 200)}`));
    list('Sản phẩm', f.products?.map(x => `${x.title}: ${cut(x.body + (x.detail ? ' ' + x.detail : ''), 300)}`));
    if (f.priceFrom) out.push(`Giá từ: ${f.priceFrom.value} (${f.priceFrom.label})`);
    list('Chính sách bán hàng', f.policies?.map(x => `${x.label}: ${x.value}`));
    list('Thanh toán', f.payment?.map(x => `${x.title}: ${cut(x.body, 300)}`));
    list('Pháp lý', f.legal);
    list('Tiến độ', f.timeline.map(t => `${t.date ? t.date + ' – ' : ''}${t.title}: ${cut(t.body, 200)}`));
    list('Hỏi đáp', f.faq?.map(x => `${x.q} — ${cut(x.a, 400)}`));
  }

  // Unit list: full for the focus projects, otherwise every project shares the cap; quoted codes always included.
  const q = normalize(input.question);
  const quoted = units.filter(u => u.code.length > 2 && q.includes(normalize(u.code)));
  const cap = focus.size ? MAX_UNITS : 300;
  const pool = focus.size ? units.filter(u => focus.has(u.projectId)) : units.filter(u => statusOf(u) === 'Còn hàng').sort((a, b) => (a.price || 1e9) - (b.price || 1e9));
  const shown = new Set([...quoted, ...pool.slice(0, cap)]);
  out.push('', `# QUỸ CĂN (mã | loại hình | phân khu | tòa | DT đất | DTXD | hướng | mẫu nhà | giá chưa VAT+KPBT | trạng thái | link mặt bằng căn)`,
    focus.size ? (pool.length > cap ? `Hiển thị ${cap}/${pool.length} căn của dự án đang hỏi, phần còn lại xem bảng hàng.` : 'Đầy đủ các căn của dự án đang hỏi.')
      : `Chưa chọn dự án: chỉ liệt kê ${Math.min(cap, pool.length)}/${pool.length} căn còn hàng giá thấp nhất toàn hệ thống; muốn xem đủ, hỏi theo từng dự án.`);
  for (const p of projects) {
    const rows = [...shown].filter(u => u.projectId === p.id); if (!rows.length) continue;
    out.push(`## ${p.name}`, ...rows.map(u => unitLine(u, statusOf)));
  }

  const visible = guides.filter(g => g.visible && g.title);
  if (visible.length) out.push('', '# HƯỚNG DẪN SỬ DỤNG WEBSITE', ...visible.map(g => `- ${g.title}: ${cut(g.body, 400)}`));
  if (articles.length) out.push('', '# TIN TỨC', ...[...articles].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 12).map(a => `- ${a.title} (${a.date}, ${a.category}): ${cut(a.body, 300)}`));
  return out.filter(l => l !== '').join('\n').slice(0, 140000);
}
