(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  let lenis = null;

  $('#year').textContent = new Date().getFullYear();
  const header = $('#header');

  /* ---------- Menu mobile ---------- */
  const burger = $('#burger'), menu = $('#menu');
  function closeMenu() { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });
  $$('#menu a').forEach(a => a.addEventListener('click', closeMenu));

  /* ---------- Galeria: filtro + lightbox (funciona com ou sem GSAP) ---------- */
  const shots = $$('.shot');
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
    const f = b.dataset.filter;
    shots.forEach(s => { s.hidden = !(f === 'all' || s.dataset.cat === f); });
    hasGsap && ScrollTrigger.refresh();
  }));

  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let list = [], idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + list.length) % list.length;
    const it = list[idx];
    lbImg.src = it.src; lbImg.alt = it.alt; lbCap.textContent = it.alt;
    $('#lbPrev').style.display = $('#lbNext').style.display = list.length > 1 ? '' : 'none';
  }
  function openLb(src, trigger) {
    lastFocus = trigger;
    list = shots.filter(s => !s.hidden).map(s => ({ src: s.dataset.full, alt: $('img', s).alt }));
    let i = list.findIndex(x => x.src === src);
    if (i < 0) { list = [{ src, alt: $('img', trigger)?.alt || '' }]; i = 0; }
    show(i);
    lb.hidden = false; requestAnimationFrame(() => lb.classList.add('is-open'));
    lenis && lenis.stop();
    $('#lbClose').focus();
  }
  function closeLb() {
    lb.classList.remove('is-open');
    setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 350);
    lenis && lenis.start(); lastFocus && lastFocus.focus();
  }
  shots.forEach(s => s.addEventListener('click', () => openLb(s.dataset.full, s)));
  $$('a[data-lb]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openLb(a.getAttribute('href'), a); }));
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', () => show(idx - 1));
  $('#lbNext').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  let tx = 0;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1)); }, { passive: true });

  /* ---------- Fallback: sem GSAP ou movimento reduzido ---------- */
  if (!hasGsap || reduce) {
    document.documentElement.classList.remove('js');
    header.classList.toggle('is-scrolled', scrollY > 40);
    addEventListener('scroll', () => header.classList.toggle('is-scrolled', scrollY > 40), { passive: true });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
    else (target === 0 ? window : document.querySelector(target))?.scrollIntoView?.({ behavior: 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    e.preventDefault();
    if (menu.classList.contains('is-open')) closeMenu();
    scrollTo(id === '#topo' ? 0 : id);
  }));

  /* ---------- Hero ---------- */
  gsap.set('.line__in', { yPercent: 115 });
  gsap.set('.hero__cta', { y: 20 });
  (function heroIntro() {
    const t = gsap.timeline({ defaults: { ease: 'expo.out' } });
    t.fromTo('.wall', { scale: 1.12, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.4 }, 0)
     .to('.hero__kicker', { opacity: 1, duration: 1.2 }, 0.2)
     .to('.line__in', { yPercent: 0, duration: 1.6, stagger: 0.14 }, 0.3)
     .fromTo('.header', { yPercent: -100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.2 }, 0.4)
     .to('.hero__cta', { opacity: 1, y: 0, duration: 1.1 }, 1.0)
     .to('.hero__foot', { opacity: 1, duration: 1.2 }, 1.1)
     .fromTo('.hero__tagline > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.12 }, 1.1)
     .fromTo('.scrollcircle', { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(1.6)' }, 1.25);
  })();
  lenis && lenis.start();

  gsap.to('#heroMedia', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#heroContent', { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: '70% top', scrub: true } });
  gsap.to('#heroFoot', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: '30% top', end: '75% top', scrub: true } });
  gsap.to('#ring', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  ScrollTrigger.create({ trigger: '#hero', start: '65% top', onEnter: () => $('.wa').classList.add('is-on'), onLeaveBack: () => $('.wa').classList.remove('is-on') });
  ScrollTrigger.create({ start: 40, onUpdate: s => header.classList.toggle('is-scrolled', s.scroll() > 40) });

  /* ---------- Manifesto ---------- */
  const mt = $('#manifestoText');
  (function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p.trim()) { frag.append(p); return; }
            const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.tagName === 'EM') { const s = document.createElement('span'); s.className = 'w'; n.replaceWith(s); s.append(n); }
          else walk(n);
        }
      });
    };
    walk(el);
  })(mt);
  gsap.to('.manifesto__text .w', { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '#manifestoText', start: 'top 80%', end: 'bottom 55%', scrub: true } });

  /* ---------- Reveals ---------- */
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, overwrite: true })
  });

  /* ---------- Cards ---------- */
  $$('.card').forEach(card => {
    const box = $('.card__img', card), img = $('img', card);
    gsap.to(box, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: card, start: 'top 86%' } });
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo($('.card__meta', card), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 80%' } });
  });
  $$('.card__img img').forEach(i => { i.style.height = '116%'; i.style.marginTop = '-8%'; });

  /* ---------- Parallax ---------- */
  $$('[data-parallax]').forEach(el => {
    gsap.to(el, { yPercent: parseFloat(el.dataset.parallax), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.fromTo('[data-band]', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#band', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Cursor e magnetismo (apenas mouse) ---------- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const cur = $('#cursor');
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY); cur.style.opacity = 1; }, { passive: true });
    document.addEventListener('mouseleave', () => cur.style.opacity = 0);
    $$('[data-cursor], .shot').forEach(el => {
      el.addEventListener('mouseenter', () => { cur.firstElementChild.textContent = el.dataset.label || 'Ver'; cur.classList.add('is-view'); });
      el.addEventListener('mouseleave', () => cur.classList.remove('is-view'));
    });
    $$('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,.55)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,.55)' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28);
        my((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
