// Keep a visible opening frame when the film is paused, including reduced motion.
document.querySelectorAll('[data-film] video').forEach(video => {
  video.addEventListener('loadeddata', () => {
    if (video.paused && video.currentTime < 0.1) video.currentTime = 0.8;
  }, { once: true });
});
