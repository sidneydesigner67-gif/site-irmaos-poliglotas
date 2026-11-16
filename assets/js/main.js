/* Irmãos Poliglotas — interações (vanilla, sem dependências) */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Reveal on scroll (com stagger por grupo) ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      (e.target._revealTarget || e.target).classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  $$('[data-reveal]').forEach((el) => {
    const sibs = $$(':scope > [data-reveal]', el.parentElement);
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
    // clip-path inset(100%) leaves no visible area to observe → watch the parent instead
    if (el.dataset.reveal === 'clip') { el.parentElement._revealTarget = el; revealIO.observe(el.parentElement); }
    else revealIO.observe(el);
  });
  // also flag elements that only need an "in view" class
  $$('.bridge').forEach((el) => revealIO.observe(el));

  /* ---------- Header: solid + hide on scroll down ---------- */
  const hdr = $('[data-hdr]');
  const burger = $('[data-burger]');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('is-solid', y > 40);
    if (!hdr.classList.contains('is-open')) hdr.classList.toggle('is-hidden', y > 400 && y > lastY);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    hdr.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!hdr.classList.contains('is-open')));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Hero: parallax leve no ponteiro ---------- */
  const par = $('[data-parallax]');
  if (par && finePointer && !reduce) {
    const layers = $$('[data-depth], .sticker', par);
    let raf;
    par.closest('.hero').addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = e.clientX / innerWidth - 0.5;
        const y = e.clientY / innerHeight - 0.5;
        layers.forEach((l) => {
          const d = Number(l.dataset.depth || 1.4);
          l.style.translate = `${x * d * 14}px ${y * d * 14}px`;
        });
      });
    });
  }

  /* ---------- Botões magnéticos ---------- */
  if (finePointer && !reduce) {
    $$('[data-magnet]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        b.style.transform = `translate(${x}px, ${y}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Servus / Moin ---------- */
  $$('[data-flip]').forEach((f) => {
    f.addEventListener('click', () => f.classList.toggle('is-on'));
    if (finePointer) {
      f.addEventListener('pointerenter', () => f.classList.add('is-on'));
      f.addEventListener('pointerleave', () => f.classList.remove('is-on'));
    }
  });

  /* ---------- Método: sticky stage ---------- */
  const steps = $$('.step');
  const screens = $$('.method__screens img');
  const big = $('[data-bignum]');
  let current = 0;
  const setStep = (i) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
    screens.forEach((s, k) => s.classList.toggle('is-on', k === i));
    if (big) {
      big.classList.add('swap');
      setTimeout(() => { big.textContent = String(i + 1); big.classList.remove('swap'); }, 220);
    }
  };
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setStep(Number(e.target.dataset.step)); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => stepIO.observe(s));

  /* ---------- Reel: arrastar para rolar ---------- */
  $$('[data-drag]').forEach((el) => {
    let down = false, moved = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; sx = e.clientX; sl = el.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 6) { moved = true; el.classList.add('is-drag'); }
      el.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      setTimeout(() => el.classList.remove('is-drag'), 0);
    });
    el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') el.scrollBy({ left: 300, behavior: 'smooth' });
      if (e.key === 'ArrowLeft') el.scrollBy({ left: -300, behavior: 'smooth' });
    });
  });

  /* ---------- Lightbox de vídeo (YouTube nocookie) ---------- */
  const lb = $('[data-lb]');
  const frame = $('[data-lb-frame]');
  const title = $('[data-lb-title]');
  let lastFocus;
  const vertical = new Set(['XDAv-WWRCNs', 'xHn5isKLWig', 'D4mYVJGnXo0', 'KyIloOJ5A_k']);
  const openVideo = (id, t) => {
    lastFocus = document.activeElement;
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="${t}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    title.textContent = t;
    lb.classList.toggle('is-vertical', vertical.has(id));
    lb.showModal();
  };
  const closeVideo = () => { lb.close(); };
  lb.addEventListener('close', () => { frame.innerHTML = ''; lastFocus && lastFocus.focus(); });
  lb.addEventListener('click', (e) => { if (e.target === lb) closeVideo(); });
  $('[data-lb-close]').addEventListener('click', closeVideo);
  $$('[data-video]').forEach((b) => b.addEventListener('click', () => openVideo(b.dataset.video, b.dataset.title || '')));
})();
