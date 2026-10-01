/* ============================================================
   confetti.js — Confetti animado con Canvas para el éxito
   ============================================================ */

(function () {
  'use strict';

  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animId = null;
  let running = false;

  const COLORS = [
    '#fef08a', '#fbcfe8', '#bbf7d0', '#bae6fd',
    '#fed7aa', '#e9d5ff', '#a855f7', '#ec4899',
    '#22d3ee', '#fbbf24'
  ];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  function createParticle(x, y) {
    return {
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * -12 - 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * 10 + 5,
      h: Math.random() * 5 + 3,
      angle: Math.random() * Math.PI * 2,
      angularV: (Math.random() - 0.5) * 0.2,
      gravity: 0.35,
      drag: 0.985,
      alpha: 1,
      alphaDecay: Math.random() * 0.01 + 0.005,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    };
  }

  function burst(x, y, count) {
    for (let i = 0; i < count; i++) {
      particles.push(createParticle(x, y));
    }
  }

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p) => {
      p.vy   += p.gravity;
      p.vx   *= p.drag;
      p.vy   *= p.drag;
      p.x    += p.vx;
      p.y    += p.vy;
      p.angle += p.angularV;
      p.alpha -= p.alphaDecay;

      if (p.alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });

    particles = particles.filter(p => p.alpha > 0 && p.y < canvas.height + 50);

    if (particles.length > 0) {
      animId = requestAnimationFrame(update);
    } else {
      running = false;
      animId = null;
    }
  }

  // Exposed globally for enviar.js
  window.launchConfetti = function () {
    if (animId) cancelAnimationFrame(animId);
    particles = [];

    const cx = canvas.width / 2;
    const cy = canvas.height * 0.4;

    // Initial burst
    burst(cx, cy, 120);

    // Side bursts
    setTimeout(() => burst(cx - 200, cy + 50, 60), 120);
    setTimeout(() => burst(cx + 200, cy + 50, 60), 200);
    setTimeout(() => burst(cx, cy - 60, 80), 350);

    running = true;
    update();
  };
})();
