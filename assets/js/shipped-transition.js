/* Only the homepage ↔ Shipped journey. Other project transitions stay in sky.js. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const street = location.pathname === '/shipped/';
  const home = location.pathname === '/' || location.pathname === '/index.html';
  if (!street && !home) return;
  const isJourney = (url) => {
    const path = new URL(url, location.href).pathname;
    return street ? path === '/' || path === '/index.html' : path === '/shipped/';
  };
  const mark = () => root.classList.add('shipped-hop');
  const fromStreet = () => {
    const from = window.navigation?.activation?.from?.url || document.referrer;
    return home && from && new URL(from).pathname === '/shipped/';
  };
  const arrival = () => {
    const from = window.navigation?.activation?.from?.url || document.referrer;
    return fromStreet() || (street && from && ['/', '/index.html'].includes(new URL(from).pathname));
  };
  if (arrival()) { mark(); if (!window.CSSViewTransitionRule && !reduced) root.classList.add('shipped-fallback'); }
  const restore = () => {
    if (!fromStreet() || location.hash) return;
    // Restore the place we left, before the browser takes its arrival snapshot.
    try { const y = sessionStorage.getItem('shipped-home-y'); if (y !== null) scrollTo({ top: +y, behavior: 'instant' }); } catch {}
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in');
    });
  };
  document.addEventListener('DOMContentLoaded', restore);
  if (!window.CSSViewTransitionRule) addEventListener('load', () => {
    restore();
    root.classList.add('shipped-arrived');
  });
  addEventListener('pagereveal', e => {
    if (arrival()) { mark(); restore(); }
    e.viewTransition?.finished.finally(() => root.classList.remove('shipped-hop'));
  });
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.origin !== location.origin || !isJourney(a.href)) return;
    mark();
    if (home) { try { sessionStorage.setItem('shipped-home-y', String(scrollY)); } catch {} }
    if (window.CSSViewTransitionRule || reduced) return;
    // Consume only this route before the shared fallback adds a second entrance.
    e.preventDefault();
    root.classList.add('shipped-leaving');
    setTimeout(() => { location.href = a.href; }, 180);
  }, true);
  addEventListener('pageshow', () => root.classList.remove('shipped-leaving'));
})();
