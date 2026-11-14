/* The lab bar, on the homepage. Only on preview hosts, or with ?lab on the live site.
   Each row sets a data attribute on <body>; home.css does the rest. A row starts on whatever index.html sets on
   <body> (the site as it would go live). The green dot is Claude's recommendation, which may be something else. */
(() => {
  const live = /(^|\.)sheawilson\.uk$|\.vercel\.app$/.test(location.hostname);
  if (live && !new URLSearchParams(location.search).has('lab')) return;
  // [attribute, label, options, the recommended one]
  const ROWS = [
    ['work', 'Work', [['cards', 'Cards'], ['mosaic', 'Mosaic']], 'cards'],
    ['about', 'About', [['long', 'Now'], ['short', 'Shorter'], ['art', 'Painting'], ['line', 'One sentence'], ['off', 'Photo and a line']], 'line'],
    ['cur', 'Cursor', [['system', 'Normal'], ['dot', 'Dot'], ['glass', 'Glass'], ['halo', 'Sky glow']], 'system'],
    ['arc', 'Horizon', [['arc', 'Arc'], ['none', 'None'], ['sun', 'Sun and moon']], 'sun'],
    ['hover', 'Hover on cards', [['full', 'As now'], ['calm', 'Calmer']], 'calm'],
    ['intro', 'Words under the headline', [['full', 'As now'], ['short', 'Shorter']], 'short'],
    ['q28', 'Quit28 card', [['hand-circle', 'Circle'], ['hand', 'Calendar too']], 'hand'],
  ];
  const KEY = 'home-lab-8'; // home-lab-8: options changed 14 Nov, start everyone on the defaults
  const get = (k) => { try { return JSON.parse(localStorage.getItem(KEY) || '{}')[k]; } catch (e) { return null; } };
  const set = (k, v) => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); o[k] = v; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const DEF = Object.fromEntries(ROWS.map(([k]) => [k, document.body.dataset[k]])); // the site as index.html has it
  const apply = (k, v) => { document.body.dataset[k] = v; };
  // A saved choice that's no longer an option falls back to my pick.
  ROWS.forEach(([k, , opts]) => { const v = get(k); if (opts.some((o) => o[0] === v)) apply(k, v); });

  const css = document.createElement('style');
  css.textContent = `.lab{position:fixed;z-index:90;left:16px;bottom:16px;width:268px;max-height:calc(100svh - 32px);overflow:auto;padding:12px 12px 6px;border-radius:18px;font:400 12px/1.3 var(--sans);color:var(--ink);background:var(--glass-strong);border:1px solid var(--glass-line);box-shadow:0 20px 50px rgba(0,0,0,.18);-webkit-backdrop-filter:blur(18px) saturate(1.6);backdrop-filter:blur(18px) saturate(1.6)}
.lab.is-shut .lab-row{display:none}.lab-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.lab-head b{font-weight:500}.lab-ab{display:flex;gap:4px;margin-bottom:4px}.lab-ab button{flex:1;height:32px;border-radius:10px;font-weight:500}.lab-ab+p{color:var(--whisper);margin-bottom:10px}.lab-head button{color:var(--whisper)}
.lab-row{margin-bottom:8px}.lab-row p{color:var(--whisper);margin-bottom:4px}.lab-opts{display:flex;flex-wrap:wrap;gap:4px}
.lab-opts button{position:relative;height:26px;padding:0 10px;border-radius:999px;background:color-mix(in srgb,var(--ink) 6%,transparent);color:var(--ink-2)}
.lab-opts button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}.lab-opts button.is-pick::after{content:"";position:absolute;top:2px;right:2px;width:5px;height:5px;border-radius:50%;background:#2fd67b}`;
  document.head.append(css);
  const bar = document.createElement('aside');
  bar.className = 'lab'; bar.setAttribute('aria-label', 'Lab');
  bar.innerHTML = `<div class="lab-head"><b>Lab</b><button type="button" data-shut>Hide</button></div>
<div class="lab-row"><div class="lab-opts lab-ab"><button type="button" data-all="def">Yours</button><button type="button" data-all="pick">Claude’s</button></div><p>Press V to flip between them.</p></div>` + ROWS.map(([k, label, opts, rec]) =>
    `<div class="lab-row"><p>${label}</p><div class="lab-opts">${opts.map(([v, name]) =>
      `<button type="button" data-k="${k}" data-v="${v}" class="${v === rec ? 'is-pick' : ''}" aria-pressed="${document.body.dataset[k] === v}">${name}</button>`).join('')}</div></div>`).join('');
  document.body.append(bar);
  bar.addEventListener('click', (e) => {
    if (e.target.closest('[data-shut]')) { bar.classList.toggle('is-shut'); e.target.textContent = bar.classList.contains('is-shut') ? 'Show' : 'Hide'; return; }
    const all = e.target.closest('[data-all]'), b = e.target.closest('[data-k]');
    if (all) flip(all.dataset.all); else if (b) { apply(b.dataset.k, b.dataset.v); set(b.dataset.k, b.dataset.v); sync(); }
  });
  // Yours: every row as index.html has it. Claude's: every row on its green dot. V flips between the two.
  const want = (which) => ROWS.map(([k, , , rec]) => [k, which === 'pick' ? rec : DEF[k]]);
  const is = (which) => want(which).every(([k, v]) => document.body.dataset[k] === v);
  const flip = (which) => { want(which).forEach(([k, v]) => { apply(k, v); set(k, v); }); sync(); };
  const sync = () => {
    bar.querySelectorAll('[data-k]').forEach((x) => x.setAttribute('aria-pressed', String(document.body.dataset[x.dataset.k] === x.dataset.v)));
    bar.querySelectorAll('[data-all]').forEach((x) => x.setAttribute('aria-pressed', String(is(x.dataset.all))));
  };
  sync();
  addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'v' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.closest('input, textarea')) flip(is('pick') ? 'def' : 'pick'); });
})();
