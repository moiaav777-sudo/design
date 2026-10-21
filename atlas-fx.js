/* Design Atlas — визуальные эффекты, общие для всех страниц портала.
   Принципы: всё тяжёлое работает только на экране (IntersectionObserver) и на видимой вкладке;
   при prefers-reduced-motion автодвижение выключено, остаётся статичный кадр. */
(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const small = () => innerWidth < 700;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  document.documentElement.classList.add("js");

  /* ---------- Появление по скроллу и счётчики ---------- */
  const countFmt = new Intl.NumberFormat("ru-RU");
  function animateCount(el) {
    const to = Number(el.dataset.count);
    if (!isFinite(to)) return;
    if (reduced) { el.textContent = countFmt.format(to); return; }
    const t0 = performance.now(), dur = 1600;
    const step = now => {
      const k = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 4);
      el.textContent = countFmt.format(Math.round(to * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const revealIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("is-in");
      if (e.target.dataset.count) animateCount(e.target);
      $$("[data-count]", e.target).forEach(animateCount);
      revealIO.unobserve(e.target);
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  function observe(root = document) {
    $$("[data-reveal], .agent-code, [data-count]", root).forEach(el => {
      if (el.dataset.fxSeen) return;
      el.dataset.fxSeen = "1";
      revealIO.observe(el);
    });
  }
  /* Обновить число на странице уже после загрузки данных */
  function setCount(el, n) {
    if (!el) return;
    el.dataset.count = n;
    if (el.classList.contains("is-in") || !("IntersectionObserver" in window)) animateCount(el);
    else el.textContent = countFmt.format(n);
  }
  observe();
  /* страховка: если наблюдатель не сработал (фоновая вкладка, старый браузер), через 3 с показываем то, что уже на экране */
  setTimeout(() => {
    $$("[data-reveal]:not(.is-in)").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add("is-in");
    });
  }, 3000);

  /* ---------- Полоса прокрутки и свечение за курсором ---------- */
  const bar = document.createElement("div");
  bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true");
  document.body.prepend(bar);
  let scrollTick = false;
  addEventListener("scroll", () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")";
      scrollTick = false;
    });
  }, { passive: true });

  let glow = null;
  if (finePointer && !reduced) {
    glow = document.createElement("div");
    glow.className = "cursor-glow"; glow.setAttribute("aria-hidden", "true");
    document.body.prepend(glow);
  }

  /* ---------- Наклон и подсветка карточек, магнитные кнопки (делегирование) ---------- */
  let pending = null, tilted = null;
  const MAGNET = ".top-cta, .btn-primary, .search-row button, #copyPrompt";
  function onMove(e) {
    if (e.pointerType && e.pointerType !== "mouse") return;
    pending = e;
    if (pending._queued) return;
    requestAnimationFrame(() => {
      const ev = pending; pending = null;
      if (!ev) return;
      if (glow) { glow.style.transform = "translate3d(" + ev.clientX + "px," + ev.clientY + "px,0)"; glow.classList.add("on"); }
      const t = ev.target.closest && ev.target.closest(".mc, .paths a");
      if (tilted && tilted !== t) resetTilt(tilted);
      if (t) {
        const r = t.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
        t.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        t.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        if (t.classList.contains("mc") && !reduced) {
          t.classList.add("is-tilting");
          t.style.setProperty("--rx", ((0.5 - py) * 9).toFixed(2) + "deg");
          t.style.setProperty("--ry", ((px - 0.5) * 11).toFixed(2) + "deg");
        }
        tilted = t;
      }
      const m = ev.target.closest && ev.target.closest(MAGNET);
      if (m && !reduced) {
        const r = m.getBoundingClientRect();
        m.style.transform = "translate(" + ((ev.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px," + ((ev.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px)";
        m._magnet = true;
      }
    });
    pending._queued = true;
  }
  function resetTilt(t) {
    t.classList.remove("is-tilting");
    t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg");
    if (t === tilted) tilted = null;
  }
  if (finePointer) {
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", e => {
      const m = e.target.closest && e.target.closest(MAGNET);
      if (m && m._magnet && !m.contains(e.relatedTarget)) { m.style.transform = ""; m._magnet = false; }
      const t = e.target.closest && e.target.closest(".mc");
      if (t && !t.contains(e.relatedTarget)) resetTilt(t);
    });
    document.documentElement.addEventListener("pointerleave", () => glow && glow.classList.remove("on"));
  }

  /* ---------- Печатающийся заголовок ---------- */
  function typed(el, words) {
    if (!el || reduced) return;
    let w = 0, i = words[0].length, dir = -1, wait = 0;
    el.textContent = words[0];
    const tick = () => {
      if (document.hidden) return setTimeout(tick, 600);
      if (wait > 0) { wait--; return setTimeout(tick, 80); }
      i += dir;
      el.textContent = words[w].slice(0, i);
      if (dir > 0 && i >= words[w].length) { dir = -1; wait = 24; }
      else if (dir < 0 && i <= 0) { dir = 1; w = (w + 1) % words.length; wait = 4; }
      setTimeout(tick, dir > 0 ? 70 : 38);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- Hero: неоновая 3D-сфера из сети на canvas 2D ---------- */
  function heroScene(canvas) {
    const ctx = canvas.getContext("2d");
    const COLORS = [[45, 226, 255], [139, 92, 255], [255, 62, 165]];
    /* заранее рисуем «светящиеся точки» — это быстрее, чем shadowBlur в каждом кадре */
    const sprites = COLORS.map(c => {
      const s = document.createElement("canvas"); s.width = s.height = 64;
      const g = s.getContext("2d"), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)"); grad.addColorStop(.18, "rgba(" + c + ",1)");
      grad.addColorStop(.5, "rgba(" + c + ",.22)"); grad.addColorStop(1, "rgba(" + c + ",0)");
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64); return s;
    });
    let N, pts, edges, packets, W = 0, H = 0, dpr = 1, quality = 1;
    function build() {
      N = small() ? 90 : 190;
      pts = []; const ga = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), th = i * ga;
        pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, c: i % 9 === 0 ? 2 : i % 4 === 0 ? 1 : 0, s: 0.7 + (i * 7 % 10) / 10 });
      }
      /* рёбра: к каждой точке три ближайших соседа */
      const seen = new Set(); edges = [];
      for (let i = 0; i < N; i++) {
        const d = [];
        for (let j = 0; j < N; j++) if (j !== i) d.push([j, -(pts[i].x * pts[j].x + pts[i].y * pts[j].y + pts[i].z * pts[j].z)]);
        d.sort((a, b) => a[1] - b[1]);
        for (let k = 0; k < 3; k++) {
          const j = d[k][0], key = i < j ? i + "-" + j : j + "-" + i;
          if (!seen.has(key)) { seen.add(key); edges.push([i, j]); }
        }
      }
      packets = Array.from({ length: small() ? 8 : 18 }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random(), v: .006 + Math.random() * .012, c: (Math.random() * 3) | 0 }));
    }
    function size() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, quality > 0.9 ? 1.75 : 1);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    }
    /* состояние вращения */
    let rotY = 0.6, rotX = 0.35, vel = 0.0035, tx = 0, ty = 0, drag = null, pulse = 0;
    const ptr = e => { const r = canvas.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2; };
    if (!reduced) {
      addEventListener("pointermove", e => { if (e.pointerType === "mouse") ptr(e); }, { passive: true });
      canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY }; pulse = 1; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener("pointermove", e => { if (!drag) return; vel = (e.clientX - drag.x) * 0.0011; rotX += (e.clientY - drag.y) * 0.002; drag = { x: e.clientX, y: e.clientY }; });
      const up = () => { drag = null; };
      canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    }
    function frame(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * (small() ? .36 : .38);
      const sy = reduced ? 0 : scrollY;
      if (!drag) vel += (0.0032 - vel) * 0.03; /* вернуться к спокойному вращению */
      rotY += vel;
      const aY = rotY + sy * 0.0016 + tx * 0.35, aX = rotX + ty * 0.22 + Math.sin(t / 3000) * 0.06;
      const cYc = Math.cos(aY), sYc = Math.sin(aY), cXc = Math.cos(aX), sXc = Math.sin(aX);
      const P = new Array(N);
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const x1 = p.x * cYc + p.z * sYc, z1 = -p.x * sYc + p.z * cYc;
        const y2 = p.y * cXc - z1 * sXc, z2 = p.y * sXc + z1 * cXc;
        const f = 2.6 / (2.6 - z2 * 0.9);
        P[i] = { x: cx + x1 * R * f, y: cy + y2 * R * f, z: z2, f };
      }
      ctx.globalCompositeOperation = "lighter";
      /* ядро */
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.15);
      core.addColorStop(0, "rgba(120,80,255,.22)"); core.addColorStop(.6, "rgba(45,226,255,.05)"); core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, R * 1.15, 0, 7); ctx.fill();
      /* кольца-орбиты */
      ctx.lineWidth = 1;
      for (let k = 0; k < 2; k++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(k ? -0.5 : 0.35 + Math.sin(t / 4000) * .05);
        ctx.strokeStyle = k ? "rgba(255,62,165,.35)" : "rgba(45,226,255,.35)";
        ctx.beginPath(); ctx.ellipse(0, 0, R * (k ? 1.42 : 1.3), R * (k ? .36 : .46), 0, 0, 7); ctx.stroke();
        const a = t / (k ? 1700 : 2300) + k * 2, ox = Math.cos(a) * R * (k ? 1.42 : 1.3), oy = Math.sin(a) * R * (k ? .36 : .46);
        ctx.drawImage(sprites[k ? 2 : 0], ox - 12, oy - 12, 24, 24);
        ctx.restore();
      }
      /* рёбра тремя пачками по глубине — меньше смен стиля */
      for (let b = 0; b < 3; b++) {
        ctx.beginPath();
        for (const [i, j] of edges) {
          const z = (P[i].z + P[j].z) / 2, bi = z < -.33 ? 0 : z < .33 ? 1 : 2;
          if (bi !== b) continue;
          ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[j].x, P[j].y);
        }
        ctx.strokeStyle = ["rgba(120,110,255,.10)", "rgba(110,150,255,.24)", "rgba(110,225,255,.5)"][b];
        ctx.lineWidth = 0.6 + b * 0.45; ctx.stroke();
      }
      /* пакеты данных бегут по рёбрам */
      for (const pk of packets) {
        if (!reduced) pk.t += pk.v;
        if (pk.t > 1) { pk.t = 0; pk.e = (Math.random() * edges.length) | 0; pk.c = (Math.random() * 3) | 0; }
        const [i, j] = edges[pk.e], x = P[i].x + (P[j].x - P[i].x) * pk.t, y = P[i].y + (P[j].y - P[i].y) * pk.t;
        const z = P[i].z + (P[j].z - P[i].z) * pk.t, s = 16 + z * 6;
        ctx.globalAlpha = z > -.3 ? 1 : .35;
        ctx.drawImage(sprites[pk.c], x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      /* узлы: дальние тусклее и мельче */
      for (let i = 0; i < N; i++) {
        const q = P[i], p = pts[i], dep = (q.z + 1) / 2, s = (7 + p.s * 9) * q.f * (0.55 + dep * .6);
        ctx.globalAlpha = 0.25 + dep * .75;
        const tw = reduced ? 1 : 0.85 + 0.15 * Math.sin(t / 400 + i);
        ctx.drawImage(sprites[p.c], q.x - s * tw / 2, q.y - s * tw / 2, s * tw, s * tw);
      }
      ctx.globalAlpha = 1;
      /* волна от клика */
      if (pulse > 0.02) {
        ctx.strokeStyle = "rgba(45,226,255," + (pulse * .7).toFixed(2) + ")"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, R * (1.9 - pulse), 0, 7); ctx.stroke(); pulse *= 0.94;
      }
      ctx.globalCompositeOperation = "source-over";
    }
    /* управление циклом: рисуем, только пока канвас на экране и вкладка активна */
    let running = false, visible = false, last = 0, slow = 0, rafId = 0;
    function loop(t) {
      if (!running) return;
      const dt = t - last; last = t;
      /* если кадры стабильно дольше ~26 мс — снижаем разрешение */
      if (dt > 26) slow++; else slow = Math.max(0, slow - 1);
      if (slow > 50 && quality === 1) { quality = 0.5; size(); slow = 0; }
      frame(t); rafId = requestAnimationFrame(loop);
    }
    function sync() {
      const want = visible && !document.hidden && !reduced;
      if (want && !running) { running = true; last = performance.now(); rafId = requestAnimationFrame(loop); }
      else if (!want && running) { running = false; cancelAnimationFrame(rafId); }
    }
    build(); size();
    new ResizeObserver(() => { size(); if (!running) frame(performance.now()); }).observe(canvas);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; sync(); }).observe(canvas);
    document.addEventListener("visibilitychange", sync);
    addEventListener("resize", () => { const n = small() ? 90 : 190; if (n !== N) { build(); if (!running) frame(performance.now()); } });
    frame(performance.now());
  }

  /* ---------- Hero: живые мини-графики (иллюстративные данные) ---------- */
  function heroWidgets(root) {
    const bars = $$(".bars i", root), spark = $("#spark", root), area = $("#sparkArea", root);
    const gNum = $("#wGrowth", root), lNum = $("#wLine", root), legend = $("#donutLegend", root), arcs = $$("#donut circle", root);
    const series = Array.from({ length: 18 }, (_, i) => 40 + i * 2 + Math.sin(i) * 8);
    const SHARES = [[42, 28, 18], [36, 31, 22], [45, 24, 20], [40, 30, 19]];
    let si = 0, shown = { g: 0, l: 0 };
    const tween = (el, key, to, fmt) => {
      const from = shown[key], t0 = performance.now();
      const step = now => { const k = Math.max(0, Math.min(1, (now - t0) / 900)), v = from + (to - from) * (1 - Math.pow(1 - k, 3)); el.textContent = fmt(v); if (k < 1) requestAnimationFrame(step); else shown[key] = to; };
      requestAnimationFrame(reduced ? () => { el.textContent = fmt(to); shown[key] = to; } : step);
    };
    function paintSpark() {
      const w = 180, h = 46, min = Math.min(...series), max = Math.max(...series);
      const xy = series.map((v, i) => [i / (series.length - 1) * w, h - 4 - (v - min) / (max - min || 1) * (h - 10)]);
      let d = "M" + xy[0][0] + " " + xy[0][1];
      for (let i = 1; i < xy.length; i++) { const mx = (xy[i - 1][0] + xy[i][0]) / 2; d += " Q" + xy[i - 1][0].toFixed(1) + " " + xy[i - 1][1].toFixed(1) + " " + mx.toFixed(1) + " " + ((xy[i - 1][1] + xy[i][1]) / 2).toFixed(1); }
      d += " T" + w + " " + xy[xy.length - 1][1].toFixed(1);
      spark.setAttribute("d", d); area.setAttribute("d", d + " L" + w + " " + h + " L0 " + h + "Z");
    }
    function paintDonut() {
      const s = SHARES[si % SHARES.length], C = 2 * Math.PI * 26; let off = 0;
      arcs.forEach((c, i) => { const len = (s[i] ?? 100 - s[0] - s[1] - s[2]) / 100 * C; c.style.strokeDasharray = (len - 2).toFixed(1) + " " + (C - len + 2).toFixed(1); c.style.strokeDashoffset = (-off).toFixed(1); off += len; });
      const rest = 100 - s[0] - s[1] - s[2];
      legend.innerHTML = "";
      [["A", s[0]], ["B", s[1]], ["C", s[2]], ["…", rest]].slice(0, 3).forEach(([n, v]) => { const d = document.createElement("div"); d.textContent = "Продукт " + n + "  " + v + "%"; legend.append(d); });
    }
    function step() {
      bars.forEach(b => b.style.setProperty("--h", (22 + Math.random() * 78).toFixed(0) + "%"));
      series.shift(); series.push(Math.max(20, Math.min(95, series[series.length - 1] + (Math.random() - .42) * 18)));
      paintSpark(); si++; paintDonut();
      const last = parseFloat(bars[bars.length - 1].style.getPropertyValue("--h")) || 60;
      tween(gNum, "g", Math.round(last * .6), v => "+" + Math.round(v) + "%");
      tween(lNum, "l", Math.round(series[series.length - 1] * 1.1), v => "+" + Math.round(v) + "%");
    }
    step();
    if (reduced) return;
    let visible = false, timer = 0;
    const host = root.closest(".hero-visual") || root;
    /* вне экрана ставим на паузу и CSS-анимации карточек */
    const sync = () => { const want = visible && !document.hidden; host.classList.toggle("is-paused", !want); if (want && !timer) timer = setInterval(step, 2200); else if (!want && timer) { clearInterval(timer); timer = 0; } };
    new IntersectionObserver(es => { visible = es[0].isIntersecting; sync(); }).observe(root.closest(".hero-visual") || root);
    document.addEventListener("visibilitychange", sync);
  }

  /* Состояние «ничего не найдено»: радар с бегущим лучом, подсказка и кнопка сброса */
  function emptyState(text, onReset) {
    const box = document.createElement("div");
    box.className = "empty";
    box.innerHTML = '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="60" cy="60" r="52" opacity=".35"/><circle cx="60" cy="60" r="34" opacity=".5"/><circle cx="60" cy="60" r="16" opacity=".7"/><path d="M8 60h104M60 8v104" opacity=".2"/><g class="sweep"><path d="M60 60L60 8A52 52 0 0 1 104 34Z" fill="currentColor" stroke="none" opacity=".22"/><path d="M60 60V8" stroke-width="2"/></g><circle cx="86" cy="78" r="3" fill="#ff3ea5" stroke="none"/></svg>';
    const b = document.createElement("b"); b.textContent = "Ничего не нашлось";
    const p = document.createElement("p"); p.textContent = text;
    box.append(b, p);
    if (onReset) {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "btn-primary"; btn.textContent = "Сбросить фильтры";
      btn.addEventListener("click", onReset); box.append(btn);
    }
    return box;
  }

  window.AtlasFX = { observe, setCount, heroScene, heroWidgets, typed, emptyState, reduced };
})();
