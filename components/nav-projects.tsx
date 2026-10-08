'use client';
/* Header menu item with a hover panel listing every project, so visitors jump straight into one. */
import {ArrowUpRight, ChevronDown, MapPin} from 'lucide-react';
import Link from './site-link';
import type {Project, Unit} from '@/lib/catalog';
import {projectPath} from '@/lib/project-routes';
import {sized} from '@/lib/img';

const targets: Record<string, {title: string; all: string; href: (p: Project) => string}> = {
  'du-an': {title: 'Đi tới dự án', all: 'Tất cả dự án', href: p => projectPath(p.id, 'overview')},
  'quy-hang': {title: 'Quỹ căn theo dự án', all: 'Toàn bộ quỹ căn', href: p => projectPath(p.id, 'inventory')},
  'mat-bang-can': {title: 'Mặt bằng căn theo dự án', all: 'Mở trang Mặt bằng căn', href: p => `/mat-bang-can?project=${encodeURIComponent(p.id)}`},
};

export default function NavProjects({id, label, href, active, projects, units}: {id: string; label: string; href: string; active: boolean; projects: Project[]; units: Unit[]}) {
  const t = targets[id];
  if (!t) return <Link className={active ? 'active' : ''} href={href}>{label}</Link>;
  return <div className="nav-drop">
    <Link className={active ? 'active' : ''} href={href}>{label}<ChevronDown size={14} className="nav-drop-caret"/></Link>
    <div className="nav-drop-panel" role="menu">
      <div className="nav-drop-head"><b>{t.title}</b><Link href={href}>{t.all}<ArrowUpRight size={14}/></Link></div>
      <div className="nav-drop-grid">{projects.map(p => {
        const mine = units.filter(u => u.projectId === p.id);
        return <Link key={p.id} href={t.href(p)} role="menuitem" className="nav-drop-item">
          <img src={sized(p.image, 160)} alt="" loading="lazy"/>
          <span><b>{p.name}</b><small><MapPin size={11}/>{p.location}</small><em>{mine.length} căn · {mine.filter(u => u.status === 'Còn hàng').length} còn hàng</em></span>
        </Link>;
      })}</div>
    </div>
  </div>;
}
