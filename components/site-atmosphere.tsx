'use client';

import {useEffect, useRef} from 'react';
import {usePathname} from 'next/navigation';

const figures = '.unit-code,.price,.detail-price,.money,.unit-price-card strong,.punit-price-main strong,.pd-feature-count b,.pd-count-value b,.pd-band-count b,.project-unit-count strong,.al-green-count>strong,.al-platform-stats dd,.ap-metric strong,.admin-metrics strong,.stat-card>strong';
const largeText = `h1,h2,h3,h4,${figures}`;
const excludedText = 'input,textarea,select,label,small,time,svg,.eyebrow,.result-count,[contenteditable="true"],.poster,.pricing-sheet,.punit-poster,.vt-drawing';

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
    let targetShift = 0;
    let measurePending = true;
    let scroller: HTMLElement | null = null;

    function render() {
      frame = null;
      if (!node) return;
      // Read layout once per scroll/resize, not on every easing frame.
      if (measurePending) {
        measurePending = false;
        if (scroller && !scroller.isConnected) scroller = null;
        const height = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
        const offset = scroller ? scroller.scrollTop : window.scrollY;
        const progress = height > 0 ? Math.max(0, Math.min(1, offset / height)) : 0;
        targetShift = motion.matches ? 0 : -window.innerHeight * .55 * progress;
      }
      shift = motion.matches ? 0 : shift + (targetShift - shift) * .16;
      if (Math.abs(targetShift - shift) < .1) shift = targetShift;

      node.style.setProperty('--atmosphere-shift', `${shift.toFixed(2)}px`);
      node.style.setProperty('--atmosphere-light-shift', `${(-shift * .35).toFixed(2)}px`);
      if (shift !== targetShift) frame = window.requestAnimationFrame(render);
    }

    function schedule() {
      measurePending = true;
      if (!document.hidden && frame === null) frame = window.requestAnimationFrame(render);
    }

    function onVisibility() {
      if (document.hidden && frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      } else if (!document.hidden) schedule();
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
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', schedule, {passive: true});
    motion.addEventListener('change', schedule);
    schedule();

    return () => {
      resize.disconnect();
      document.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let activeText: HTMLElement | null = null;
    let styles = new WeakMap<HTMLElement, {color: string; light: boolean} | null>();

    function clearText() {
      if (!activeText) return;
      activeText.removeAttribute('data-atmosphere-text');
      activeText.style.removeProperty('--atmosphere-text-active');
      activeText.style.removeProperty('--atmosphere-text-glow');
      activeText.style.removeProperty('--atmosphere-text-rest');
      activeText = null;
    }

    function lightText(target: Element | null) {
      const blocked = target?.closest(excludedText);
      const candidate = blocked ? null : target?.closest(largeText);
      const next = candidate instanceof HTMLElement && candidate.textContent?.trim() ? candidate : null;
      if (next === activeText) return;
      clearText();
      if (!next) return;

      let style = styles.get(next);
      if (style === undefined) {
        const computed = window.getComputedStyle(next);
        // Primary codes/prices start at 22px; compact headings and table cells stay plain.
        if (parseFloat(computed.fontSize) < (next.matches(figures) ? 22 : 24)) {
          styles.set(next, null);
          return;
        }
        let color = computed.color;
        let rgb = color.match(/[\d.]+/g)?.map(Number) || [];
        let parent = next.parentElement;
        while (parent && (rgb.length < 3 || (rgb.length > 3 && rgb[3] === 0))) {
          color = window.getComputedStyle(parent).color;
          rgb = color.match(/[\d.]+/g)?.map(Number) || [];
          parent = parent.parentElement;
        }
        style = {color, light: rgb.length < 3 || .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2] > 150};
        styles.set(next, style);
      }
      if (!style) return;
      next.style.setProperty('--atmosphere-text-rest', style.color);
      next.style.setProperty('--atmosphere-text-active', style.light ? '#9ff0c1' : '#127a51');
      next.style.setProperty('--atmosphere-text-glow', style.light ? '#9ff0c14d' : '#127a5130');
      next.setAttribute('data-atmosphere-text', '');
      activeText = next;
    }

    function onPointerOver(event: PointerEvent) {
      if (event.pointerType === 'touch' || !finePointer.matches) {
        clearText();
        return;
      }
      lightText(event.target instanceof Element ? event.target : null);
    }

    function onPointerOut(event: PointerEvent) {
      lightText(finePointer.matches && event.relatedTarget instanceof Element ? event.relatedTarget : null);
    }

    function resetStyles() {
      clearText();
      styles = new WeakMap();
    }

    // No pointermove loop or hit-testing while scrolling. Only entering/leaving a title does work.
    document.addEventListener('pointerover', onPointerOver, {passive: true});
    document.addEventListener('pointerout', onPointerOut, {passive: true});
    document.addEventListener('pointerleave', clearText);
    document.addEventListener('scroll', clearText, {passive: true, capture: true});
    document.addEventListener('visibilitychange', clearText);
    window.addEventListener('blur', clearText);
    window.addEventListener('resize', resetStyles, {passive: true});
    finePointer.addEventListener('change', resetStyles);

    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('pointerleave', clearText);
      document.removeEventListener('scroll', clearText, true);
      document.removeEventListener('visibilitychange', clearText);
      window.removeEventListener('blur', clearText);
      window.removeEventListener('resize', resetStyles);
      finePointer.removeEventListener('change', resetStyles);
      clearText();
    };
  }, [pathname]);

  return <div ref={canvas} className="site-atmosphere" aria-hidden="true">
    <div className="site-atmosphere-base"/>
    <div className="site-atmosphere-light"/>
  </div>;
}
