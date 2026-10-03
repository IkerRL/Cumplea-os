/* ============================================================
   unlock-modal.js — Modal de acceso secreto al tablón
   Combinación: dígitos 1-0-4 + agente Astra
   ============================================================ */

(function () {
  'use strict';

  const SECRET_DIGITS = ['1', '0', '4'];
  const SECRET_AGENT  = 'Astra';

  // DOM refs
  const overlay          = document.getElementById('unlockOverlay');
  const modal            = document.getElementById('unlockModal');
  const ud1              = document.getElementById('ud1');
  const ud2              = document.getElementById('ud2');
  const ud3              = document.getElementById('ud3');
  const agentSlot        = document.getElementById('agentSlot');
  const agentSlotImg     = document.getElementById('agentSlotImg');
  const agentSlotPh      = document.getElementById('agentSlotPlaceholder');
  const agentPicker      = document.getElementById('agentPicker');
  const agentPickerGrid  = document.getElementById('agentPickerGrid');
  const unlockBtn        = document.getElementById('unlockBtn');
  const unlockError      = document.getElementById('unlockError');
  let selectedAgent = null;
  const openUnlockModalBtn = document.getElementById('openUnlockModal');
  const closeUnlockModalBtn = document.getElementById('closeUnlockModal');

  // ── Abrir modal nada más entrar ──────────────────────────
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  ud1.focus();
  if (agentPickerGrid.children.length === 0) {
    loadAgents();
  }

  if (openUnlockModalBtn) {
    openUnlockModalBtn.addEventListener('click', () => {
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      ud1.focus();
      if (agentPickerGrid.children.length === 0) {
        loadAgents();
      }
    });
  }

  if (closeUnlockModalBtn) {
    closeUnlockModalBtn.addEventListener('click', () => {
      overlay.hidden = true;
      document.body.style.overflow = '';
    });
  }

  // ── Dígitos: auto-avance ─────────────────────────────────
  const digits = [ud1, ud2, ud3];
  digits.forEach((input, idx) => {
    input.addEventListener('input', () => {
      if (input.value.length > 1) input.value = input.value.slice(-1);
      if (input.value !== '') {
        input.classList.add('filled');
        if (digits[idx + 1]) digits[idx + 1].focus();
      } else {
        input.classList.remove('filled');
      }
      unlockError.hidden = true;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && digits[idx - 1]) {
        digits[idx - 1].focus();
      }
    });
  });

  // ── Ranura agente → mostrar picker ───────────────────────
  agentSlot.addEventListener('click', () => {
    agentPicker.hidden = !agentPicker.hidden;
  });

  // ── Cargar agentes desde Valorant API ────────────────────
  async function loadAgents() {
    try {
      const res  = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
      const json = await res.json();

      // Ordenar alfabéticamente y mezclar para que Astra no siempre esté primero
      const agents = json.data
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .sort(() => Math.random() - 0.5);

      agents.forEach(agent => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'agent-pick-btn';
        btn.dataset.name = agent.displayName;

        const img = document.createElement('img');
        img.src = agent.displayIcon;
        img.alt = agent.displayName;
        img.loading = 'lazy';

        const name = document.createElement('span');
        name.textContent = agent.displayName;

        btn.appendChild(img);
        btn.appendChild(name);

        btn.addEventListener('click', () => {
          // Seleccionar agente
          agentPickerGrid.querySelectorAll('.agent-pick-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedAgent = agent.displayName;

          // Mostrar imagen en la ranura
          agentSlotImg.src = agent.displayIcon;
          agentSlotImg.alt = agent.displayName;
          agentSlotImg.hidden = false;
          agentSlotPh.hidden = true;
          agentSlot.classList.add('selected');

          // Cerrar picker
          agentPicker.hidden = true;
          unlockError.hidden = true;
        });

        agentPickerGrid.appendChild(btn);
      });
    } catch (err) {
      console.error('Error cargando agentes:', err);
      agentPickerGrid.innerHTML = '<p style="color:#94a3b8;font-size:0.8rem;grid-column:1/-1">Error cargando agentes. Necesitas conexión a internet.</p>';
    }
  }

  // ── Validar y redirigir ───────────────────────────────────
  unlockBtn.addEventListener('click', () => {
    const dOk = [ud1.value, ud2.value, ud3.value].join('') === SECRET_DIGITS.join('');
    const aOk = selectedAgent === SECRET_AGENT;

    if (dOk && aOk) {
      unlockBtn.textContent = '¡Correcto! 🎉 Abriendo el tablón...';
      unlockBtn.disabled = true;
      setTimeout(() => {
        window.location.href = 'muro.html?key=cumple';
      }, 900);
    } else {
      // Shake + error
      unlockError.hidden = false;
      modal.classList.remove('shake');
      void modal.offsetWidth;
      modal.classList.add('shake');
      setTimeout(() => modal.classList.remove('shake'), 500);

      if (!dOk) {
        digits.forEach(i => { i.value = ''; i.classList.remove('filled'); });
        ud1.focus();
      }
      if (!aOk) {
        agentPickerGrid.querySelectorAll('.agent-pick-btn').forEach(b => b.classList.remove('selected'));
        agentSlotImg.hidden = true;
        agentSlotPh.hidden = false;
        agentSlot.classList.remove('selected');
        selectedAgent = null;
      }
    }
  });

})();
