'use client';

import {useEffect, useRef} from 'react';
import {usePathname} from 'next/navigation';

/** One decorative canvas persists while pages and transparent surfaces scroll over it. */
export default function SiteAtmosphere() {
  const canvas = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame: number | null = null;
    let shift = 0;
    let scroller: HTMLElement | null = null;

    function render() {
      frame = null;
      if (!node) return;
      if (scroller && !scroller.isConnected) scroller = null;
      const height = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      const offset = scroller ? scroller.scrollTop : window.scrollY;
      const progress = height > 0 ? Math.max(0, Math.min(1, offset / height)) : 0;
      const target = motion.matches ? 0 : -window.innerHeight * .24 * progress;
      shift = motion.matches ? 0 : shift + (target - shift) * .16;
      if (Math.abs(target - shift) < .1) shift = target;

      node.style.setProperty('--atmosphere-shift', `${shift.toFixed(2)}px`);
      node.style.setProperty('--atmosphere-light-shift', `${(-shift * .35).toFixed(2)}px`);
      if (shift !== target) frame = window.requestAnimationFrame(render);
    }

    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(render);
    }

    function onScroll(event: Event) {
      const target = event.target;
      // Fixed project workspaces scroll inside their panels instead of the document.
      if (target instanceof HTMLElement) {
        if (!target.matches('.workspace-panel-body,.floating-unit-list,.punit-detail-scroll,.editor-panel')) return;
        scroller = target;
      } else {
        scroller = null;
      }
      schedule();
    }

    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    document.addEventListener('scroll', onScroll, {passive: true, capture: true});
    window.addEventListener('resize', schedule, {passive: true});
    motion.addEventListener('change', schedule);
    schedule();

    return () => {
      resize.disconnect();
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return <div ref={canvas} className="site-atmosphere" aria-hidden="true">
    <div className="site-atmosphere-base"/>
    <div className="site-atmosphere-light"/>
  </div>;
}
