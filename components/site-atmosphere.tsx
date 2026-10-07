'use client';

import {useEffect, useState} from 'react';
import {usePathname} from 'next/navigation';
import {sized} from '@/lib/img';
import {defaultBackgroundImage, resolveBackgroundImage, sanitizeBackgrounds, sanitizeBackgroundAppearances, resolveBackgroundAppearance, backgroundLayers, type SiteBackgrounds, type BackgroundAppearances} from '@/lib/site-backgrounds';

const figures = '.unit-code,.price,.detail-price,.money,.unit-price-card strong,.punit-price-main strong,.pd-feature-count b,.pd-count-value b,.pd-band-count b,.project-unit-count strong,.al-green-count>strong,.al-platform-stats dd,.ap-metric strong,.admin-metrics strong,.stat-card>strong';
const largeText = `h1,h2,h3,h4,${figures}`;
const excludedText = 'input,textarea,select,label,small,time,svg,.eyebrow,.result-count,[contenteditable="true"],.poster,.pricing-sheet,.punit-poster,.vt-drawing';

/** One decorative canvas persists while pages and transparent surfaces scroll over it. */
export default function SiteAtmosphere() {
  const pathname = usePathname();
  const isAlphaHub = pathname === '/alphahub';
  const hasProjectBackdrop = pathname.startsWith('/du-an/');
  const [backgrounds, setBackgrounds] = useState<SiteBackgrounds>({});
  const [appearances, setAppearances] = useState<BackgroundAppearances>({});
  const layers = backgroundLayers(resolveBackgroundAppearance(pathname, appearances));
  const usesSharedBackdrop = !isAlphaHub && !hasProjectBackdrop;
  const [failedImage, setFailedImage] = useState('');
  const selectedImage = resolveBackgroundImage(pathname, backgrounds);
  const imageSrc = failedImage === selectedImage ? defaultBackgroundImage : selectedImage;

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await fetch('/api/backgrounds', {cache: 'no-store', signal: controller.signal});
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted) {
          setBackgrounds(sanitizeBackgrounds(data.backgrounds));
          setAppearances(sanitizeBackgroundAppearances(data.backgroundAppearance));
        }
      } catch { /* The bundled photo remains available when storage is offline. */ }
      finally { pending = false; }
    };
    refresh();
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('alpha-hub-content') : null;
    if (channel) channel.onmessage = refresh;
    window.addEventListener('focus', refresh);
    return () => {
      controller.abort();
      channel?.close();
      window.removeEventListener('focus', refresh);
    };
  }, []);

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

  return <div className={`site-atmosphere${isAlphaHub ? ' is-alphahub' : ''}`} aria-hidden="true" style={usesSharedBackdrop ? {backgroundImage: layers.canvas} : undefined}>
    {usesSharedBackdrop && <img className="site-atmosphere-photo" key={imageSrc} src={sized(imageSrc, 1920)} fetchPriority="high" alt="" decoding="async" onError={() => setFailedImage(selectedImage)} style={{opacity: layers.imageOpacity}}/>}
    <div className="site-atmosphere-base" style={usesSharedBackdrop ? {backgroundImage: layers.overlay} : undefined}/>
  </div>;
}
