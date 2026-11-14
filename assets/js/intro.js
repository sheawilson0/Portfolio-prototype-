/* The intro: the sun (the moon at night) comes up big and settles above the headline, the words follow, and the
   work rises in once its first pictures are ready, so the page lands already drawn. <head> sets html.intro.
   Any scroll, key, click or touch skips it. */
(() => {
  const root = document.documentElement;
  let stop = null, timers = [];
  const end = () => {
    timers.forEach(clearTimeout); timers = []; stop?.abort(); stop = null;
    root.classList.remove('intro', 'intro-go', 'intro-land');
  };
  function play() {
    if (!document.querySelector('.home .hero')) return end();
    root.classList.add('intro-go');
    stop = new AbortController();
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => addEventListener(t, end, { signal: stop.signal, passive: true }));
    // The work comes in after the words, and not before the pictures on the first screen are in (four seconds at most).
    const land = parseFloat(getComputedStyle(root).getPropertyValue('--intro-land')) * 1000;
    const first = [...document.querySelectorAll('.work .item:nth-child(-n+2) .media img')].filter((i) => i.checkVisibility?.() !== false);
    const loaded = Promise.all(first.map((i) => (i.complete ? 0 : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))));
    const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));
    const mine = stop;
    Promise.all([Promise.race([loaded, wait(4000)]), wait(land + 500)]).then(() => {
      if (stop !== mine) return;
      root.classList.add('intro-land');
      timers.push(setTimeout(end, 1300));
    });
  }
  if (root.classList.contains('intro')) play();
})();
