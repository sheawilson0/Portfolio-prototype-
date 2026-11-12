/* Quit28, live, wherever there's a [data-q28-live]: the real Day 1 screen in an iPhone, the "Your 28 days"
   calendar ticking off a day at a time, and the "Ride out a craving" sheet breathing (4 seconds in, 4 out,
   three minutes). Each piece is built at the app's own sizes (Quit-Coach: journey.module.css miniCalendar,
   craving-timer.module.css) on a 520 × 540 stage, at the same scale as the phone screenshot, and the whole
   stage is scaled to the tile. Runs while it's on screen; still with reduced motion.
   Also: the mosaic tiles' layers drift with the pointer, each by its own depth (--d). */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PLAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M13 14h2M7 17h2"/></svg>';
  const X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const RING = 2 * Math.PI * 131;
  document.querySelectorAll('[data-q28-live]').forEach((root) => {
    root.innerHTML = `<span class="q28-stage">
      <span class="q28-phone" style="--d:.4"><span class="q28-screen"><img src="assets/media/quit28/iphone-day-1-logged.webp" alt="Quit28 on an iPhone: Day 1 logged" loading="lazy" decoding="async"></span></span>
      <span class="q28-sheet" style="--d:1" aria-hidden="true">
        <b class="q28-title">Ride out a craving</b><span class="q28-x">${X}</span>
        <span class="q28-breath"><svg class="q28-hug" viewBox="0 0 268 268"><circle cx="134" cy="134" r="131"/><circle class="q28-fill" cx="134" cy="134" r="131" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/></svg><i class="q28-outer"></i><i class="q28-inner"></i><span class="q28-words"><b>Breathe in</b><small>3:00</small></span></span>
      </span>
      <span class="q28-cal" style="--d:1.4" aria-hidden="true">
        <span class="q28-pin">📌</span>
        <span class="q28-head">${PLAN}<span><b>Your 28 days</b><small>Days 1 to 28</small></span></span>
        <span class="q28-days">${Array.from({ length: 28 }, (_, i) => `<i>${i + 1}</i>`).join('')}</span>
      </span>
    </span>`;
    const stage = root.firstElementChild;
    // The stage is 520 wide; scale it to the tile's width, but never so far that the calendar falls off the bottom.
    new ResizeObserver(([e]) => {
      const { width: w, height: h } = e.contentRect;
      stage.style.setProperty('--k', Math.min(w / 520, h / 500).toFixed(4));
    }).observe(root);

    const cells = [...root.querySelectorAll('.q28-days i')];
    const word = root.querySelector('.q28-words b'), time = root.querySelector('.q28-words small'), fill = root.querySelector('.q28-fill');
    let day = 6, gone = 3, clock = null;
    const paint = () => cells.forEach((c, i) => c.classList.toggle('is-logged', i < day));
    const show = () => {
      const left = 180 - gone;
      time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      word.textContent = Math.floor(gone / 4) % 2 === 0 ? 'Breathe in' : 'Breathe out';
      fill.setAttribute('stroke-dashoffset', (RING * (1 - gone / 180)).toFixed(1));
    };
    paint(); show();
    // Once a second, like the app: the time counts down from 3:00, the word swaps every 4 seconds and the ring
    // fills (the circles' 8-second breathe animation does the rest). A day is logged every 2 seconds, up to 27.
    function step() {
      gone = (gone + 1) % 180;
      show();
      if (gone % 2 === 0) {
        day = day >= 27 ? 0 : day + 1;
        paint();
        const c = cells[day - 1];
        if (c) { c.classList.remove('is-pop'); void c.offsetWidth; c.classList.add('is-pop'); }
      }
    }
    if (reduced) return;
    new IntersectionObserver(([e]) => {
      root.classList.toggle('is-running', e.isIntersecting);
      if (e.isIntersecting && !clock) clock = setInterval(step, 1000);
      else if (!e.isIntersecting && clock) { clearInterval(clock); clock = null; }
    }, { threshold: .25 }).observe(root);
  });

  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.tile').forEach((t) => t.addEventListener('pointermove', (e) => {
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - .5) * 16}px`);
    t.style.setProperty('--my', `${((e.clientY - r.top) / r.height - .5) * 12}px`);
  }));
})();
