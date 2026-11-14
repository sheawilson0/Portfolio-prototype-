/* The lab bar, on the homepage. Only on preview hosts, or with ?lab on the live site.
   Each row sets a data attribute on <body>; home.css does the rest. A row starts on whatever index.html sets on
   <body> (the site as it would go live). The green dot is Claude's recommendation, which may be something else. */
(() => {
  const live = /(^|\.)sheawilson\.uk$|\.vercel\.app$/.test(location.hostname);
  if (live && !new URLSearchParams(location.search).has('lab')) return;
  // [attribute, label, options, the recommended one]
  const ROWS = [
    ['arrive', 'Card pictures arrive', [['pop', 'Pop in (now)'], ['fade', 'Fade'], ['blur', 'Blur to sharp'], ['rise', 'Fade and grow']], 'fade'],
    ['preload', 'Card pictures load (reload to feel it)', [['scroll', 'As you scroll (now)'], ['early', 'Right after the page']], 'early'],
    ['slow', 'Pretend the connection is slow', [['off', 'Off'], ['on', 'On']], ''],
  ];
  if (!ROWS.length) return; // nothing open just now
  const KEY = 'home-lab-9'; // home-lab-9: options changed 14 Nov, start everyone on the defaults
  const get = (k) => { try { return JSON.parse(localStorage.getItem(KEY) || '{}')[k]; } catch (e) { return null; } };
  const set = (k, v) => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); o[k] = v; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const apply = (k, v) => { document.body.dataset[k] = v; };
  // A saved choice that's no longer an option falls back to my pick.
  ROWS.forEach(([k, , opts]) => { const v = get(k); if (opts.some((o) => o[0] === v)) apply(k, v); else if (!(k in document.body.dataset)) apply(k, opts[0][0]); });

  // The slow-connection preview: each card picture is held back for a moment every time it scrolls into view,
  // so the arrivals can be watched on fast wifi. Scroll away and back to see one again.
  const held = new IntersectionObserver((es) => es.forEach(({ target: img, isIntersecting: on }) => {
    clearTimeout(img.labHold);
    if (document.body.dataset.slow !== 'on') { img.classList.remove('is-held'); return; }
    img.classList.add('is-held');
    if (on) img.labHold = setTimeout(() => img.classList.remove('is-held'), 500 + Math.random() * 1300);
  }));
  const slow = () => document.querySelectorAll('.work .media img').forEach((img) => { held.unobserve(img); held.observe(img); });

  const css = document.createElement('style');
  css.textContent = `.lab{position:fixed;z-index:90;left:16px;bottom:16px;width:268px;max-height:calc(100svh - 32px);overflow:auto;padding:12px 12px 6px;border-radius:18px;font:400 12px/1.3 var(--sans);color:var(--ink);background:var(--glass-strong);border:1px solid var(--glass-line);box-shadow:0 20px 50px rgba(0,0,0,.18);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6)}
.lab.is-shut .lab-row{display:none}.lab-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.lab-head b{font-weight:500}.lab-head button{color:var(--whisper)}
.lab-row{margin-bottom:8px}.lab-row p{color:var(--whisper);margin-bottom:4px}.lab-opts{display:flex;flex-wrap:wrap;gap:4px}
.lab-opts button{position:relative;height:26px;padding:0 10px;border-radius:999px;background:color-mix(in srgb,var(--ink) 6%,transparent);color:var(--ink-2)}
.lab-opts button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}.lab-opts button.is-pick::after{content:"";position:absolute;top:2px;right:2px;width:5px;height:5px;border-radius:50%;background:#2fd67b}`;
  document.head.append(css);
  const bar = document.createElement('aside');
  bar.className = 'lab'; bar.setAttribute('aria-label', 'Lab');
  bar.innerHTML = `<div class="lab-head"><b>Lab</b><button type="button" data-shut>Hide</button></div>` + ROWS.map(([k, label, opts, rec]) =>
    `<div class="lab-row"><p>${label}</p><div class="lab-opts">${opts.map(([v, name]) =>
      `<button type="button" data-k="${k}" data-v="${v}" class="${v === rec ? 'is-pick' : ''}" aria-pressed="${document.body.dataset[k] === v}">${name}</button>`).join('')}</div></div>`).join('');
  document.body.append(bar);
  if (document.body.dataset.slow === 'on') addEventListener('load', slow); // after Quit28's pictures are in
  bar.addEventListener('click', (e) => {
    if (e.target.closest('[data-shut]')) { bar.classList.toggle('is-shut'); e.target.textContent = bar.classList.contains('is-shut') ? 'Show' : 'Hide'; return; }
    const b = e.target.closest('[data-k]');
    if (!b) return;
    apply(b.dataset.k, b.dataset.v); set(b.dataset.k, b.dataset.v);
    if (b.dataset.k === 'slow') slow();
    bar.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
})();
