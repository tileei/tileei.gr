/* ΤΙ ΛΕΕΙ; ΠΕΤΑΜΕ! — Ζωντανή υδρόγειος σε canvas.
 * Ορθογραφική προβολή με σταθερό φωτισμό: ανά pixel υπολογίζονται μία φορά πλάτος, μήκος, σκίαση και
 * ατμόσφαιρα· σε κάθε καρέ αλλάζει μόνο η μετατόπιση μήκους (περιστροφή) και η ανάγνωση της υφής.
 * Υφή: Solar System Scope (CC BY 4.0), βασισμένη σε δεδομένα NASA. */
(function () {
  'use strict';
  const ATH = [23.7275, 37.9838];
  const LAT0 = 24 * Math.PI / 180;

  function start(canvas, pinEl, opts) {
    opts = opts || {};
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.decoding = 'async';
    img.src = opts.texture || 'assets/earth-2048.jpg';
    let tex, TW, TH, N, out, geo, lon0 = (opts.lon0 != null ? opts.lon0 : 22) * Math.PI / 180, raf = 0, last = 0, visible = true;
    const period = (opts.seconds || 40) * 1000; // μία περιστροφή

    function setup() {
      const css = canvas.getBoundingClientRect().width || 300;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      N = Math.max(120, Math.round(css * dpr));
      canvas.width = N; canvas.height = N;
      out = ctx.createImageData(N, N);
      const L = [-0.55, 0.45, 0.70], ln = Math.hypot(L[0], L[1], L[2]);
      L[0] /= ln; L[1] /= ln; L[2] /= ln;
      const n = N * N;
      geo = { idx: new Int32Array(n), row: new Int32Array(n), du: new Float32Array(n), shade: new Float32Array(n),
        fr: new Float32Array(n), glow: new Float32Array(n), spec: new Float32Array(n), a: new Uint8Array(n), count: 0 };
      let k = 0;
      for (let j = 0; j < N; j++) {
        const y = 1 - (2 * (j + 0.5)) / N;
        for (let i = 0; i < N; i++) {
          const x = (2 * (i + 0.5)) / N - 1;
          const rho = Math.hypot(x, y);
          if (rho > 1 + 1 / N) continue;
          const r = Math.min(rho, 1), c = Math.asin(r), sc = Math.sin(c), cc = Math.cos(c);
          const lat = r < 1e-9 ? LAT0 : Math.asin(cc * Math.sin(LAT0) + (y * sc * Math.cos(LAT0)) / r);
          const dl = Math.atan2(x * sc, r * cc * Math.cos(LAT0) - y * sc * Math.sin(LAT0));
          const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
          const ndl = x * L[0] + y * L[1] + z * L[2];
          const diff = Math.max(0, ndl);
          const rz = 2 * ndl * z - L[2];
          geo.idx[k] = (j * N + i) * 4;
          geo.row[k] = Math.min(TH - 1, Math.max(0, Math.floor((0.5 - lat / Math.PI) * (TH - 1)))) * TW;
          geo.du[k] = (dl / (2 * Math.PI)) * TW;
          geo.shade[k] = 0.10 + 1.05 * Math.pow(diff, 0.85);
          geo.fr[k] = Math.pow(1 - z, 2.6);
          geo.glow[k] = Math.min(1, 0.35 + diff);
          geo.spec[k] = Math.pow(Math.max(0, rz), 40) * 0.55;
          geo.a[k] = Math.round(255 * Math.min(1, Math.max(0, (1 - rho) * N / 2 + 0.5)));
          k++;
        }
      }
      geo.count = k;
    }

    function frame(t) {
      const d = out.data, g = geo;
      d.fill(0);
      const off = ((lon0 / (2 * Math.PI)) + 0.5) * TW;
      for (let k = 0; k < g.count; k++) {
        let u = (g.du[k] + off) % TW; if (u < 0) u += TW;
        const ti = (g.row[k] + (u | 0)) * 4;
        const s = g.shade[k], f = g.fr[k], gl = g.glow[k], sp = g.spec[k];
        const r = tex[ti], gg = tex[ti + 1], b = tex[ti + 2];
        // κατοπτρισμός μόνο όπου η υφή είναι «θάλασσα» (μπλε > κόκκινο)
        const sea = b > r + 18 ? 1 : 0;
        const o = g.idx[k];
        d[o] = Math.min(255, (r * s + sp * sea * 255) * (1 - f * 0.55) + f * gl * 115);
        d[o + 1] = Math.min(255, (gg * s + sp * sea * 235) * (1 - f * 0.55) + f * gl * 191);
        d[o + 2] = Math.min(255, (b * s + sp * sea * 200) * (1 - f * 0.55) + f * gl * 255);
        d[o + 3] = g.a[k];
      }
      ctx.putImageData(out, 0, 0);
      placePin();
    }

    function placePin() {
      if (!pinEl) return;
      const ph = ATH[1] * Math.PI / 180, la = ATH[0] * Math.PI / 180 - lon0;
      const cosc = Math.sin(LAT0) * Math.sin(ph) + Math.cos(LAT0) * Math.cos(ph) * Math.cos(la);
      const x = Math.cos(ph) * Math.sin(la), y = Math.cos(LAT0) * Math.sin(ph) - Math.sin(LAT0) * Math.cos(ph) * Math.cos(la);
      pinEl.style.left = (50 + x * 50) + '%';
      pinEl.style.top = (50 - y * 50) + '%';
      pinEl.style.opacity = String(Math.max(0, Math.min(1, (cosc - 0.08) * 6)));
    }

    function loop(t) {
      raf = requestAnimationFrame(loop);
      if (!visible || t - last < 33) return;
      const dt = last ? t - last : 0; last = t;
      lon0 -= (2 * Math.PI) * (dt / period);
      frame(t);
    }

    img.onload = function () {
      const c = document.createElement('canvas');
      TW = img.naturalWidth; TH = img.naturalHeight;
      c.width = TW; c.height = TH;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0);
      try { tex = cx.getImageData(0, 0, TW, TH).data; } catch (e) { canvas.classList.add('globe-fallback'); return; }
      setup(); frame(0);
      canvas.classList.add('ready');
      if (reduce) return;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(canvas);
      document.addEventListener('visibilitychange', () => { if (document.hidden) visible = false; else visible = true; });
      raf = requestAnimationFrame(loop);
    };
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (tex) { setup(); frame(0); } }, 200); });
  }

  window.TLP_GLOBE = { start };
})();
