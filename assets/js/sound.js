/* The site's small sounds, made live in the browser (Web Audio, no files), after Peng's: tiny bursts of filtered
   noise and soft tones with fast fades. Every one is pitched a few percent off the last so no two match, and the
   ones that go with movement follow how fast you're moving. Same family as the light switch (sky.js) and the
   Shipped street's dial (shipped.js). It is quiet, and silent until the visitor has pressed or typed something:
   browsers ask for that, and nobody wants a page that makes noise for hovering. */
(() => {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  let ctx = null, out = null, hiss = null;
  const wake = () => {
    try {
      if (!ctx) {
        ctx = new AC();
        out = ctx.createGain(); out.gain.value = .5; out.connect(ctx.destination); // the one volume for all of it
        // One second of soft noise, shared by everything that needs air in it.
        hiss = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = hiss.getChannelData(0);
        for (let i = 0, v = 0; i < d.length; i++) { v += (Math.random() * 2 - 1 - v) * .5; d[i] = v; }
      }
      if (ctx.state !== 'running') ctx.resume();
    } catch (e) {}
  };
  // Which event counts as a press differs by browser and by mouse or finger, so listen to them all.
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach((t) => addEventListener(t, wake, { capture: true, passive: true }));
  // Made on the first move, so it's already running if the browser counts the click that brought you here.
  addEventListener('pointermove', wake, { once: true, passive: true });
  const live = () => ctx && ctx.state === 'running';
  const off = () => 1 + (.02 + Math.random() * .02) * (Math.random() < .5 ? -1 : 1); // 2 to 4 percent either way

  // A breath of filtered noise: freq is where it sits, len how long, gain how loud.
  function puff(freq, len, gain, at = 0, q = 1.4) {
    const t = ctx.currentTime + at, src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = hiss; bp.type = 'bandpass'; bp.frequency.value = freq * off(); bp.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    src.connect(bp).connect(g).connect(out); src.start(t, Math.random() * .9, len + .02);
  }
  // A soft tone that drops a little as it fades.
  function tone(freq, len, gain, at = 0) {
    const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain(), f = freq * off();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .94, t + len);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(g).connect(out); o.start(t); o.stop(t + len + .02);
  }

  /* ── Cards: a soft tap as the pointer arrives, each card on its own note, and a faint brush of air while the
     pointer moves over it that follows the pointer's speed and stops when it does. ── */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const NOTES = [392, 440, 494, 587, 659, 740, 880]; // an open, unhurried scale
    let air = null, airG = null, airF = null, px = 0, py = 0, pt = 0, speed = 0, still = 0;
    const brush = (e) => {
      if (!live()) return;
      const now = performance.now(), dt = Math.max(8, now - pt);
      speed += (Math.hypot(e.clientX - px, e.clientY - py) / dt - speed) * .3; // pixels a millisecond, smoothed
      px = e.clientX; py = e.clientY; pt = now;
      if (!air) {
        air = ctx.createBufferSource(); air.buffer = hiss; air.loop = true;
        airF = ctx.createBiquadFilter(); airF.type = 'bandpass'; airF.Q.value = .9;
        airG = ctx.createGain(); airG.gain.value = 0;
        air.connect(airF).connect(airG).connect(out); air.start();
      }
      const k = Math.min(1, speed / 2.2);
      airG.gain.setTargetAtTime(.05 * k, ctx.currentTime, .05);
      airF.frequency.setTargetAtTime(700 + 1900 * k, ctx.currentTime, .06);
      clearTimeout(still); still = setTimeout(hush, 70);
    };
    const hush = () => { speed = 0; if (airG) airG.gain.setTargetAtTime(0, ctx.currentTime, .06); };
    document.querySelectorAll('.work .item, .mosaic .tile').forEach((el, i) => {
      el.addEventListener('pointerenter', (e) => {
        px = e.clientX; py = e.clientY; pt = performance.now();
        if (!live()) return;
        tone(NOTES[i % NOTES.length], .16, .05); puff(2600, .03, .05);
      });
      el.addEventListener('pointermove', brush, { passive: true });
      el.addEventListener('pointerleave', hush);
    });
  }

  /* ── The time bar: it ticks as the day goes by, a click every twenty minutes of sky, higher the higher the sun
     is. Dragging slowly gives every click; fast, and they thin out and go lighter, like the Shipped street's dial.
     Played or stepped to a moment, it's quieter still. The moments have a note each, and the bar breathes in as
     it opens and out as it closes. ── */
  let open = false, bucket = null, lastTick = 0, held = false;
  addEventListener('pointerdown', (e) => { held = !!e.target.closest?.('.sky-bar input'); }, true);
  addEventListener('pointerup', () => { held = false; }, true);
  const height = (n) => { const s = window.__sky.sun(n.ymd), noon = (s.rise + s.set) / 2; return Math.cos(2 * Math.PI * (n.min - noon) / 1440); }; // 1 at noon, -1 at midnight
  document.addEventListener('sky:paint', () => {
    const now = window.__sky?.barOpen?.(), n = window.__sky?.now?.();
    if (!n) return;
    if (now !== open) {
      open = now; bucket = Math.floor(n.min / 20);
      if (live()) { puff(open ? 900 : 1500, .22, .07, 0, .8); tone(open ? 523 : 392, .2, .035, open ? .05 : 0); }
      return;
    }
    const b = Math.floor(n.min / 20);
    if (!open || b === bucket) return;
    bucket = b;
    if (!live()) return;
    const t = performance.now(), gap = t - lastTick;
    if (gap < 45) return;
    lastTick = t;
    const level = (held ? 1 : .45) * Math.min(1, Math.max(.3, gap / 140));
    tone(520 * 2 ** (height(n) * .5), .07, .06 * level); puff(2200, .02, .05 * level);
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('.sky-bar button');
    if (!b || !live()) return;
    if (b.dataset.s) { const s = +b.dataset.s, up = [392, 494, 587, 784, 659, 523, 440, 330][s] || 440; tone(up, .22, .05); tone(up * 1.5, .3, .022, .05); puff(1800, .03, .04); }
    else if (!b.classList.contains('sb-close')) { tone(660, .09, .04); puff(2400, .02, .04); }
  });
})();
