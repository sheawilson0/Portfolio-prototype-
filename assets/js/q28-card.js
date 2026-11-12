/* Quit28, live, wherever there's a [data-q28-live]: the real Day 1 screen in an iPhone mock-up, the "Your 28 days"
   calendar ticking off a day at a time, and the "Ride out a craving" circle breathing, floating on its own (4 seconds in, 4 out,
   three minutes). Each piece is built at the app's own sizes (Quit-Coach: journey.module.css miniCalendar,
   craving-timer.module.css) on a 520 × 540 stage, at the same scale as the phone screenshot, and the whole
   stage is scaled to the tile. Runs while it's on screen; still with reduced motion.
   Also, for every mosaic tile: fits each stage to its tile, and eases the pointer into --px/--py for the layered hover. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PLAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M13 14h2M7 17h2"/></svg>';
  const RING = 2 * Math.PI * 131;
  document.querySelectorAll('[data-q28-live]').forEach((root) => {
    root.innerHTML = `<span class="art q28-stage">
      <img class="q28-phone" style="--d:.4" src="assets/media/home/quit28-iphone.webp" alt="Quit28 on an iPhone: Day 1 logged" loading="lazy" decoding="async">
      <span class="q28-float" style="--d:.7" aria-hidden="true">
        <span class="q28-breath"><svg class="q28-hug" viewBox="0 0 268 268"><circle cx="134" cy="134" r="131"/><circle class="q28-fill" cx="134" cy="134" r="131" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/></svg><i class="q28-outer"></i><i class="q28-inner"></i><span class="q28-words"><b>Breathe in</b><small>3:00</small></span></span>
      </span>
      <span class="q28-cal" style="--d:1.1" aria-hidden="true">
        <span class="q28-pin">📌</span>
        <span class="q28-head">${PLAN}<span><b>Your 28 days</b><small>Days 1 to 28</small></span></span>
        <span class="q28-days">${Array.from({ length: 28 }, (_, i) => `<i>${i + 1}</i>`).join('')}</span>
      </span>
    </span>`;

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

  // Every .art stage (home.css) is drawn --w × --h; scale it to fit its tile.
  document.querySelectorAll('.art').forEach((stage) => new ResizeObserver(([e]) => {
    const cs = getComputedStyle(stage), { width, height } = e.contentRect;
    stage.style.setProperty('--k', Math.min(width / cs.getPropertyValue('--w'), height / cs.getPropertyValue('--h')).toFixed(4));
  }).observe(stage.parentElement));

  // Hover: --px and --py (-.5 to .5) follow the pointer, eased, and ease back to 0 when it leaves.
  if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const tiles = [...document.querySelectorAll('.tile')].map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));
  let raf = 0;
  const frame = () => {
    raf = 0;
    tiles.forEach((t) => {
      if (t.x === t.tx && t.y === t.ty) return;
      t.x += (t.tx - t.x) * .08; t.y += (t.ty - t.y) * .08;
      if (Math.abs(t.tx - t.x) + Math.abs(t.ty - t.y) < .001) { t.x = t.tx; t.y = t.ty; } else raf ||= requestAnimationFrame(frame);
      t.el.style.setProperty('--px', t.x.toFixed(4)); t.el.style.setProperty('--py', t.y.toFixed(4));
    });
  };
  tiles.forEach((t) => {
    t.el.addEventListener('pointermove', (e) => {
      const r = t.el.getBoundingClientRect();
      t.tx = (e.clientX - r.left) / r.width - .5; t.ty = (e.clientY - r.top) / r.height - .5;
      raf ||= requestAnimationFrame(frame);
    });
    t.el.addEventListener('pointerleave', () => { t.tx = 0; t.ty = 0; raf ||= requestAnimationFrame(frame); });
  });
})();
