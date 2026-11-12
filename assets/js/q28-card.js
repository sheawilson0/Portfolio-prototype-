/* Quit28, live, wherever there's a [data-q28-live]: the real Day 1 screen in an iPhone, the "Your 28 days"
   calendar ticking off a day at a time, and the craving timer's breathing circle (4 seconds in, 4 out,
   three minutes) built the way the Quit28 app builds them (Quit-Coach: craving-timer.tsx, the calendar
   card). Runs while it's on screen; still with reduced motion. Also: mosaic tiles drift with the pointer. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h3M13.5 14h3M7.5 17h3"/></svg>';

  // The app's tiles sit a little crooked, each its own way. Fixed angles so it looks the same every visit.
  const TILT = [-3, 2, -1, 3, -2, 1, -3, 2, -2, 1, 3, -1, 2, -3, 1, -2, 3, -1, -3, 2, 1, -2, 3, -1, 2, -3, 1, 2];
  document.querySelectorAll('[data-q28-live]').forEach((root) => {
    root.innerHTML = `
      <span class="q28-phone"><span class="q28-screen"><img src="assets/media/quit28/iphone-day-1-logged.webp" alt="Quit28 on an iPhone: Day 1 logged" loading="lazy" decoding="async"></span></span>
      <span class="q28-cal" aria-hidden="true">
        <span class="q28-cal-head">${CAL}<span><b>Your 28 days</b><small>Days 1 to 28</small></span></span>
        <span class="q28-grid">${Array.from({ length: 28 }, (_, i) => `<i style="--r:${TILT[i]}deg">${i + 1}</i>`).join('')}</span>
      </span>
      <span class="q28-breath" aria-hidden="true"><b class="q28-sheet-title">Ride out a craving</b><span class="q28-circle"><i class="q28-track"></i><i class="q28-outer"></i><i class="q28-inner"></i><span class="q28-words"><b>Breathe in</b><small>3:00</small></span></span></span>`;
    const cells = [...root.querySelectorAll('.q28-grid i')];
    const breath = root.querySelector('.q28-breath'), word = breath.querySelector('.q28-words b'), time = breath.querySelector('.q28-words small');
    let day = 9, gone = 0, clock = null;
    const paint = () => cells.forEach((c, i) => c.classList.toggle('is-logged', i < day));
    paint();
    // Once a second, like the app: the time counts down from 3:00 and the word swaps every 4 seconds
    // (the circle's 8-second breathe animation does the rest). A day is logged every 2 seconds.
    function step() {
      gone = (gone + 1) % 180;
      const left = 180 - gone;
      time.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      word.textContent = Math.floor(gone / 4) % 2 === 0 ? 'Breathe in' : 'Breathe out';
      if (gone % 2 === 0) {
        day = day >= 28 ? 0 : day + 1;
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
