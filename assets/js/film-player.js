// Film player: a silent looping video with its music and its sound effects as separate tracks, played through
// Web Audio so they can fade in and out. No player controls: the film plays while it's on screen and loops.
// Tapping the film, or the corner sound button, turns the sound on or off. Browsers only allow sound after a
// tap. The audio context and streaming tracks wait until the visitor asks for sound. No dependencies.
//
// <figure class="film" data-film data-wide="wide.mp4" data-tall="tall.mp4" data-wide-poster="…" data-tall-poster="…"
//   data-music="music.m4a" data-sfx="sfx.m4a">
//   <div class="film-frame"><video playsinline muted loop preload="metadata"></video>
//     <button class="film-sound" type="button" data-mute>…</button></div>
// </figure>
//
// root.film.setSources({ video, poster, music, sfx }) swaps any of them and keeps the position.
// root.film.setSpeed(0.5) slows picture and sound together.
(() => {
  const RESYNC = 0.12; // seconds the sound may drift from the picture before it restarts in place
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AC = window.AudioContext || window.webkitAudioContext;
  // let Web Audio play with the iPhone's silent switch on, like a video would
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}

  function mount(root) {
    const video = root.querySelector('video');
    const tall = matchMedia('(max-width: 720px), (max-aspect-ratio: 4/5)').matches;
    let speed = 1, restarts = 0;

    // Audio: one lazy context and gain per streamed track, following the picture.
    let ctx = null;
    const tracks = {};
    for (const key of ['music', 'sfx']) {
      tracks[key] = { key, on: true, level: key === 'music' ? 1 : .8, url: '', audio: null, gain: null }; // effects a touch under the music so the two never clip
    }
    let armed = false; // only a request for sound may fetch or decode audio
    const latency = () => (ctx ? (ctx.outputLatency || 0) + (ctx.baseLatency || 0) : 0);
    const stopTrack = t => { t.audio?.pause(); };
    const stop = () => Object.values(tracks).forEach(stopTrack);
    // Stream on demand instead of downloading and decoding both complete files first.
    // Each track seeks to the live picture when ready, including after a buffering pause.
    const syncTrack = t => {
      const a = t.audio;
      if (!a || !a.readyState || video.paused || !t.on) return;
      const at = video.currentTime + latency() * speed;
      if (Math.abs(a.currentTime - at) > RESYNC) a.currentTime = at;
    };
    const startTrack = t => {
      if (!t.audio || !t.on || video.paused) return;
      t.audio.playbackRate = speed;
      syncTrack(t);
      t.audio.play().catch(() => {});
    };
    const start = () => {
      if (!ctx || !tracks.music.on || video.paused || ctx.state !== 'running') return;
      Object.values(tracks).forEach(startTrack);
      restarts++;
    };
    const drift = () => {
      const a = tracks.music.audio;
      return !a || a.paused || a.readyState < 3 ? 0 : a.currentTime - latency() * speed - video.currentTime;
    };
    const load = (t, url) => {
      if (!url) return;
      t.url = new URL(url, location.href).href;
      if (!armed || !t.audio || t.audio.src === t.url) return;
      t.audio.src = t.url;
      if (!video.paused && t.on) startTrack(t);
    };

    const fade = t => { if (t.gain) t.gain.gain.setTargetAtTime(t.on ? t.level : 0, ctx.currentTime, 0.02); };

    const muteBtn = root.querySelector('[data-mute]');
    const setState = () => {
      const playing = !video.paused;
      const muted = !ctx || ctx.state !== 'running' || !tracks.music.on;
      root.classList.toggle('is-playing', playing);
      root.classList.toggle('is-muted', muted);
      if (muteBtn) { muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Mute'); }
    };

    let raf = 0, lastTime = 0;
    const loop = () => {
      if (!ctx || ctx.state !== 'running' || !tracks.music.on || video.paused) { raf = 0; return; }
      const now = video.currentTime;
      if (now + .5 < lastTime) start(); // restart even a track that ended just before the video loop
      lastTime = now;
      for (const t of Object.values(tracks)) {
        if (t.audio && !t.audio.paused && !t.audio.seeking && t.audio.readyState >= 3) syncTrack(t);
      }
      raf = video.paused ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => { if (ctx?.state === 'running' && tracks.music.on && !video.paused && !raf) raf = requestAnimationFrame(loop); };

    const arm = () => { armed = true; Object.values(tracks).forEach(t => load(t, t.url)); };
    video.addEventListener('playing', () => { start(); setState(); kick(); });
    video.addEventListener('play', () => { setState(); kick(); });
    video.addEventListener('pause', () => { stop(); setState(); });
    video.addEventListener('waiting', stop);
    video.addEventListener('seeked', () => { if (!video.paused) start(); });
    video.addEventListener('ratechange', () => { if (!video.paused) start(); });

    const play = () => video.play().catch(() => {});
    const unlock = () => {
      if (!AC) return;
      if (!ctx) {
        ctx = new AC();
        for (const t of Object.values(tracks)) {
          t.gain = ctx.createGain(); t.gain.gain.value = t.on ? t.level : 0;
          t.gain.connect(ctx.destination);
          t.audio = new Audio(); t.audio.preload = 'none';
          // Keep pitch following speed, as with the original buffer sources.
          t.audio.preservesPitch = false;
          t.source = ctx.createMediaElementSource(t.audio); t.source.connect(t.gain);
          t.audio.addEventListener('loadedmetadata', () => { if (t.on && !video.paused) startTrack(t); });
          t.audio.addEventListener('playing', () => syncTrack(t));
        }
        ctx.addEventListener('statechange', () => { setState(); kick(); });
      }
      // Start streaming in the gesture while the audio context resumes.
      arm();
      const ready = () => { if (!video.paused) start(); setState(); kick(); };
      if (ctx.state !== 'running') ctx.resume().then(ready).catch(() => {}); else ready();
    };
    const sound = (e) => {
      if (e) e.stopPropagation();
      const on = !ctx || ctx.state !== 'running' ? true : !tracks.music.on;
      Object.values(tracks).forEach(t => { t.on = on; });
      if (on) unlock();
      Object.values(tracks).forEach(fade);
      if (on && video.paused) play();
      else if (on) start();
      setState(); kick();
    };
    if (muteBtn) muteBtn.addEventListener('click', sound);
    video.addEventListener('click', sound);

    const setSources = ({ video: v, poster, music, sfx }) => {
      load(tracks.music, music); load(tracks.sfx, sfx);
      if (v && video.src !== new URL(v, location.href).href) {
        const at = video.currentTime, playing = !video.paused;
        stop();
        if (poster) video.poster = poster;
        video.src = v;
        video.addEventListener('loadedmetadata', () => { video.currentTime = Math.min(at, (video.duration || at) - 0.05); video.playbackRate = speed; if (playing) play(); }, { once: true });
      }
    };
    const setSpeed = r => { if (r === speed) return; speed = r; video.playbackRate = r; };

    root.classList.toggle('is-tall', tall);
    video.muted = true;
    setSources({ video: tall ? root.dataset.tall : root.dataset.wide, poster: tall ? root.dataset.tallPoster : root.dataset.widePoster, music: root.dataset.music, sfx: root.dataset.sfx });

    // play (silently) while on screen, rest when scrolled away
    if (!reduce && 'IntersectionObserver' in window) {
      // On case pages, let the poster draw before the film competes for the connection.
      const posterReady = document.body.classList.contains('case') && video.poster
        ? Object.assign(new Image(), { src: video.poster }).decode().catch(() => {})
            .then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        : Promise.resolve();
      let visible = false;
      new IntersectionObserver(entries => {
        for (const e of entries) {
          visible = e.isIntersecting && e.intersectionRatio >= 0.5;
          if (visible) posterReady.then(() => { if (visible && !document.hidden && video.paused) play(); });
          else if (!video.paused) video.pause();
        }
      }, { threshold: [0, 0.5] }).observe(root);
    }
    let resume = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { resume = !video.paused; video.pause(); }
      else if (resume) {
        resume = false;
        const r = root.getBoundingClientRect();
        if (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) >= r.height * .5) play();
      }
    });
    root.film = { video, tracks, setSources, setSpeed, tall, drift, get restarts() { return restarts; } };
    setState();
    root.dispatchEvent(new CustomEvent('film:ready'));
  }

  const start = () => document.querySelectorAll('[data-film]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
