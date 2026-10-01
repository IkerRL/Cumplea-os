/* ============================================================
   enviar.js — Lógica del formulario de envío de post-its (Firebase)
   ============================================================ */

(function () {
  'use strict';

  // ── Firestore ────────────────────────────────────────────
  const db = firebase.firestore();

  // ── DOM refs ─────────────────────────────────────────────
  const form          = document.getElementById('postItForm');
  const messageEl     = document.getElementById('message');
  const charCountEl   = document.getElementById('charCount');
  const charCounter   = messageEl.closest('.form-group').querySelector('.char-counter');
  const messageError  = document.getElementById('messageError');
  const colorPicker   = document.getElementById('colorPicker');
  const isAnonToggle  = document.getElementById('isAnonymous');
  const authorFields  = document.getElementById('authorFields');
  const authorNickEl  = document.getElementById('authorNick');
  const authorHintEl  = document.getElementById('authorHint');
  const submitBtn     = document.getElementById('submitBtn');
  const btnText       = submitBtn.querySelector('.btn-text');
  const btnLoading    = submitBtn.querySelector('.btn-loading');
  const successState  = document.getElementById('successState');
  const formCard      = document.getElementById('formCard');
  const btnAnother    = document.getElementById('btnAnother');
  const previewEl     = document.getElementById('postitPreview');
  const previewText   = document.getElementById('previewText');
  const previewAuthor = document.getElementById('previewAuthor');

  // ── State ─────────────────────────────────────────────────
  let selectedColor = 'yellow';

  // ── Background particles ─────────────────────────────────
  (function initParticles() {
    const container = document.getElementById('bgParticles');
    const colors = ['#a855f7', '#7c3aed', '#ec4899', '#f59e0b', '#06b6d4'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 6 + 3;
      p.style.cssText = `
        width: ${size}px; height: ${size}px;
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration: ${Math.random() * 14 + 10}s;
        animation-delay: ${Math.random() * -20}s;
      `;
      container.appendChild(p);
    }
  })();

  // ── Color picker ─────────────────────────────────────────
  colorPicker.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-btn');
    if (!btn) return;
    colorPicker.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedColor = btn.dataset.color;
    previewEl.className = `postit-preview color-${selectedColor}`;
  });

  // ── Live preview ──────────────────────────────────────────
  messageEl.addEventListener('input', updatePreview);
  isAnonToggle.addEventListener('change', updatePreview);
  authorNickEl.addEventListener('input', updatePreview);

  function updatePreview() {
    const msg = messageEl.value.trim();
    previewText.textContent = msg || 'Tu mensaje aparecerá aquí...';
    previewText.style.color = msg ? '#1e1b18' : '#9ca3af';

    if (!isAnonToggle.checked && authorNickEl.value.trim()) {
      previewAuthor.textContent = `— ${authorNickEl.value.trim()}`;
    } else if (isAnonToggle.checked) {
      previewAuthor.textContent = '— Un viewer anónimo 🎭';
    } else {
      previewAuthor.textContent = '';
    }
  }

  // ── Char counter ──────────────────────────────────────────
  messageEl.addEventListener('input', () => {
    // 1. Convertimos el texto en un array para que los emojis cuenten como 1
    let chars = [...messageEl.value];
    
    // 2. Limitador: Si superan los 1000 caracteres reales, cortamos el texto
    if (chars.length > 1000) {
      messageEl.value = chars.slice(0, 1000).join('');
      chars = [...messageEl.value]; // Recalculamos tras cortar
    }
    
    // 3. Actualizamos el contador visual con la longitud real
    const len = chars.length;
    charCountEl.textContent = len;
    charCounter.className = 'char-counter';
    if (len > 800) charCounter.classList.add('warn');
    if (len > 950) charCounter.classList.add('danger');
  });

  // ── Anonymous toggle ──────────────────────────────────────
  isAnonToggle.addEventListener('change', () => {
    authorFields.classList.toggle('hidden', isAnonToggle.checked);
  });

  // ── Form submission ───────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const msg = messageEl.value.trim();
    if (!msg) {
      messageEl.classList.add('error');
      messageError.classList.add('visible');
      messageEl.focus();
      return;
    }

    // Validación extra antes de enviarlo a Firebase
    if ([...msg].length > 1000) {
      showToast('❌ El mensaje es demasiado largo.', 'error');
      return;
    }

    messageEl.classList.remove('error');
    messageError.classList.remove('visible');

    const isAnon = isAnonToggle.checked;
    const rotation = +(Math.random() * 8 - 4).toFixed(2);

    const payload = {
      message:      msg,
      color:        selectedColor,
      is_anonymous: isAnon,
      author_nick:  isAnon ? null : (authorNickEl.value.trim() || null),
      author_hint:  isAnon ? null : (authorHintEl.value.trim() || null),
      is_read:      false,
      rotation,
      created_at:   firebase.firestore.FieldValue.serverTimestamp(),
    };

    setLoading(true);

    try {
      await db.collection('postits').add(payload);
      showSuccess();
      launchConfetti();
    } catch (err) {
      console.error('Error al guardar:', err);
      setLoading(false);
      showToast('❌ Algo ha fallado. Inténtalo de nuevo.', 'error');
    }
  });

  // Limpiar error al escribir
  messageEl.addEventListener('input', () => {
    if (messageEl.value.trim()) {
      messageEl.classList.remove('error');
      messageError.classList.remove('visible');
    }
  });

  // ── Loading state ─────────────────────────────────────────
  function setLoading(active) {
    submitBtn.disabled = active;
    btnText.hidden = active;
    btnLoading.hidden = !active;
  }

  // ── Success state ─────────────────────────────────────────
  function showSuccess() {
    form.hidden = true;
    successState.hidden = false;
    formCard.querySelector('.card-intro').hidden = true;
  }

  // ── Reset form ────────────────────────────────────────────
  btnAnother.addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    successState.hidden = true;
    formCard.querySelector('.card-intro').hidden = false;
    setLoading(false);
    selectedColor = 'yellow';
    colorPicker.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
    colorPicker.querySelector('[data-color="yellow"]').classList.add('active');
    previewEl.className = 'postit-preview color-yellow';
    updatePreview();
    authorFields.classList.remove('hidden');
  });

  // ── Toast ─────────────────────────────────────────────────
  function showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%) translateY(20px)',
      background: type === 'error' ? '#c0392b' : '#27ae60',
      color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px',
      fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: '500',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      zIndex: '9999', opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    });
    document.body.appendChild(t);
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => t.remove(), 400);
    }, 3500);
  }

})();
