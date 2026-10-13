'use client';
/* "Nổi bật" side panel: three tabs (Dự án · Quỹ căn · Mặt bằng căn) with compact numbered rows.
 * Green Paradise and Sài Gòn Park always come first. */
import {useState} from 'react';
import {ChevronRight, Flame, LayoutGrid, MapPin} from 'lucide-react';
import Link from './site-link';
import type {Project, Unit} from '@/lib/catalog';
import {projectPath, unitPlanPath} from '@/lib/project-routes';
import {sized} from '@/lib/img';

export const TRENDING_FIRST = ['green-paradise', 'saigon-park'];
type Tab = 'project' | 'unit' | 'plan';
const fmt = (n: number) => n.toLocaleString('vi-VN', {maximumFractionDigits: 2});

export default function TrendingPanel({projects, units, statusOf}: {projects: Project[]; units: Unit[]; statusOf: (u: Unit) => string}) {
  const [tab, setTab] = useState<Tab>('project');
  const ordered = [...projects.filter(p => TRENDING_FIRST.includes(p.id)).sort((a, b) => TRENDING_FIRST.indexOf(a.id) - TRENDING_FIRST.indexOf(b.id)), ...projects.filter(p => p.hot && !TRENDING_FIRST.includes(p.id))];
  const count = (id: string) => units.filter(u => u.projectId === id).length;
  const free = (id: string) => units.filter(u => u.projectId === id && statusOf(u) === 'Còn hàng').length;
  // Quỹ căn: cheapest available units of each featured project, taken in turns so every project shows up.
  const pools = ordered.map(p => units.filter(u => u.projectId === p.id && statusOf(u) === 'Còn hàng').sort((a, b) => (a.price || 1e9) - (b.price || 1e9)));
  const hotUnits: Unit[] = [];
  for (let i = 0; hotUnits.length < 12 && pools.some(q => q.length > i); i++) for (const q of pools) if (q[i] && hotUnits.length < 12) hotUnits.push(q[i]);
  const byId = new Map(projects.map(p => [p.id, p]));
  const rows = tab === 'unit'
    ? hotUnits.map(u => ({key: u.id, href: unitPlanPath(u), img: byId.get(u.projectId)?.image, name: u.code, sub: byId.get(u.projectId)?.name || '', badge: u.price ? fmt(u.price) + ' tỷ' : 'Liên hệ'}))
    : ordered.filter(p => tab === 'project' || count(p.id)).map(p => ({key: p.id, href: tab === 'project' ? projectPath(p.id, 'overview') : '/mat-bang-can?project=' + encodeURIComponent(p.id), img: p.image, name: p.name, sub: p.location,
      badge: tab === 'project' ? `${free(p.id)}/${count(p.id)} còn hàng` : `${count(p.id)} mã căn`}));
  return <div className="trp">
    <div className="trp-tabs" role="tablist">
      {([['project', 'Dự án'], ['unit', 'Quỹ căn'], ['plan', 'Mặt bằng căn']] as const).map(([k, l]) =>
        <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{l}</button>)}
    </div>
    <p className="trp-note">{tab === 'project' ? <><Flame size={14}/>Dự án nổi bật</> : tab === 'unit' ? <><Flame size={14}/>Căn còn hàng nổi bật</> : <><LayoutGrid size={14}/>Xem mặt bằng từng căn</>}</p>
    <ol className="trp-list">{rows.map((r, i) => <li key={r.key}><Link href={r.href}>
      <span className="trp-img">{r.img && <img src={sized(r.img, 160)} alt="" loading="lazy"/>}<b>{i + 1}</b></span>
      <span className="trp-body"><strong>{r.name}</strong><small><MapPin size={11}/>{r.sub}</small><em>{r.badge}</em></span>
      <ChevronRight size={18}/></Link></li>)}
      {!rows.length && <li className="trp-empty">Chưa có dữ liệu.</li>}</ol>
  </div>;
}
