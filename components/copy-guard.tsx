'use client';
/* Copy guard for the public site: right-click only on links (to copy / share the link), no "Save image", no text
 * selection or copying, no dragging images or links out, and the usual view-source / save / dev-tools shortcuts are
 * blocked. Form fields keep working, and signed-in admin pages (/admin, /vinh-tien-editor) are not affected.
 * Note: this only deters casual copying — the address bar and screenshots cannot be locked by any website. */
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

const editable = (t: EventTarget | null) => t instanceof Element && !!t.closest('input, textarea, select, [contenteditable="true"], .allow-copy');
/** Links stay shareable: right-click → Copy link address works on any link. */
const onLink = (t: EventTarget | null) => t instanceof Element && !!t.closest('a[href]');

export default function CopyGuard() {
  const path = usePathname() || '';
  const off = /^\/(admin|vinh-tien-editor|tai-khoan|dang-nhap|dang-ky)/.test(path);
  useEffect(() => {
    if (off) return;
    const root = document.documentElement;
    root.classList.add('copy-guard');
    // Browsers driven by automation (Playwright, Puppeteer, Selenium, AI browsing agents built on them) see no project content.
    if (navigator.webdriver && /^\/du-an\/[^/]+/.test(path)) root.classList.add('bot-lock');
    const stop = (e: Event) => {if (!editable(e.target)) e.preventDefault();};
    const onCopy = (e: ClipboardEvent) => {
      if (editable(e.target)) return;
      e.preventDefault();
      e.clipboardData?.setData('text/plain', 'Nội dung thuộc bản quyền LUAN GROUP – luangroup.asia');
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
      const devtools = e.key === 'F12' || (mod && e.shiftKey && ['i', 'j', 'c'].includes(k)) || (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(k));
      const page = mod && ['u', 's', 'p'].includes(k);
      const copy = mod && ['c', 'x', 'a'].includes(k) && !editable(e.target);
      if (devtools || page || copy) {e.preventDefault(); e.stopPropagation();}
    };
    const menu = (e: Event) => {if (!onLink(e.target)) stop(e);};
    document.addEventListener('contextmenu', menu);
    document.addEventListener('dragstart', stop);
    document.addEventListener('selectstart', stop);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('keydown', onKey, true);
    return () => {
      root.classList.remove('copy-guard', 'bot-lock');
      document.removeEventListener('contextmenu', menu);
      document.removeEventListener('dragstart', stop);
      document.removeEventListener('selectstart', stop);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [off, path]);
  return null;
}
