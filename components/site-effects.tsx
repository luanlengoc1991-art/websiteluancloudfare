'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

/* Spaciaz-style motion for the public site: scroll reveal, counters, magnetic buttons,
 * header state and hero parallax. Content works without JS; it is only hidden once
 * <html> carries .fx-ready. The owner wants motion even when the OS asks for reduced motion.
 * Elements marked data-fx / .fx-count are handled on every page, immersive ones included. */
const scope = '.public-site:not(.immersive-site):not(.admin-site)';
const reveal: [string, string][] = [
  ['title', ':is(.page-heading,.compact-hero,.results-heading,.section-heading,.al-section-heading,.al-heading,.pd-heading,.nm-head,.nm-section-title,.market-section-heading) :is(h1,h2)'],
  ['', ':is(.page-heading,.compact-hero) :is(p,.eyebrow), .filter-panel, .inventory-project-counts, .al-finder, .al-feature, .al-platform, .al-journey, .al-faq, .al-contact, .pd-finder, .pd-process-wrap, .pd-news-wrap, .pd-consult, .nm-spotlight, .nm-list, .nm-tour, .guide-list details, .public-sidebar .nm-panel, .site-footer .footer-grid>div'],
  ['zoom', '.unit-card, .catalog-unit-card, .project-card, .pd-card, .al-project, .al-news-list>article, .al-step, .nm-card, .nm-row, .market-project, .zone-card'],
];
const counters = ':is(.al-platform-stats dd,.pd-count-value b,.pd-feature-count b,.project-unit-count strong,.al-green-count>strong,.market-project-count strong,.market-hero-count strong,.fx-count)';
const magnetic = ':is(.button,.al-button,.pd-button,.account-button,.nm-read)';

export default function SiteEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('fx-ready');

    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('fx-in');
        io.unobserve(entry.target);
        if (entry.target.matches(counters)) count(entry.target as HTMLElement);
      }
    }, {rootMargin: '0px 0px -8% 0px', threshold: .08});

    function tag() {
      for (const [kind, selector] of reveal) {
        document.querySelectorAll(`${scope} :is(${selector})`).forEach(el => {
          if (seen.has(el) || el.closest('[role=dialog],[data-slot=sheet-content],.fx-marquee')) return;
          seen.add(el);
          if (!el.hasAttribute('data-fx')) el.setAttribute('data-fx', kind);
          const siblings = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.hasAttribute('data-fx')) : [];
          (el as HTMLElement).style.setProperty('--fx-i', String(Math.max(0, siblings.indexOf(el)) % 6));
          io.observe(el);
        });
      }
      // Layout components mark their own elements with data-fx.
      document.querySelectorAll('[data-fx]').forEach(el => {
        if (seen.has(el)) return;
        seen.add(el);
        const siblings = el.parentElement ? Array.from(el.parentElement.children).filter(c => c.hasAttribute('data-fx')) : [];
        (el as HTMLElement).style.setProperty('--fx-i', String(Math.max(0, siblings.indexOf(el)) % 6));
        io.observe(el);
      });
      document.querySelectorAll(`${scope} ${counters}, .fx-count`).forEach(el => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    }

    function count(el: HTMLElement) {
      const text = el.textContent?.trim() || '';
      if (!/^\d[\d.]*$/.test(text) || el.children.length) return;
      const target = Number(text.replace(/\./g, ''));
      if (!Number.isFinite(target) || target < 2) return;
      const start = performance.now(), duration = Math.min(2200, 900 + target * 2);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration), eased = 1 - Math.pow(1 - t, 3);
        el.textContent = t < 1 ? Math.round(target * eased).toLocaleString('vi-VN') : text;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = window.setTimeout(() => {pending = 0; tag();}, 120);
    });
    tag();
    mo.observe(document.body, {childList: true, subtree: true});

    // Header state and hero parallax share one rAF per scroll frame.
    let ticking = false;
    const photos = () => document.querySelectorAll<HTMLElement>('.site-atmosphere-photo,.sz-h6-hero-img');
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const y = window.scrollY;
        root.classList.toggle('is-scrolled', y > 24);
        if (y < 900) photos().forEach(p => p.style.setProperty('--parallax', `${Math.round(y * .28)}px`));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});

    // Magnetic buttons on fine pointers only.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let active: HTMLElement | null = null;
    const release = () => {if (active) {active.style.translate = ''; active = null;}};
    const onMove = (event: PointerEvent) => {
      if (!fine.matches) return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>(`${scope} ${magnetic}`) : null;
      if (target !== active) release();
      if (!target) return;
      active = target;
      const r = target.getBoundingClientRect();
      target.style.translate = `${((event.clientX - r.left) / r.width - .5) * 10}px ${((event.clientY - r.top) / r.height - .5) * 8}px`;
    };
    document.addEventListener('pointermove', onMove, {passive: true});
    document.addEventListener('pointerleave', release);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(pending);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', release);
      release();
    };
  }, [pathname]);

  return null;
}
