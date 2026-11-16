// Keep the real scene's still until the visitor interacts. No Spline code or scene is fetched before then.
(() => {
  const viewer = document.querySelector('spline-viewer[data-url]');
  if (!viewer) return;
  let loading = false, visible = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // The pinned viewer (1.9.82) exposes its runtime here. Keep the scene in memory
  // while stopping its render loop; unloading would restart the interaction on return.
  const sync = () => {
    const app = viewer._spline;
    if (!app || !viewer._loaded) return;
    if (visible && !document.hidden && !reduced.matches) app.play?.();
    else app.stop?.();
  };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(viewer);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  const load = async () => {
    if (loading) return;
    loading = true;
    try {
      await import('https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js');
      viewer.addEventListener('load-complete', () => {
        viewer.previousElementSibling.remove();
        viewer.style.opacity = '1';
        const renderer = viewer._spline?._renderer, canvas = viewer._spline?.canvas;
        if (renderer && canvas && devicePixelRatio > 2) {
          renderer.setPixelRatio(2);
          renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        }
        sync();
      }, { once: true });
      viewer.setAttribute('url', viewer.dataset.url);
      removeEventListener('pointerdown', load);
      removeEventListener('keydown', load);
    } catch (e) { loading = false; }
  };
  addEventListener('pointerdown', load, { passive: true });
  addEventListener('keydown', load);
})();
