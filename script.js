/* ============================================================
   narayan agarwal — portfolio scripts (vanilla JS, no libraries)

   three small, independent features:
     1. light/dark theme toggle (remembers your choice)
     2. gentle fade-in of sections as they scroll into view
     3. the signature effect: soft drifting particles on a 2D
        <canvas> that react to the cursor / touch

   accessibility rules baked in:
     - everything is skipped when the user prefers reduced motion
     - the particle loop pauses when the browser tab is hidden
     - particle count is capped low on phones so it stays smooth
   ============================================================ */

"use strict";

/* mark that JS is running — CSS only hides [data-reveal] elements
   when this class is present, so the page still works without JS */
document.documentElement.classList.add("js");

/* respect the OS "reduce motion" setting everywhere */
var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ------------------------------------------------------------
   1. theme toggle
   ------------------------------------------------------------ */
(function () {
  var button = document.getElementById("theme-toggle");
  var root = document.documentElement;

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function paint() {
    // the label shows what you will switch TO, like a light switch
    button.textContent = "theme: " + (currentTheme() === "dark" ? "light" : "dark");
  }

  button.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);   // local only — no tracking
    } catch (e) { /* storage blocked (private mode): theme still works for this visit */ }
    paint();
    /* the particle field listens for this so its colours follow the theme */
    document.dispatchEvent(new CustomEvent("themechange"));
  });

  paint();
})();

/* ------------------------------------------------------------
   2. fade-in on scroll
   ------------------------------------------------------------ */
(function () {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);   // reveal once, stay visible
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
  );

  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    observer.observe(el);
  });
})();

/* ------------------------------------------------------------
   3. particle field (the one signature effect)
   ------------------------------------------------------------ */
(function () {
  var canvas = document.getElementById("particles");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var particles = [];
  var rafId = null;
  var running = false;
  var lastTime = 0;
  var slowFrames = 0;   // consecutive over-budget frames (watchdog below)

  /* the pointer position (-1 when it has never moved / left the page) */
  var pointer = { x: -1, y: -1 };

  /* particle count scales with screen area but is clamped so phones
     stay cheap: a 390x844 phone gets 28, a 1080p desktop gets ~90,
     a 4k monitor stops at 110 */
  function targetCount() {
    var area = window.innerWidth * window.innerHeight;
    return Math.max(28, Math.min(110, Math.round(area / 24000)));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  /* particle colours per theme — rgb triples. off-white dots on the dark
     theme, warm-dark dots on the light theme, accent in both. */
  var PALETTE = {
    dark:  { plain: "232, 230, 225", accent: "255, 107, 58" },
    light: { plain: "70, 66, 58",    accent: "178, 58, 16" }
  };
  var themeName = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  document.addEventListener("themechange", function () {
    themeName = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  function makeParticle() {
    var isAccent = Math.random() < 0.14;   // a few particles use the accent colour
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      /* slow base drift (bvx/bvy) + live velocity (vx/vy) that is
         nudged by the pointer and eases back to the drift */
      bvx: randomBetween(-0.18, 0.18),
      bvy: randomBetween(-0.18, 0.18),
      vx: 0,
      vy: 0,
      r: randomBetween(0.8, 2.2),
      kind: isAccent ? "accent" : "plain",
      alpha: isAccent ? 0.55 : randomBetween(0.14, 0.4)
    };
  }

  function resize() {
    /* cap devicePixelRatio at 2 — beyond that we pay 4x the pixels
       for detail nobody can see on a glow-free particle field */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // draw in CSS pixels

    particles = [];
    var count = targetCount();
    for (var i = 0; i < count; i++) particles.push(makeParticle());
  }

  function step(now) {
    if (!running) return;

    /* watchdog: if the device can't hold a smooth frame rate for a
       sustained stretch, switch the effect off for good instead of
       janking the page. one slow frame is ignored (tab switches etc.);
       ~2.5 seconds of consecutive slow frames pulls the plug. */
    if (now - lastTime > 40) {
      slowFrames++;
      if (slowFrames > 90) {
        stop();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
    } else {
      slowFrames = Math.max(0, slowFrames - 4);
    }

    /* normalise speed to ~60fps so 120Hz screens don't get 2x speed;
       clamp dt so a background tab's big time-jump doesn't teleport */
    var dt = Math.min((now - lastTime) / 16.67, 2.5) || 1;
    lastTime = now;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    var w = window.innerWidth;
    var h = window.innerHeight;
    var REACH = 130;         // px around the cursor where particles react
    var PUSH = 0.55;         // max extra speed the cursor can add

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      /* ease live velocity back toward the base drift */
      p.vx += (p.bvx - p.vx) * 0.02 * dt;
      p.vy += (p.bvy - p.vy) * 0.02 * dt;

      /* gentle push away from the cursor, fading with distance */
      if (pointer.x >= 0) {
        var dx = p.x - pointer.x;
        var dy = p.y - pointer.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REACH && dist > 0.01) {
          var force = (1 - dist / REACH) * PUSH * dt;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      /* wrap around the edges instead of bouncing */
      if (p.x < -4) p.x = w + 4; else if (p.x > w + 4) p.x = -4;
      if (p.y < -4) p.y = h + 4; else if (p.y > h + 4) p.y = -4;

      ctx.fillStyle = "rgba(" + PALETTE[themeName][p.kind] + ", " + p.alpha + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }

    rafId = requestAnimationFrame(step);
  }

  function start() {
    if (running || reducedMotion.matches) return;
    running = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  /* ---- wiring ---- */

  /* track mouse AND touch via pointer events; pointerleave clears it */
  window.addEventListener("pointermove", function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  }, { passive: true });

  window.addEventListener("pointerleave", function () {
    pointer.x = -1;
    pointer.y = -1;
  });

  /* debounced resize: rebuild for the new size/count */
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  /* pause while the tab is hidden — the loop costs nothing then */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  /* if the user flips the OS reduce-motion switch live, obey it */
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", function () {
      if (reducedMotion.matches) stop();
      else start();
    });
  }

  resize();
  start();
})();
