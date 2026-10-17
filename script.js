(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =======================================================
     Falling leaves (kept sparse and soft, just a background touch)
     ======================================================= */
  const canvas = document.getElementById("leaves");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#e07b2e", "#b5481f", "#d9a521", "#c25a24"];

  // Leaf shapes, drawn in a 100x100 box centred on 0,0
  const SHAPES = [
    // Maple
    new Path2D("M0,-48 L7,-28 L19,-34 L15,-12 L33,-21 L29,-8 L46,-3 L28,9 L33,20 L11,15 L4,30 L0,22 L-4,30 L-11,15 L-33,20 L-28,9 L-46,-3 L-29,-8 L-33,-21 L-15,-12 L-19,-34 L-7,-28 Z"),
    // Oval
    new Path2D("M0,-42 C24,-26 24,18 0,40 C-24,18 -24,-26 0,-42 Z"),
  ];
  const STEM = new Path2D("M0,20 L0,50");

  let W = 0, H = 0;
  let leaves = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  function makeLeaf(y) {
    return {
      x: rand(0, W),
      y,
      vx: rand(-0.15, 0.15),
      vy: rand(0.35, 0.75),
      size: rand(12, 20),
      rot: rand(0, Math.PI * 2),
      vrot: rand(-0.012, 0.012),
      swing: rand(0.5, 1.1),
      phase: rand(0, Math.PI * 2),
      flip: rand(0, Math.PI * 2),
      vflip: rand(0.01, 0.03),
      color: pick(COLORS),
      shape: (Math.random() * SHAPES.length) | 0,
      alpha: rand(0.45, 0.7),
    };
  }

  function seed() {
    // roughly 7 leaves on a phone, up to 14 on a big screen
    const n = Math.round(Math.min(14, Math.max(7, (W * H) / 80000)));
    leaves = [];
    for (let i = 0; i < n; i++) leaves.push(makeLeaf(rand(-H * 0.3, H)));
  }

  function drawLeaf(l) {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.rot);
    // fake 3D tumble by squashing one axis
    ctx.scale((l.size / 100) * Math.cos(l.flip), l.size / 100);
    ctx.globalAlpha = l.alpha;
    ctx.fillStyle = l.color;
    ctx.fill(SHAPES[l.shape]);
    ctx.strokeStyle = l.color;
    ctx.lineWidth = 4;
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

    for (const l of leaves) {
      l.x += (l.vx + Math.sin(t * l.swing + l.phase) * 0.35) * dt;
      l.y += l.vy * dt;
      l.rot += l.vrot * dt;
      l.flip += l.vflip * dt;

      if (l.y > H + 40) Object.assign(l, makeLeaf(rand(-80, -20)));
      if (l.x < -40) l.x = W + 30;
      if (l.x > W + 40) l.x = -30;

      drawLeaf(l);
    }
    requestAnimationFrame(frame);
  }

  resize();
  seed();
  if (reduceMotion) {
    leaves.forEach(drawLeaf); // a still scattering, no motion
  } else {
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

  /* =======================================================
     Envelope
     ======================================================= */
  const envelope = document.getElementById("envelope");
  const letterCard = document.getElementById("letterCard");

  envelope.addEventListener("click", () => {
    if (envelope.classList.contains("open")) return;
    envelope.classList.add("open");

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
      blowBtn.textContent = "Blow out the candles";
      return;
    }
    cake.classList.add("out");
    wishMsg.textContent = "Your wish is on its way, Roka ✨";
    wishMsg.classList.remove("show");
    void wishMsg.offsetWidth; // restart animation
    wishMsg.classList.add("show");
    blowBtn.textContent = "Light them again";
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
