/* Nikita Agarwal site: hero background, signal demo, scroll reveal. No dependencies. */
(function () {
  document.body.classList.add('js');
  const css = getComputedStyle(document.documentElement);
  const accent = () => css.getPropertyValue('--accent').trim() || '#0b6b70';
  const accent2 = () => css.getPropertyValue('--accent2').trim() || '#c8622b';
  const muted = () => css.getPropertyValue('--muted').trim() || '#888';

  /* deterministic noise: sum of smoothed random walks (red noise) per channel */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function redNoise(n, seed, smooth) {
    const r = mulberry32(seed); const out = new Float32Array(n); let v = 0, a = 0;
    for (let i = 0; i < n; i++) { a += (r() - 0.5) * 0.15; a *= 0.97; v += a; v *= smooth; out[i] = v; }
    let m = 0, s = 0; for (let i = 0; i < n; i++) m += out[i]; m /= n;
    for (let i = 0; i < n; i++) s += (out[i] - m) ** 2; s = Math.sqrt(s / n) || 1;
    for (let i = 0; i < n; i++) out[i] = (out[i] - m) / s;
    return out;
  }

  /* ---------- hero background: star field with pulsar-like ticks and a faint passing wave ---------- */
  const hero = document.getElementById('heroCanvas');
  if (hero) {
    const ctx = hero.getContext('2d');
    const r = mulberry32(7); const stars = [];
    for (let k = 0; k < 260; k++) stars.push({ x: r(), y: r(), z: 0.3 + r() * 0.7, ph: r() * 6.28, tw: 0.4 + r() * 1.6, pulsar: r() < 0.06 });
    let t0 = performance.now(), mx = 0, my = 0;
    function size() { const b = hero.parentElement.getBoundingClientRect(); hero.width = b.width * devicePixelRatio; hero.height = b.height * devicePixelRatio; }
    size(); addEventListener('resize', size);
    hero.parentElement.addEventListener('pointermove', e => { const b = hero.getBoundingClientRect(); mx = (e.clientX - b.left) / b.width - 0.5; my = (e.clientY - b.top) / b.height - 0.5; });
    function draw(now) {
      const W = hero.width, H = hero.height, t = (now - t0) / 1000, dpr = devicePixelRatio;
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const x = ((s.x + 0.5 - mx * 0.03 * s.z) % 1) * W, y = ((s.y + 0.5 - my * 0.03 * s.z) % 1) * H;
        let a = 0.35 + 0.45 * Math.sin(t * s.tw + s.ph) * 0.5 + 0.2;
        if (s.pulsar) { const ph = (t * 1.3 + s.ph) % 1; a = ph < 0.08 ? 1 : 0.15; }
        ctx.globalAlpha = Math.max(0.08, Math.min(1, a)) * s.z;
        ctx.fillStyle = s.pulsar ? '#9fe9ec' : '#ffffff';
        const rad = (s.pulsar ? 1.6 : 0.6 + s.z * 0.9) * dpr;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill();
        if (s.pulsar && a > 0.9) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x, y, rad * 3.2, 0, 6.283); ctx.fill(); }
      }
      /* a faint periodic wave crossing the sky: the signal */
      ctx.globalAlpha = 0.22; ctx.strokeStyle = '#5fd0d3'; ctx.lineWidth = 1.2 * dpr; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = i / 200 * W, y = H * 0.62 + Math.sin(i / 200 * 6.283 * 2.5 - t * 0.7) * H * 0.045 + Math.sin(i / 200 * 6.283 * 0.5 + t * 0.2) * H * 0.02; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(draw); else draw(t0);
  }

  /* ---------- industry page: expandable rows ---------- */
  document.querySelectorAll('.row').forEach(row => row.addEventListener('click', () => row.classList.toggle('open')));

  /* ---------- interactive demo ---------- */
  const dc = document.getElementById('demoCanvas');
  if (dc) {
    const ctx = dc.getContext('2d');
    const L = 600, NP = 68; const noise = [];
    for (let k = 0; k < NP; k++) noise.push(redNoise(L, 500 + k, 0.99));
    const ampEl = document.getElementById('amp'), modeBtns = [...document.querySelectorAll('.seg button')];
    const statEl = document.getElementById('snr'), verdictEl = document.getElementById('verdict');
    let mode = 'one';
    function size() { const r = dc.getBoundingClientRect(); dc.width = r.width * devicePixelRatio; dc.height = r.height * devicePixelRatio; render(); }
    function signal(i) { return Math.sin(2 * Math.PI * i / L * 4); }
    function render() {
      const W = dc.width, H = dc.height, amp = +ampEl.value / 100; /* signal amplitude relative to per-channel noise sigma */
      ctx.clearRect(0, 0, W, H);
      const series = new Float32Array(L);
      const n = mode === 'one' ? 1 : NP;
      for (let i = 0; i < L; i++) { let s = 0; for (let k = 0; k < n; k++) s += noise[k][i] + amp * signal(i); series[i] = s / n; }
      let m = 0; for (let i = 0; i < L; i++) m += series[i]; m /= L;
      let sd = 0; for (let i = 0; i < L; i++) sd += (series[i] - m) ** 2; sd = Math.sqrt(sd / L) || 1;
      /* matched-filter-ish statistic: correlation with the template, in sigma units */
      let c = 0; for (let i = 0; i < L; i++) c += (series[i] - m) * signal(i); c /= L;
      const snr = c / (sd / Math.sqrt(L / 2));
      const scale = H * 0.18 / Math.max(1, sd);
      ctx.lineWidth = 1.5 * devicePixelRatio;
      /* template */
      ctx.strokeStyle = accent2(); ctx.globalAlpha = 0.9; ctx.setLineDash([6 * devicePixelRatio, 6 * devicePixelRatio]);
      ctx.beginPath(); for (let i = 0; i < L; i++) { const x = i / (L - 1) * W, y = H / 2 - amp * signal(i) * scale; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.setLineDash([]);
      /* data */
      ctx.strokeStyle = accent(); ctx.globalAlpha = 1;
      ctx.beginPath(); for (let i = 0; i < L; i++) { const x = i / (L - 1) * W, y = H / 2 - (series[i] - m) * scale; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.fillStyle = muted(); ctx.font = `${12 * devicePixelRatio}px ${css.getPropertyValue('--sans')}`;
      ctx.fillText(mode === 'one' ? 'one channel' : `${NP} channels, coherently combined`, 10 * devicePixelRatio, 18 * devicePixelRatio);
      ctx.fillText('dashed: the signal we are looking for', 10 * devicePixelRatio, H - 10 * devicePixelRatio);
      statEl.textContent = snr.toFixed(1) + 'σ';
      verdictEl.textContent = snr > 5 ? 'clear detection' : snr > 3 ? 'suggestive, needs vetting' : 'consistent with noise';
      verdictEl.style.color = snr > 5 ? accent() : snr > 3 ? accent2() : muted();
    }
    ampEl.addEventListener('input', render);
    modeBtns.forEach(b => b.addEventListener('click', () => { modeBtns.forEach(x => x.classList.remove('on')); b.classList.add('on'); mode = b.dataset.mode; render(); }));
    addEventListener('resize', size); size();
  }

  /* ---------- scroll reveal ---------- */
  if (!('IntersectionObserver' in window)) { document.querySelectorAll('.reveal').forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- portrait: hide if missing ---------- */
  const img = document.querySelector('.portrait');
  if (img) img.addEventListener('error', () => { img.hidden = true; });
})();
