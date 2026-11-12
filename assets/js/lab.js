/* The homepage lab bar. Only on preview hosts, or with ?lab on the live site.
   Each row sets a data attribute on <body>; home.css does the rest. The dot marks my pick. */
(() => {
  const live = /(^|\.)sheawilson\.uk$|\.vercel\.app$/.test(location.hostname);
  if (live && !new URLSearchParams(location.search).has('lab')) return;
  const ROWS = [
    ['hero', 'Hero', [['object', 'Last shipped', 1], ['words', 'Words only']]],
    ['order', 'First card', [['snapshot', 'Snapshot', 1], ['quit', 'Quit28']]],
    ['q28', 'Quit28 card', [['now', 'As now'], ['screens', 'Three screens', 1], ['film', 'Film']]],
    ['copy', 'Card words', [['full', 'Full'], ['lean', 'Lean', 1]]],
    ['brain', 'Brain Dump', [['show', 'Show', 1], ['hide', 'Hide']]],
    ['concepts', 'Concepts', [['cards', 'Cards', 1], ['line', 'One line']]],
  ];
  const get = (k) => { try { return JSON.parse(localStorage.getItem('home-lab') || '{}')[k]; } catch (e) { return null; } };
  const set = (k, v) => { try { const o = JSON.parse(localStorage.getItem('home-lab') || '{}'); o[k] = v; localStorage.setItem('home-lab', JSON.stringify(o)); } catch (e) {} };
  const apply = (k, v) => { document.body.dataset[k] = v; };
  ROWS.forEach(([k, , opts]) => apply(k, get(k) || opts.find((o) => o[2])?.[0] || opts[0][0]));

  const css = document.createElement('style');
  css.textContent = `.lab{position:fixed;z-index:90;left:16px;bottom:16px;width:268px;padding:12px 12px 6px;border-radius:18px;font:400 12px/1.3 var(--sans);color:var(--ink);background:var(--glass-strong);border:1px solid var(--glass-line);box-shadow:0 20px 50px rgba(0,0,0,.18);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6)}
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
