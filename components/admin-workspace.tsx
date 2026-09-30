'use client';

import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';
import Hub from './hub';

const sections = new Set(['tong-quan', 'quan-ly', 'khach-hang', 'giao-dich', 'thu-vien', 'cau-hinh', 'quan-ly-du-an', 'bai-viet', 'thanh-vien']);
const editorSections = new Set(['quan-ly', 'thu-vien', 'quan-ly-du-an', 'bai-viet']);

/** The shared layout keeps Hub's data and sidebar mounted across admin routes. */
export default function AdminWorkspace({access, children}: {access: 'admin' | 'editor'; children: ReactNode}) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const section = segments[1] || 'tong-quan';
  // The page remains responsible for server-side auth, redirects and 404s.
  if (segments[0] !== 'admin' || segments.length > 2 || !sections.has(section) || (access === 'editor' && !editorSections.has(section))) return children;
  return <>{children}<Hub route={[section]} adminMode access={access}/></>;
}
