'use client';
import {createContext, useContext, type ReactNode} from 'react';
import {copyDefaults, type SiteCopy} from '@/lib/site-copy';

const CopyContext = createContext<SiteCopy>({});
export function SiteCopyProvider({copy, children}: {copy: SiteCopy; children: ReactNode}) {
  return <CopyContext.Provider value={copy}>{children}</CopyContext.Provider>;
}
/** t('home.services.title') → saved override, else the default text. */
export function useCopy() {
  const copy = useContext(CopyContext);
  return (key: string) => (copy[key]?.trim() ? copy[key] : copyDefaults[key] ?? key);
}
