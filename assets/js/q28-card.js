/* The live Quit28 card on the homepage: the calendar ticks off a day at a time and the craving timer
   counts down while you breathe with the circle. It runs while the card is on screen, or only while
   you hover it (data-q28="live-hover"). Still with reduced motion. */
(() => {
  const card = document.querySelector('.t-quit');
  const live = card && card.querySelector('.q-live');
  if (!live) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const grid = live.querySelector('[data-ql-grid]'), dayEl = live.querySelector('[data-ql-day]');
  const timeEl = live.querySelector('[data-ql-time]'), sayEl = live.querySelector('[data-ql-say]'), timer = live.querySelector('.ql-timer');
  grid.innerHTML = Array.from({ length: 28 }, (_, i) => `<i>${i + 1}</i>`).join('');
  const cells = [...grid.children];
  let day = 9, secs = 180, n = 0, clock = null, seen = false, hover = false;

  function paint() {
    cells.forEach((c, i) => { c.classList.toggle('is-done', i < day); c.classList.toggle('is-today', i === day); });
    dayEl.textContent = Math.min(day + 1, 28);
  }
  // Once a second: the timer counts down, the calendar ticks off a day every two, and the circle
  // breathes in and out every four. After day 28 the calendar starts again.
  function step() {
    if (n % 2 === 0) {
      day = day >= 28 ? 0 : day + 1;
      paint();
      const c = cells[day - 1];
      if (c) { c.classList.remove('is-pop'); void c.offsetWidth; c.classList.add('is-pop'); }
    }
    secs = secs <= 0 ? 180 : secs - 1;
    timeEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    timer.style.setProperty('--ql-left', String(100 - secs / 1.8));
    if (n % 4 === 0) {
      const inhale = (n / 4) % 2 === 0;
      timer.style.setProperty('--ql-b', inhale ? '1' : '.82');
      sayEl.textContent = inhale ? 'Breathe in' : 'Breathe out';
    }
    n++;
  }
  const want = () => !reduced && (document.body.dataset.q28 === 'live-hover' ? hover : seen);
  function sync() {
    if (want() && !clock) { step(); clock = setInterval(step, 1000); }
    else if (!want() && clock) { clearInterval(clock); clock = null; }
  }
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { threshold: .3 }).observe(card);
  card.addEventListener('pointerenter', () => { hover = true; sync(); });
  card.addEventListener('pointerleave', () => { hover = false; sync(); });
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['data-q28'] });
  paint();
})();
