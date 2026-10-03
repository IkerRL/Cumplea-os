/* ============================================================
   muro.js — Lógica del tablón de corcho interactivo (Firebase)
   ============================================================ */

(function () {
  'use strict';

  // ── Firestore ────────────────────────────────────────────
  const db = firebase.firestore();

  // ── DOM refs ─────────────────────────────────────────────
  const corkboard     = document.getElementById('corkboard');
  const loadingScreen = document.getElementById('loadingScreen');
  const emptyState    = document.getElementById('emptyState');

  // Modal
  const modalOverlay   = document.getElementById('modalOverlay');
  const modalPostit    = document.getElementById('modalPostit');
  const modalMessage   = document.getElementById('modalMessage');
  const modalDate      = document.getElementById('modalDate');
  const modalClose     = document.getElementById('modalClose');
  const authorAnon     = document.getElementById('authorAnonymous');
  const authorIdent    = document.getElementById('authorIdentified');
  const hintSection    = document.getElementById('hintSection');
  const hintText       = document.getElementById('hintText');
  const btnReveal      = document.getElementById('btnReveal');
  const authorReveal   = document.getElementById('authorReveal');
  const authorNickDisp = document.getElementById('authorNickDisplay');

  // ── State ─────────────────────────────────────────────────
  let currentPostit = null;

  // ── Local read tracking (localStorage) ───────────────────
  function getReadIds() {
    try { return new Set(JSON.parse(localStorage.getItem('read_postit_ids') || '[]')); }
    catch { return new Set(); }
  }

  function markAsReadLocally(id) {
    const ids = getReadIds();
    ids.add(id);
    localStorage.setItem('read_postit_ids', JSON.stringify([...ids]));
  }

  // ── Fetch and render ──────────────────────────────────────
  async function loadPostits() {
    try {
      const snapshot = await db
        .collection('postits')
        .orderBy('created_at', 'desc')
        .get();

      loadingScreen.style.display = 'none';

      const videos = (window.VIDEOS || []);
      const hasContent = !snapshot.empty || videos.length > 0;

      if (!hasContent) {
        emptyState.hidden = false;
        corkboard.hidden = true;
        return;
      }

      emptyState.hidden = true;
      corkboard.hidden = false;

      const readIds = getReadIds();
      const openedEnvIds = getOpenedEnvIds();

      // Construir items: post-its + sobres mezclados
      const postitItems = snapshot.docs.map(doc => ({
        type: 'postit',
        id: doc.id,
        ...doc.data()
      }));

      const envelopeItems = videos.map((v, i) => ({
        type: 'envelope',
        id: 'env-' + i,
        ...v
      }));

      // Mezclar todo junto
      const all = [...postitItems, ...envelopeItems]
        .sort(() => Math.random() - 0.5);

      all.forEach((item, idx) => {
        let card;
        if (item.type === 'postit') {
          card = buildPostitCard(item, readIds.has(item.id));
        } else {
          card = buildEnvelopeCard(item, openedEnvIds.has(item.id));
        }
        card.style.animationDelay = `${idx * 55}ms`;
        corkboard.appendChild(card);
      });

    } catch (err) {
      console.error('Error cargando post-its:', err);
      loadingScreen.style.display = 'none';
      showErrorBanner();
    }
  }

  // ── Build a post-it card element ──────────────────────────
  function buildPostitCard(data, isRead) {
    const card = document.createElement('article');
    card.className = `postit-card color-${data.color}${isRead ? ' is-read' : ''}`;
    card.dataset.id = data.id;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Abrir mensaje de post-it');

    const rot = data.rotation && Math.abs(data.rotation) <= 4
      ? +(data.rotation * 2.5).toFixed(2)
      : data.rotation ?? +(Math.random() * 24 - 12).toFixed(2);
    card.style.setProperty('--rot', `${rot}deg`);
    card.style.transform = `rotate(${rot}deg)`;

    // Offset aleatorio para desparramar en el grid
    const oy = Math.round(Math.random() * 50 - 10);
    const ox = Math.round(Math.random() * 14 - 7);
    card.style.marginTop  = `${oy}px`;
    card.style.marginLeft = `${ox}px`;

    // Pin
    const pin = document.createElement('div');
    pin.className = 'postit-pin';
    pin.setAttribute('aria-hidden', 'true');
    card.appendChild(pin);

    // Sello "Leído"
    const stamp = document.createElement('div');
    stamp.className = 'read-stamp';
    stamp.textContent = 'Leído';
    card.appendChild(stamp);

    // Extracto del mensaje
    const excerpt = document.createElement('p');
    excerpt.className = 'postit-excerpt';
    excerpt.textContent = data.message;
    card.appendChild(excerpt);

    // Línea de autor
    const authorLine = document.createElement('p');
    authorLine.className = 'postit-author-line';
    if (data.is_anonymous) {
      authorLine.textContent = '🎭 Anónimo';
    } else if (data.author_nick) {
      authorLine.textContent = `✍️ ${data.author_hint ? '???' : data.author_nick}`;
    } else {
      authorLine.textContent = '👤 Viewer';
    }
    card.appendChild(authorLine);

    // Hover: suavizar rotación
    card.addEventListener('mouseenter', () => {
      card.style.transform = `rotate(${rot * 0.3}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `rotate(${rot}deg) translateY(0)`;
    });

    card.addEventListener('click', () => openModal(data, card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(data, card);
      }
    });

    return card;
  }

  // ── Modal ─────────────────────────────────────────────────
  function openModal(data, cardEl) {
    currentPostit = { data, cardEl };

    modalPostit.className = `modal-postit color-${data.color}`;
    modalMessage.textContent = data.message;

    // Fecha — Firestore Timestamp tiene .toDate()
    const rawDate = data.created_at;
    const d = rawDate && rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
    modalDate.textContent = d.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // Reset reveal
    authorReveal.hidden = true;
    btnReveal.hidden = false;
    authorNickDisp.textContent = '';

    // Sección de autor
    if (data.is_anonymous) {
      authorAnon.hidden = false;
      authorIdent.hidden = true;
    } else {
      authorAnon.hidden = true;
      authorIdent.hidden = false;

      if (data.author_hint) {
        hintSection.hidden = false;
        hintText.textContent = data.author_hint;
      } else {
        hintSection.hidden = true;
      }

      authorNickDisp.textContent = data.author_nick || 'Un viewer misterioso';
    }

    // Si ya estaba leído y no hay pista, revelar directamente
    if (!data.is_anonymous && !data.author_hint && cardEl.classList.contains('is-read')) {
      revealAuthor();
    }

    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    if (currentPostit) {
      const { data, cardEl } = currentPostit;
      if (!cardEl.classList.contains('is-read')) {
        cardEl.classList.add('is-read');
        markAsReadLocally(data.id);

        // Persistir en Firestore (best-effort)
        db.collection('postits').doc(data.id)
          .update({ is_read: true })
          .catch(err => console.warn('No se pudo marcar como leído:', err));
      }
      currentPostit = null;
    }

    modalOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  function revealAuthor() {
    btnReveal.hidden = true;
    authorReveal.hidden = false;
  }

  // ── Event listeners ───────────────────────────────────────
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  btnReveal.addEventListener('click', revealAuthor);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!modalOverlay.hidden) closeModal();
      if (!videoModalOverlay.hidden) closeVideoModal();
    }
  });

  // ── Opened envelopes tracking ─────────────────────────────
  function getOpenedEnvIds() {
    try { return new Set(JSON.parse(localStorage.getItem('opened_env_ids') || '[]')); }
    catch { return new Set(); }
  }
  function markEnvOpened(id) {
    const ids = getOpenedEnvIds();
    ids.add(id);
    localStorage.setItem('opened_env_ids', JSON.stringify([...ids]));
  }

  // ── Video modal DOM refs ───────────────────────────────────
  const videoModalOverlay = document.getElementById('videoModalOverlay');
  const envelopeOpenAnim  = document.getElementById('envelopeOpenAnim');
  const envFlap           = document.getElementById('envFlap');
  const videoContainer    = document.getElementById('videoContainer');
  const videoPlayer       = document.getElementById('videoPlayer');
  const videoClose        = document.getElementById('videoClose');
  const videoFromBadge    = document.getElementById('videoFromBadge');

  // ── Build envelope card ────────────────────────────────────
  function buildEnvelopeCard(data, isOpened) {
    const rot = +(Math.random() * 24 - 12).toFixed(2);
    const card = document.createElement('article');
    card.className = `envelope-card env-${data.color}${isOpened ? ' is-opened' : ''}`;
    card.dataset.id = data.id;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Abrir sobre con video sorpresa');
    card.style.setProperty('--rot', `${rot}deg`);
    card.style.transform = `rotate(${rot}deg)`;

    // Offset aleatorio para desparramar
    const oy = Math.round(Math.random() * 50 - 10);
    const ox = Math.round(Math.random() * 14 - 7);
    card.style.marginTop  = `${oy}px`;
    card.style.marginLeft = `${ox}px`;

    card.innerHTML = `
      <div class="env-card-body">
        <div class="env-card-flap"></div>
        <div class="env-card-bottom"></div>
        <div class="env-card-seal">🎬</div>
        <div class="env-card-inner">
          <span class="env-card-icon">🎁</span>
          ${data.from ? `<span class="env-card-from">De: ${data.from}</span>` : ''}
        </div>
      </div>
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = `rotate(${rot * 0.3}deg) translateY(-5px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `rotate(${rot}deg) translateY(0)`;
    });
    card.addEventListener('click', () => openVideoModal(data, card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openVideoModal(data, card);
      }
    });
    return card;
  }

  // ── Open video modal ───────────────────────────────────────
  const COLOR_MAP = {
    red: '#e05a5a', blue: '#5a8fe0', green: '#5ac47a',
    purple: '#9a6fe0', pink: '#e06aaa', gold: '#d4a820'
  };

  function openVideoModal(data, cardEl) {
    // Set envelope color on CSS var
    const color = COLOR_MAP[data.color] || '#e05a5a';
    envelopeOpenAnim.style.setProperty('--anim-env-color', color);
    document.getElementById('envFlap').style.setProperty('--anim-env-color', color);
    document.querySelector('.env-bottom').style.background = color;
    document.querySelector('.env-left').style.background  = color;
    document.querySelector('.env-right').style.background = color;

    // Reset state
    videoContainer.hidden = true;
    envelopeOpenAnim.style.display = 'block';
    envFlap.classList.remove('opening');
    videoPlayer.pause();
    videoPlayer.src = '';

    // Badge remitente
    if (data.from) {
      videoFromBadge.textContent = 'De: ' + data.from;
      videoFromBadge.hidden = false;
    } else {
      videoFromBadge.hidden = true;
    }

    // Mostrar overlay
    videoModalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';

    // Disparar animacion de apertura
    requestAnimationFrame(() => {
      envFlap.classList.add('opening');
    });

    // Tras la animacion, mostrar el video
    setTimeout(() => {
      envelopeOpenAnim.style.display = 'none';
      videoPlayer.src = data.file;
      videoContainer.hidden = false;
      videoPlayer.play().catch(() => {}); // autoplay (el click es user gesture)

      // Marcar como abierto
      if (!cardEl.classList.contains('is-opened')) {
        cardEl.classList.add('is-opened');
        markEnvOpened(data.id);
      }
    }, 750);
  }

  // ── Close video modal ──────────────────────────────────────
  function closeVideoModal() {
    videoPlayer.pause();
    videoPlayer.src = '';
    videoModalOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  videoClose.addEventListener('click', closeVideoModal);
  videoModalOverlay.addEventListener('click', (e) => {
    if (e.target === videoModalOverlay) closeVideoModal();
  });

  // ── Error banner ──────────────────────────────────────────
  function showErrorBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
      background: rgba(200,50,50,0.9); color: white; padding: 0.875rem 1.5rem;
      border-radius: 10px; font-family: Inter,sans-serif; font-size: 0.875rem;
      z-index: 999; box-shadow: 0 4px 20px rgba(0,0,0,0.4); max-width: 90vw;
      text-align: center;
    `;
    banner.textContent = '⚠️ No se pudieron cargar los mensajes. Revisa la configuración de Firebase.';
    document.body.appendChild(banner);
  }

  // ── Reset leídos ──────────────────────────────────────────
  document.getElementById('btnResetRead').addEventListener('click', () => {
    localStorage.removeItem('read_postit_ids');
    localStorage.removeItem('opened_env_ids');
    location.reload();
  });

  // ── Init ──────────────────────────────────────────────────
  loadPostits();

  // ── Reproductor de Música (YouTube) ───────────────────────
  const btnMusicToggle = document.getElementById('btnMusicToggle');
  let ytPlayer = null;
  let isPlaying = false;

  // Global callback para la API de YouTube
  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('youtubePlayer', {
      height: '10', // Muy pequeño para que no se vea pero que el navegador no lo congele totalmente
      width: '10',
      videoId: 'o_UfJHtmFOY', // Tu vídeo
      playerVars: { 
        'autoplay': 1, 
        'loop': 1, 
        'playlist': 'o_UfJHtmFOY', 
        'controls': 0 
      },
      events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
      }
    });
  };

  function onPlayerReady(event) {
    // Bajar el volumen para que sea música de fondo suave (0 a 100)
    event.target.setVolume(15);
    // Intentamos reproducir automáticamente
    event.target.playVideo();
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
      isPlaying = true;
      if (btnMusicToggle) btnMusicToggle.textContent = '🔊';
    } else {
      isPlaying = false;
      if (btnMusicToggle) btnMusicToggle.textContent = '🎵';
    }
  }

  if (btnMusicToggle) {
    btnMusicToggle.addEventListener('click', () => {
      if (!ytPlayer) return;
      if (isPlaying) {
        ytPlayer.pauseVideo();
      } else {
        ytPlayer.playVideo();
      }
    });
  }

  // Reproducir cuando se interactúa con el muro por primera vez (políticas de navegador)
  document.body.addEventListener('click', () => {
    if (ytPlayer && !isPlaying) {
      ytPlayer.playVideo();
    }
  }, { once: true });

})();
