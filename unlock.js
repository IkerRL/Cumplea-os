/* ============================================================
   unlock.js — Lógica de la pantalla de desbloqueo
   Combinación: dígitos 1-0-4 + agente Astra
   ============================================================ */

(function () {
  'use strict';

  // ── Combinación secreta ────────────────────────────────
  const SECRET_DIGITS = ['1', '0', '4'];
  const SECRET_AGENT  = 'Astra';

  // ── Agentes de Valorant ────────────────────────────────
  const AGENTS = [
    { name: 'Astra',     icon: '🌌' },
    { name: 'Brimstone', icon: '🔥' },
    { name: 'Breach',    icon: '⚡' },
    { name: 'Chamber',   icon: '🎩' },
    { name: 'Clove',     icon: '☘️' },
    { name: 'Cypher',    icon: '🕵️' },
    { name: 'Deadlock',  icon: '🔒' },
    { name: 'Fade',      icon: '👁️' },
    { name: 'Gekko',     icon: '🦎' },
    { name: 'Harbor',    icon: '🌊' },
    { name: 'Iso',       icon: '🟣' },
    { name: 'Jett',      icon: '💨' },
    { name: 'Killjoy',   icon: '🤖' },
    { name: 'Neon',      icon: '⚡' },
    { name: 'Omen',      icon: '🌑' },
    { name: 'Phoenix',   icon: '🔥' },
    { name: 'Raze',      icon: '💥' },
    { name: 'Reyna',     icon: '💜' },
    { name: 'Sage',      icon: '🌿' },
    { name: 'Skye',      icon: '🐺' },
    { name: 'Sova',      icon: '🏹' },
    { name: 'Viper',     icon: '🐍' },
    { name: 'Vyse',      icon: '🕸️' },
    { name: 'Yoru',      icon: '🌀' },
  ];

  // ── DOM refs ────────────────────────────────────────────
  const unlockScreen = document.getElementById('unlockScreen');
  const comboScreen  = document.getElementById('comboScreen');
  const cakeBtn      = document.getElementById('cakeBtn');
  const d1           = document.getElementById('d1');
  const d2           = document.getElementById('d2');
  const d3           = document.getElementById('d3');
  const agentGrid    = document.getElementById('agentGrid');
  const btnUnlock    = document.getElementById('btnUnlock');
  const comboError   = document.getElementById('comboError');
  const comboCard    = document.querySelector('.combo-card');

  let selectedAgent  = null;

  // ── Stars background ────────────────────────────────────
  function createStars(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = Math.random() * 3 + 1;
      s.style.cssText = `
        width: ${size}px; height: ${size}px;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation-duration: ${Math.random() * 3 + 2}s;
        animation-delay: ${Math.random() * -5}s;
      `;
      container.appendChild(s);
    }
  }

  createStars('stars', 80);
  createStars('stars2', 80);

  // ── Cake click → mostrar pantalla combo ─────────────────
  function showCombo() {
    unlockScreen.style.opacity = '0';
    unlockScreen.style.transition = 'opacity 0.4s ease';
    setTimeout(() => {
      unlockScreen.style.display = 'none';
      comboScreen.hidden = false;
      d1.focus();
    }, 400);
  }

  cakeBtn.addEventListener('click', showCombo);
  cakeBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCombo(); }
  });

  // ── Digit inputs: auto-avance ────────────────────────────
  [d1, d2, d3].forEach((input, idx, arr) => {
    input.addEventListener('input', () => {
      // Limitar a 1 carácter
      if (input.value.length > 1) {
        input.value = input.value.slice(-1);
      }
      if (input.value !== '') {
        input.classList.add('filled');
        if (arr[idx + 1]) arr[idx + 1].focus();
      } else {
        input.classList.remove('filled');
      }
      comboError.hidden = true;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && arr[idx - 1]) {
        arr[idx - 1].focus();
      }
    });
  });

  // ── Agent grid ───────────────────────────────────────────
  // Mezclar para que Astra no siempre esté en el mismo sitio
  const shuffledAgents = AGENTS.slice().sort(() => Math.random() - 0.5);

  shuffledAgents.forEach(agent => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'agent-btn';
    btn.dataset.name = agent.name;
    btn.innerHTML = `
      <span class="agent-icon">${agent.icon}</span>
      <span>${agent.name}</span>
    `;
    btn.addEventListener('click', () => {
      agentGrid.querySelectorAll('.agent-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAgent = agent.name;
      comboError.hidden = true;
    });
    agentGrid.appendChild(btn);
  });

  // ── Unlock button ────────────────────────────────────────
  btnUnlock.addEventListener('click', () => {
    const digits = [d1.value, d2.value, d3.value];
    const digitsOk = digits.join('') === SECRET_DIGITS.join('');
    const agentOk  = selectedAgent === SECRET_AGENT;

    if (digitsOk && agentOk) {
      // ¡Correcto! Animación de éxito y redirigir al muro
      comboCard.classList.add('success');
      btnUnlock.textContent = '¡Correcto! Abriendo el tablón... 🎉';
      btnUnlock.disabled = true;

      setTimeout(() => {
        window.location.href = 'muro.html?key=cumple';
      }, 1000);

    } else {
      // Error: shake + mensaje
      comboError.hidden = false;
      comboCard.classList.remove('shake');
      void comboCard.offsetWidth; // reflow para reiniciar animación
      comboCard.classList.add('shake');

      // Limpiar campos incorrectos
      if (!digitsOk) {
        [d1, d2, d3].forEach(i => { i.value = ''; i.classList.remove('filled'); });
        d1.focus();
      }
      if (!agentOk) {
        agentGrid.querySelectorAll('.agent-btn').forEach(b => b.classList.remove('selected'));
        selectedAgent = null;
      }
    }
  });

})();
