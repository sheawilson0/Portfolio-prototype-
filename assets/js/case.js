/* Case study extras. site.js runs the nav, theme, tip, reveal and cards; this adds the pieces only these pages have. */
(() => {
  /* Near the top, the colour behind the page is the sky's (case.css); further down it's the page's. */
  const pastTop = () => document.documentElement.classList.toggle('past-top', scrollY > (document.documentElement.scrollHeight - innerHeight) / 2);
  addEventListener('scroll', pastTop, { passive: true }); pastTop();

  /* The picture at the top comes in once it's drawn (three seconds at most); case.css holds it back till then.
     After the other scripts, so the film's poster is set. */
  const top = document.querySelector('main > :first-child');
  if (top) addEventListener('DOMContentLoaded', () => {
    const pics = [...top.querySelectorAll('img')].filter((i) => i.checkVisibility?.() !== false).map((i) => i.decode()); // not the other theme's
    top.querySelectorAll('video[poster]').forEach((v) => pics.push(Object.assign(new Image(), { src: v.poster }).decode()));
    const ready = () => top.classList.add('is-ready');
    Promise.race([Promise.allSettled(pics), new Promise((r) => setTimeout(r, 3000))]).then(ready);
  });

  /* ── Squircle clip for live media ──
     A WebGL canvas or a playing video gets its own compositor layer, and while scrolling the compositor
     clips it with plain rounded corners instead of a squircle, so the corners flicker. The media sits
     outside the card's clip and gets a squircle path of its own, which the compositor keeps exactly. */
  const squircle = (w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    const n = 12, pts = [];
    // One quarter of a superellipse with exponent 4, which is what corner-shape: squircle draws.
    const corner = (cx, cy, sx, sy, from) => {
      for (let i = 0; i <= n; i++) {
        const t = (from + i / n) * Math.PI / 2;
        const c = Math.abs(Math.cos(t)) ** .5, s = Math.abs(Math.sin(t)) ** .5;
        pts.push(`${(cx + sx * c * r).toFixed(1)} ${(cy + sy * s * r).toFixed(1)}`);
      }
    };
    corner(w - r, r, 1, -1, 0);      // top right
    corner(r, r, -1, -1, 1);         // top left
    corner(r, h - r, -1, 1, 2);      // bottom left
    corner(w - r, h - r, 1, 1, 3);   // bottom right
    return `path('M ${pts.join(' L ')} Z')`;
  };
  if (CSS.supports('corner-shape', 'squircle')) {
    document.querySelectorAll('.stage > .stage-media').forEach((el) => {
      const card = el.parentElement.querySelector('.card');
      const fit = () => {
        const cs = getComputedStyle(card);
        const r = parseFloat(cs.borderTopLeftRadius) - parseFloat(cs.borderTopWidth);
        el.style.clipPath = squircle(el.clientWidth, el.clientHeight, r);
        el.classList.add('is-clipped');
      };
      new ResizeObserver(fit).observe(el);
    });
  }

  /* ── Cipher: scrolling through the section scrolls the site inside the browser window ── */
  const browse = document.querySelector('.browse');
  if (browse) {
    const screen = browse.querySelector('.browser-screen');
    const page = browse.querySelector('.browser-page');
    let queued = false;
    const update = () => {
      queued = false;
      const r = browse.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, browse.offsetHeight - innerHeight)));
      const max = Math.max(0, page.offsetHeight - screen.offsetHeight);
      page.style.transform = `translate3d(0, ${(-p * max).toFixed(1)}px, 0)`;
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    if (page.complete) update(); else page.addEventListener('load', update);
  }
})();
