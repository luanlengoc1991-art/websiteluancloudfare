'use client';

import {usePathname, useSearchParams} from 'next/navigation';
import type {ReactNode} from 'react';
import Hub from './hub';

import {adminSections as sections, editorSections} from '@/lib/site-navigation';

/** The shared layout keeps Hub's data and sidebar mounted across admin routes. */
export default function AdminWorkspace({access, children}: {access: 'admin' | 'editor'; children: ReactNode}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = pathname.split('/').filter(Boolean);
  const section = segments[1] || 'tong-quan';
  // The page remains responsible for server-side auth, redirects and 404s.
  if (segments[0] !== 'admin' || segments.length > 2 || !sections.has(section) || (access === 'editor' && !editorSections.has(section))) return children;
  return <>{children}<Hub route={[section]} adminMode access={access} initialUploadProject={searchParams.get('project') || ''}/></>;
}
