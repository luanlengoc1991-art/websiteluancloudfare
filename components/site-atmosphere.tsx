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
      const target = motion.matches ? 0 : -window.innerHeight * .55 * progress;
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

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame: number | null = null;
    let x = 0, y = 0, visible = false;
    let activeText: HTMLElement | null = null;

    function clearText() {
      if (!activeText) return;
      activeText.removeAttribute('data-atmosphere-text');
      activeText.style.removeProperty('--atmosphere-text-active');
      activeText.style.removeProperty('--atmosphere-text-glow');
      activeText = null;
    }

    function lightText(target: Element | null) {
      const blocked = target?.closest('input,textarea,select,[contenteditable="true"],.poster,.pricing-sheet,.punit-poster');
      const candidate = blocked ? null : target?.closest('a,button,h1,h2,h3,h4,p,span,strong,b,small,time,dt,dd,td,th,label,summary,.price,.price-label,.money');
      const next = candidate instanceof HTMLElement && candidate.textContent?.trim() ? candidate : null;
      if (next === activeText) return;
      clearText();
      if (!next) return;

      // Gradient-filled figures inherit their contrast from the nearest visible parent.
      let element: HTMLElement | null = next;
      let rgb: number[] = [];
      while (element) {
        rgb = window.getComputedStyle(element).color.match(/[\d.]+/g)?.map(Number) || [];
        if (rgb.length >= 3 && (rgb.length < 4 || rgb[3] > 0)) break;
        element = element.parentElement;
      }
      const light = rgb.length < 3 || .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] > 150;
      next.style.setProperty('--atmosphere-text-active', light ? '#9ff0c1' : '#127a51');
      next.style.setProperty('--atmosphere-text-glow', light ? '#9ff0c14d' : '#127a5130');
      next.setAttribute('data-atmosphere-text', '');
      activeText = next;
    }

    function refreshText() {
      frame = null;
      const enabled = visible && finePointer.matches;
      lightText(enabled ? document.elementFromPoint(x, y) : null);
    }

    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(refreshText);
    }

    function onPointerOver(event: PointerEvent) {
      if (event.pointerType === 'touch' || !finePointer.matches) {
        leave();
        return;
      }
      x = event.clientX;
      y = event.clientY;
      visible = true;
      lightText(event.target instanceof Element ? event.target : null);
    }

    function onPointerMove(event: PointerEvent) {
      // Entering text changes its style; movement only records the position for scrolls.
      if (!visible) {
        onPointerOver(event);
        return;
      }
      if (event.pointerType === 'touch' || !finePointer.matches) {
        leave();
        return;
      }
      x = event.clientX;
      y = event.clientY;
    }

    function leave() {
      visible = false;
      clearText();
    }

    document.addEventListener('pointerover', onPointerOver, {passive: true});
    document.addEventListener('pointermove', onPointerMove, {passive: true});
    document.addEventListener('pointerleave', leave);
    document.addEventListener('scroll', schedule, {passive: true, capture: true});
    window.addEventListener('blur', leave);
    finePointer.addEventListener('change', schedule);

    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', leave);
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('blur', leave);
      finePointer.removeEventListener('change', schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
      clearText();
    };
  }, [pathname]);

  return <div ref={canvas} className="site-atmosphere" aria-hidden="true">
    <div className="site-atmosphere-base"/>
    <div className="site-atmosphere-light"/>
  </div>;
}
