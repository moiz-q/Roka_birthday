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
     Moments carousel (loops round in both directions)
     ======================================================= */
  (function setupCarousel() {
    const memories = Array.isArray(window.MEMORIES) ? window.MEMORIES : [];
    const section = document.getElementById("moments");
    const carouselEl = document.getElementById("carousel");
    const track = document.getElementById("track");
    const dotsEl = document.getElementById("dots");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const N = memories.length;

    if (N === 0) { section.hidden = true; return; }

    // Build the cards and dots
    const cards = memories.map((m, i) => {
      const fig = document.createElement("figure");
      fig.className = "card";
      fig.setAttribute("role", "group");
      fig.setAttribute("aria-roledescription", "slide");
      fig.setAttribute("aria-label", `${i + 1} of ${N}`);

      const frame = document.createElement("div");
      frame.className = "photo";
      const img = document.createElement("img");
      img.alt = m.caption || "";
      img.draggable = false;
      img.decoding = "async";
      if (i > 2 && i < N - 2) img.loading = "lazy";
      img.addEventListener("error", () => fig.classList.add("no-photo"));
      if (m.photo) img.src = m.photo; else fig.classList.add("no-photo");
      frame.appendChild(img);

      const cap = document.createElement("figcaption");
      cap.textContent = m.caption || "";

      fig.append(frame, cap);
      track.appendChild(fig);
      return fig;
    });

    const dots = memories.map((_, i) => {
      const b = document.createElement("button");
      b.className = "dot";
      b.type = "button";
      b.setAttribute("aria-label", `Go to moment ${i + 1}`);
      b.addEventListener("click", () => { goTo(i); pauseAuto(); });
      dotsEl.appendChild(b);
      return b;
    });

    if (N === 1) { prevBtn.hidden = true; nextBtn.hidden = true; dotsEl.hidden = true; }

    // pos = which card is in the middle (can be fractional while moving).
    // target = where we're heading. Both can grow past N; we wrap with modulo.
    let pos = 0, target = 0;
    const mod = (n, m) => ((n % m) + m) % m;
    const activeIndex = () => mod(Math.round(pos), N);

    function spacing() {
      const w = cards[0].offsetWidth || 260;
      return w * (window.innerWidth < 600 ? 0.62 : 0.72);
    }

    function layout() {
      const sp = spacing();
      const active = activeIndex();
      cards.forEach((card, k) => {
        let d = mod(k - pos, N);
        if (d > N / 2) d -= N;                  // shortest way round the ring
        const ad = Math.abs(d);
        const c = Math.max(-1, Math.min(1, d)); // clamp for the curve
        const x = d * sp;
        const z = -Math.min(ad, 3) * 140;
        const rotY = -c * 28;
        const opacity = ad <= 1.2 ? 1 : Math.max(0, 1 - (ad - 1.2) * 0.9);
        card.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotY}deg)`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(100 - Math.round(ad * 10));
        card.style.pointerEvents = opacity < 0.2 ? "none" : "";
        card.style.visibility = opacity < 0.01 ? "hidden" : "";
        card.style.filter = ad > 0.5 ? `brightness(${Math.max(0.55, 1 - ad * 0.25).toFixed(2)})` : "";
        card.classList.toggle("active", k === active);
        card.setAttribute("aria-hidden", k === active ? "false" : "true");
      });
      dots.forEach((d, i) => d.classList.toggle("active", i === active));
    }

    // Smooth movement toward the target
    let animating = false;
    function animate() {
      const diff = target - pos;
      if (reduceMotion || Math.abs(diff) < 0.001) {
        pos = target;
        layout();
        animating = false;
        return;
      }
      pos += diff * 0.14;
      layout();
      requestAnimationFrame(animate);
    }
    function kick() {
      if (!animating) { animating = true; requestAnimationFrame(animate); }
    }

    function step(n) { target = Math.round(target) + n; kick(); }
    function goTo(i) {
      let d = mod(i - Math.round(target), N);
      if (d > N / 2) d -= N;
      target = Math.round(target) + d;
      kick();
    }

    prevBtn.addEventListener("click", () => { step(-1); pauseAuto(); });
    nextBtn.addEventListener("click", () => { step(1); pauseAuto(); });
    carouselEl.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { step(-1); pauseAuto(); e.preventDefault(); }
      if (e.key === "ArrowRight") { step(1); pauseAuto(); e.preventDefault(); }
      if (e.key === "Enter" && e.target === carouselEl) openLightbox(activeIndex());
    });

    // Swipe / drag
    let dragging = false, moved = false, startX = 0, startY = 0, startPos = 0, lastX = 0, lastT = 0, vel = 0;
    track.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false;
      startX = lastX = e.clientX; startY = e.clientY;
      startPos = pos; lastT = performance.now(); vel = 0;
      target = pos;
      pauseAuto();
    });
    window.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved) {
        if (Math.abs(dx) < 6) return;
        // mostly vertical movement: let the page scroll instead
        if (Math.abs(e.clientY - startY) > Math.abs(dx)) { dragging = false; return; }
        moved = true;
        track.classList.add("dragging");
        try { track.setPointerCapture(e.pointerId); } catch (_) {}
      }
      const now = performance.now();
      vel = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
      pos = target = startPos - dx / spacing();
      layout();
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("dragging");
      if (!moved) {
        // a tap: open the middle photo, or bring a side photo to the middle
        const card = e.target.closest && e.target.closest(".card");
        if (card) {
          const i = cards.indexOf(card);
          if (i === activeIndex()) openLightbox(i); else goTo(i);
        }
        return;
      }
      // a short swipe or quick flick moves one photo; a long drag can move several
      const delta = pos - startPos;
      const dir = Math.sign(delta);
      let n = 0;
      if (Math.abs(delta) > 0.15 || Math.abs(vel) > 0.35) n = dir * Math.max(1, Math.round(Math.abs(delta)));
      target = Math.round(startPos) + n;
      kick();
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    // Gentle auto-advance while the carousel is on screen
    let inView = false, pausedUntil = 0;
    function pauseAuto() { pausedUntil = performance.now() + 9000; }
    if (!reduceMotion && N > 1) {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((es) => { inView = es[0].isIntersecting; }, { threshold: 0.4 }).observe(carouselEl);
      } else {
        inView = true;
      }
      setInterval(() => {
        if (inView && !dragging && !lightboxOpen() && !document.hidden && performance.now() > pausedUntil) step(1);
      }, 4500);
      carouselEl.addEventListener("mouseenter", () => { pausedUntil = Infinity; });
      carouselEl.addEventListener("mouseleave", () => { pausedUntil = performance.now() + 2000; });
    }

    // Full-size view
    const lightbox = document.getElementById("lightbox");
    const lbImg = document.getElementById("lbImg");
    const lbCaption = document.getElementById("lbCaption");
    const lbClose = document.getElementById("lbClose");
    let lastFocus = null;
    function lightboxOpen() { return !lightbox.hidden; }
    function openLightbox(i) {
      const m = memories[i];
      if (!m || cards[i].classList.contains("no-photo")) return;
      lbImg.src = m.full || m.photo;
      lbImg.alt = m.caption || "";
      lbCaption.textContent = m.caption || "";
      lastFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      lbClose.focus();
    }
    function closeLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox || e.target.tagName === "FIGURE") closeLightbox(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lightboxOpen()) closeLightbox(); });

    // older browsers: never let the carousel box itself scroll sideways
    carouselEl.addEventListener("scroll", () => { carouselEl.scrollLeft = 0; });

    window.addEventListener("resize", layout);
    layout();
  })();

  /* =======================================================
     Reveal sections on scroll
     ======================================================= */
  const toReveal = document.querySelectorAll(".section h2, .section .hint, .envelope-wrap, .moments .lead, .carousel, .cake-stage, footer");
  if ("IntersectionObserver" in window && !reduceMotion) {
    toReveal.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    toReveal.forEach((el) => io.observe(el));
  }
})();
