/* Cursor styles (lab: Cursor), for mice and trackpads only. Normal: the usual arrow. Dot: a small ink dot in place
   of the arrow that opens into a ring over anything clickable. Glass: a frosted bead like the nav that drifts after
   the pointer. Sky glow: the usual arrow with a soft glow of the sky's colour under it. In every style, things with
   a data-cursor label (the painting, the logos, the project cards) show it in a small pill beside the pointer. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cur = document.createElement('div');
  cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<span></span>';
  const tag = cur.firstChild;
  document.body.append(cur); document.body.classList.add('has-cur');
  const LAG = { glass: .2, halo: .3 };
  let x = -200, y = -200, cx = x, cy = y, raf = 0;
  const tick = () => {
    const k = still ? 1 : LAG[document.body.dataset.cur] || 1;
    cx += (x - cx) * k; cy += (y - cy) * k;
    cur.style.translate = `${cx}px ${cy}px`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > .3 ? requestAnimationFrame(tick) : 0;
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!cur.classList.contains('is-in')) { cx = e.clientX; cy = e.clientY; cur.classList.add('is-in'); }
    x = e.clientX; y = e.clientY;
    const hit = e.target.closest?.('a, button, [data-cursor], [role="button"], label');
    const label = hit?.closest('[data-cursor]')?.dataset.cursor || '';
    cur.classList.toggle('is-link', !!hit);
    cur.classList.toggle('has-label', !!label);
    if (label && tag.textContent !== label) tag.textContent = label;
    raf ||= requestAnimationFrame(tick);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => cur.classList.remove('is-in'));
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
})();
