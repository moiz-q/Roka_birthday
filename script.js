(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =======================================================
     Falling leaves
     ======================================================= */
  const canvas = document.getElementById("leaves");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#e07b2e", "#b5481f", "#d9a521", "#f0a53c", "#7c2a1e", "#c25a24", "#9a6b1f"];

  // Leaf shapes, drawn in a 100x100 box centred on 0,0
  const SHAPES = [
    // Maple
    new Path2D("M0,-48 L7,-28 L19,-34 L15,-12 L33,-21 L29,-8 L46,-3 L28,9 L33,20 L11,15 L4,30 L0,22 L-4,30 L-11,15 L-33,20 L-28,9 L-46,-3 L-29,-8 L-33,-21 L-15,-12 L-19,-34 L-7,-28 Z"),
    // Oval / birch
    new Path2D("M0,-42 C24,-26 24,18 0,40 C-24,18 -24,-26 0,-42 Z"),
    // Oak-ish
    new Path2D("M0,-44 C10,-40 4,-30 14,-28 C24,-26 12,-16 22,-12 C32,-8 18,2 24,8 C30,16 12,18 10,26 C8,34 2,36 0,40 C-2,36 -8,34 -10,26 C-12,18 -30,16 -24,8 C-18,2 -32,-8 -22,-12 C-12,-16 -24,-26 -14,-28 C-4,-30 -10,-40 0,-44 Z"),
  ];
  const STEM = new Path2D("M0,20 L0,50");
  const VEIN = new Path2D("M0,-38 L0,34");

  let W = 0, H = 0, DPR = 1;
  let leaves = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function makeLeaf(opts = {}) {
    const size = opts.size ?? rand(14, 30);
    return {
      x: opts.x ?? rand(-20, W + 20),
      y: opts.y ?? rand(-H, -20),
      vx: opts.vx ?? rand(-0.3, 0.3),
      vy: opts.vy ?? rand(0.5, 1.3),
      size,
      rot: rand(0, Math.PI * 2),
      vrot: rand(-0.03, 0.03),
      swing: rand(0.6, 1.6),
      phase: rand(0, Math.PI * 2),
      flip: rand(0, Math.PI * 2),
      vflip: rand(0.02, 0.06),
      color: pick(COLORS),
      shape: (Math.random() * SHAPES.length) | 0,
      alpha: rand(0.65, 0.95),
      burst: !!opts.burst,
      life: opts.burst ? 1 : Infinity,
    };
  }

  function baseCount() {
    // fewer leaves on small screens so phones stay smooth
    return Math.round(Math.min(46, Math.max(16, (W * H) / 26000)));
  }

  function seed() {
    leaves = [];
    const n = baseCount();
    for (let i = 0; i < n; i++) leaves.push(makeLeaf({ y: rand(-H, H) }));
  }

  function drawLeaf(l) {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot);
    // fake 3D tumble by squashing one axis
    ctx.scale((l.size / 100) * Math.cos(l.flip), l.size / 100);
    ctx.globalAlpha = l.alpha * Math.min(1, l.life);
    ctx.fillStyle = l.color;
    ctx.fill(SHAPES[l.shape]);
    ctx.strokeStyle = "rgba(60, 25, 10, 0.45)";
    ctx.lineWidth = 3;
    ctx.stroke(VEIN);
    ctx.stroke(STEM);
    ctx.restore();
  }

  let t = 0;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(3, (now - last) / 16.67); // normalise to ~60fps
    last = now;
    t += 0.016 * dt;
    ctx.clearRect(0, 0, W, H);

    for (let i = leaves.length - 1; i >= 0; i--) {
      const l = leaves[i];
      if (l.burst) {
        l.vy += 0.06 * dt;            // gravity
        l.vx *= Math.pow(0.985, dt);  // air drag
        if (l.vy > 2.2) l.vy = 2.2;
        l.life -= 0.004 * dt;
      }
      l.x += (l.vx + Math.sin(t * l.swing + l.phase) * 0.6) * dt;
      l.y += l.vy * dt;
      l.rot += l.vrot * dt;
      l.flip += l.vflip * dt;

      if (l.y > H + 40 || l.life <= 0) {
        if (l.burst) { leaves.splice(i, 1); continue; }
        Object.assign(l, makeLeaf({ y: rand(-80, -20) }));
      }
      if (l.x < -60) l.x = W + 40;
      if (l.x > W + 60) l.x = -40;

      drawLeaf(l);
    }
    requestAnimationFrame(frame);
  }

  function burst(x, y, n = 18, power = 6) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(power * 0.4, power);
      leaves.push(makeLeaf({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - power * 0.5,
        size: rand(12, 26),
        burst: true,
      }));
    }
  }

  resize();
  if (reduceMotion) {
    // a calm, still scattering of leaves
    seed();
    leaves.forEach(drawLeaf);
  } else {
    seed();
    requestAnimationFrame(frame);
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const oldW = W;
      resize();
      // only reseed on real width changes (mobile URL bar show/hide changes height only)
      if (Math.abs(W - oldW) > 40) seed();
      if (reduceMotion) { ctx.clearRect(0, 0, W, H); leaves.forEach(drawLeaf); }
    }, 150);
  });

  // Tap / click anywhere for a little leaf burst
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a")) return;
    burst(e.clientX, e.clientY, 10, 5);
  });

  /* =======================================================
     Envelope
     ======================================================= */
  const envelope = document.getElementById("envelope");
  const letterCard = document.getElementById("letterCard");

  envelope.addEventListener("click", () => {
    if (envelope.classList.contains("open")) return;
    envelope.classList.add("open");
    const r = envelope.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 3, 22, 7);

    setTimeout(() => {
      envelope.hidden = true;
      envelope.style.display = "none";
      letterCard.hidden = false;
      letterCard.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }, reduceMotion ? 0 : 1100);
  });

  /* =======================================================
     Cake
     ======================================================= */
  const cake = document.getElementById("cake");
  const blowBtn = document.getElementById("blowBtn");
  const wishMsg = document.getElementById("wishMsg");

  blowBtn.addEventListener("click", () => {
    if (cake.classList.contains("out")) {
      // relight
      cake.classList.remove("out");
      wishMsg.textContent = "";
      wishMsg.classList.remove("show");
      blowBtn.textContent = "Blow out the candles 🌬️";
      return;
    }
    cake.classList.add("out");
    const r = cake.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + 20, 40, 9);
    setTimeout(() => burst(r.left + r.width * 0.15, r.top + 40, 16, 7), 250);
    setTimeout(() => burst(r.left + r.width * 0.85, r.top + 40, 16, 7), 450);

    wishMsg.textContent = "Your wish is on its way, Roka 🍂✨";
    wishMsg.classList.remove("show");
    void wishMsg.offsetWidth; // restart animation
    wishMsg.classList.add("show");
    blowBtn.textContent = "Light them again 🕯️";
  });

  /* =======================================================
     Reveal sections on scroll
     ======================================================= */
  const toReveal = document.querySelectorAll(".section h2, .section .hint, .envelope-wrap, .cake-stage, .wish, footer");
  if ("IntersectionObserver" in window && !reduceMotion) {
    let wishIndex = 0;
    toReveal.forEach((el) => {
      el.classList.add("reveal");
      if (el.classList.contains("wish")) el.style.transitionDelay = `${(wishIndex++ % 2) * 90}ms`;
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add("in");
          io.unobserve(el);
          // drop the stagger delay so hover effects stay snappy
          setTimeout(() => { el.style.transitionDelay = ""; }, 1200);
        }
      });
    }, { threshold: 0.15 });
    toReveal.forEach((el) => io.observe(el));
  }
})();
