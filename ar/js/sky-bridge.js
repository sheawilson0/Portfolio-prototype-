// The site's sky (assets/js/sky.js) for the 3D pages: the colours for now (or ?t=, or the time bar), whether it's
// dark, and a call whenever either changes. It also paints the page's fixed sky gradient, as the homepage does.
import { SKY } from './projects.js';

const root = document.documentElement;
export const isDark = () => root.dataset.theme === 'dark';

// { top, mid, low, glow, ga, dark } for this minute, or midday/night if sky.js hasn't painted yet
export function sky() {
  const L = window.__sky?.street?.();
  if (L) return { ...L, ink: isDark() ? SKY.night.ink : SKY.day.ink, dark: isDark() };
  return isDark() ? { ...SKY.night, ga: 0 } : { ...SKY.day, ga: 0 };
}

const listeners = new Set();
let lastKey = '';
function changed() {
  const s = sky();
  const key = `${s.top}${s.mid}${s.low}${s.dark}`;
  if (key === lastKey) return;
  lastKey = key;
  for (const k of ['top', 'mid', 'low']) root.style.setProperty(`--sky-${k}`, s[k]);
  root.style.setProperty('--sky-sun', s.glow);
  root.style.setProperty('--sky-sun-a', String((s.ga ?? 0).toFixed(2)));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.top);
  listeners.forEach((fn) => fn(s));
}
document.addEventListener('sky:paint', changed);
new MutationObserver(changed).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-mode'] });
setInterval(changed, 30000);
changed();

// fn(sky) now and on every change
export function onSky(fn) { listeners.add(fn); fn(sky()); return () => listeners.delete(fn); }
