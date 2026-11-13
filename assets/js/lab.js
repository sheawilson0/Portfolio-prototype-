/* The lab bar, on the homepage. Only on preview hosts, or with ?lab on the live site.
   Each row sets a data attribute on <body>; home.css does the rest. The dot marks my pick. */
(() => {
  const live = /(^|\.)sheawilson\.uk$|\.vercel\.app$/.test(location.hostname);
  if (live && !new URLSearchParams(location.search).has('lab')) return;
  const ROWS = [
    ['work', 'Work', [['cards', 'Cards', 1], ['mosaic', 'Mosaic']]],
    ['copy', 'Card words (cards)', [['cap', 'Just a caption', 1], ['lean', 'Lean, card sizes'], ['full', 'Full']]],
    ['gap', 'Space between', [['roomy', 'More', 1], ['tight', 'As before']]],
    ['phones', 'Two phones (mosaic)', [['snap', 'Flip Snapshot', 1], ['quit', 'Flip Quit28'], ['side', 'Side by side']]],
    ['skylook', 'Page sky', [['street', 'Shipped street', 1], ['site', 'Site']]],
    ['ship', 'Shipped colour', [['yellow', 'Yellow', 1], ['red', 'Red']]],
    ['arc', 'Horizon', [['arc', 'Arc', 1], ['none', 'None'], ['wide', 'Wide horizon'], ['rim', 'Rim of light'], ['band', 'Soft band'], ['sun', 'Sun and eclipse']]],
    ['ring', 'Ring colour', [['rainbow', 'Rainbow', 1], ['sky', 'Sunrise and pearl']]],
    ['words', 'Words', [['airy', 'Airy', 1], ['navy', 'Sky ink'], ['firm', 'Firmer']]],
    ['nav', 'Nav shape', [['pill', 'Pill', 1], ['tile', 'Shipped tile']]],
    ['navw', 'Nav words', [['all', 'All three', 1], ['two', 'No About'], ['name', 'Just my name']]],
    ['tt', 'Theme button', [['show', 'Show', 1], ['hide', 'Hide (press D)']]],
    ['q28', 'Quit28 card', [['hand-cal', 'Hand, calendar', 1], ['hand', 'Hand, calendar, circle'], ['hand-circle', 'Hand, circle'], ['live', 'iPhone']]],
  ];
  const KEY = 'home-lab-6'; // home-lab-6: picks changed 12 Nov, start everyone on them
  const get = (k) => { try { return JSON.parse(localStorage.getItem(KEY) || '{}')[k]; } catch (e) { return null; } };
  const set = (k, v) => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); o[k] = v; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const apply = (k, v) => { document.body.dataset[k] = v; };
  // A saved choice that's no longer an option falls back to my pick.
  ROWS.forEach(([k, , opts]) => { const v = get(k); apply(k, opts.some((o) => o[0] === v) ? v : (opts.find((o) => o[2]) || opts[0])[0]); });

  const css = document.createElement('style');
  css.textContent = `.lab{position:fixed;z-index:90;left:16px;bottom:16px;width:268px;max-height:calc(100svh - 32px);overflow:auto;padding:12px 12px 6px;border-radius:18px;font:400 12px/1.3 var(--sans);color:var(--ink);background:var(--glass-strong);border:1px solid var(--glass-line);box-shadow:0 20px 50px rgba(0,0,0,.18);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6)}
.lab.is-shut .lab-row{display:none}.lab-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.lab-head b{font-weight:500}.lab-head button{color:var(--whisper)}
.lab-row{margin-bottom:8px}.lab-row p{color:var(--whisper);margin-bottom:4px}.lab-opts{display:flex;flex-wrap:wrap;gap:4px}
.lab-opts button{position:relative;height:26px;padding:0 10px;border-radius:999px;background:color-mix(in srgb,var(--ink) 6%,transparent);color:var(--ink-2)}
.lab-opts button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}.lab-opts button.is-pick::after{content:"";position:absolute;top:2px;right:2px;width:5px;height:5px;border-radius:50%;background:#2fd67b}`;
  document.head.append(css);
  const bar = document.createElement('aside');
  bar.className = 'lab'; bar.setAttribute('aria-label', 'Lab');
  bar.innerHTML = `<div class="lab-head"><b>Lab</b><button type="button" data-shut>Hide</button></div>` + ROWS.map(([k, label, opts]) =>
    `<div class="lab-row"><p>${label}</p><div class="lab-opts">${opts.map(([v, name, pick]) =>
      `<button type="button" data-k="${k}" data-v="${v}" class="${pick ? 'is-pick' : ''}" aria-pressed="${document.body.dataset[k] === v}">${name}</button>`).join('')}</div></div>`).join('');
  document.body.append(bar);
  bar.addEventListener('click', (e) => {
    if (e.target.closest('[data-shut]')) { bar.classList.toggle('is-shut'); e.target.textContent = bar.classList.contains('is-shut') ? 'Show' : 'Hide'; return; }
    const b = e.target.closest('[data-k]');
    if (!b) return;
    apply(b.dataset.k, b.dataset.v); set(b.dataset.k, b.dataset.v);
    bar.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  });
})();
