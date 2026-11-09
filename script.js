(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const menu = document.querySelector('.menu');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------- Menu ---------- */
  const setMenu = (open) => {
    if (!nav || !menu) return;
    nav.classList.toggle('open', open);
    body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menu?.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav?.classList.contains('open')) { setMenu(false); menu.focus(); }
  });
  matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- In-page links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    if (lenis) lenis.scrollTo(target, { offset: -header.offsetHeight + 1, duration: 1.2 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  }));

  /* ---------- Header + progress ---------- */
  const bar = document.querySelector('.progress span');
  const onScroll = () => {
    header.classList.toggle('scrolled', scrollY > 20);
    const max = root.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav ---------- */
  const links = [...document.querySelectorAll('.site-nav a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
    addEventListener('scroll', () => {
      if (sections[0].getBoundingClientRect().top > innerHeight * 0.5) links.forEach((a) => a.classList.remove('active'));
    }, { passive: true });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduce) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let x = -100, y = -100, rx = -100, ry = -100;
    root.classList.add('has-cursor');
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px, ${y}px)`; }, { passive: true });
    const follow = () => { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate(${rx}px, ${ry}px)`; requestAnimationFrame(follow); };
    follow();
    document.querySelectorAll('a, button, label, .skill').forEach((el) => {
      el.addEventListener('pointerenter', () => ring.classList.add('hover'));
      el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
    });
    document.addEventListener('pointerleave', () => { dot.style.opacity = ring.style.opacity = '0'; });
    document.addEventListener('pointerenter', () => { dot.style.opacity = ring.style.opacity = ''; });
  }

  /* ---------- Reveal + counters ---------- */
  const countUp = (el) => {
    const to = +el.dataset.to;
    if (reduce || !to) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1400, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const items = [...document.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window && !reduce) {
    root.classList.add('js');
    const groups = new Map();
    items.forEach((el) => {
      const i = groups.get(el.parentElement) || 0;
      el.style.transitionDelay = `${Math.min(i, 6) * 80}ms`;
      groups.set(el.parentElement, i + 1);
    });
    const pending = new Set(items);
    const reveal = (el) => {
      if (!pending.delete(el)) return;
      el.classList.add('visible');
      el.querySelectorAll('.count').forEach(countUp);
      setTimeout(() => { el.style.transitionDelay = ''; }, 1500);
      io.unobserve(el);
    };
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) reveal(en.target); }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
    // backstop: a fast fling can skip an element past the viewport between observer checks
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking || !pending.size) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        pending.forEach((el) => { if (el.getBoundingClientRect().top < innerHeight * 0.92) reveal(el); });
      });
    }, { passive: true });
  }

  /* ---------- About statement: word-by-word highlight ---------- */
  const statement = document.getElementById('statement');
  if (statement) {
    statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  }

  /* ---------- Skill spotlight ---------- */
  document.querySelectorAll('.skill').forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------- GSAP scenes ---------- */
  if (hasGsap && !reduce) {
    // hero intro
    gsap.from('.hero h1 .line > span', { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: 0.12, delay: 0.15 });
    gsap.from('.hello, .hero-meta, .role-small, .role-big, .hero-statement, .hero-actions, .hero-social li, .scroll-cue', { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.06, delay: 0.45 });
    // hero text drifts apart as you scroll away
    const heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.fromTo('.hero-name', { opacity: 1, xPercent: 0 }, { opacity: 0, xPercent: -18, ease: 'none', immediateRender: false, scrollTrigger: heroST });
    gsap.fromTo('.hero-role', { opacity: 1, xPercent: 0 }, { opacity: 0, xPercent: 18, ease: 'none', immediateRender: false, scrollTrigger: { ...heroST } });
    gsap.fromTo('.hero-bottom', { opacity: 1 }, { opacity: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: '40% top', scrub: true } });

    // statement highlight
    gsap.to('#statement .w', { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top 80%', end: 'bottom 45%', scrub: true } });

    // timeline line
    root.classList.add('js-scrub');
    gsap.fromTo('.tl-progress span', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 55%', scrub: true } });

    // contact headline slides in
    document.querySelectorAll('.contact-title span').forEach((line, i) => {
      gsap.fromTo(line, { xPercent: i % 2 ? 12 : -12 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 25%', scrub: true } });
    });

    // selected work: horizontal pinned scroll on large screens
    const work = document.getElementById('work');
    const track = document.getElementById('work-track');
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      work.classList.add('is-pinned');
      const distance = () => Math.max(0, track.scrollWidth - (innerWidth - track.offsetLeft));
      gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: { trigger: '.work-pin', pin: true, scrub: 0.8, start: 'top top', end: () => '+=' + distance(), invalidateOnRefresh: true, anticipatePin: 1 }
      });
      return () => work.classList.remove('is-pinned');
    });
    addEventListener('load', () => ScrollTrigger.refresh());
  } else {
    root.classList.add('no-scrub');
  }

  /* ---------- Lab: working variant picker + cart drawer ---------- */
  const demo = document.getElementById('demo');
  if (demo) {
    const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    const HEX = { Black: '#17191e', Orange: '#ff642d', Grey: '#9a9ca3' };
    const FREE_SHIP = 150;
    const variants = [];
    let vid = 44100;
    ['Black', 'Orange', 'Grey'].forEach((color) => ['S', 'M', 'L', 'XL'].forEach((size) => {
      const base = size === 'XL' ? 72 : 68;
      const onSale = color === 'Orange';
      variants.push({ id: vid++, color, size, price: onSale ? +(base * 0.8).toFixed(2) : base, compare: onSale ? base : null, available: !(color === 'Grey' && size === 'S') });
    }));
    const $ = (id) => document.getElementById(id);
    const els = { price: $('demo-price'), compare: $('demo-compare'), badge: $('demo-badge'), media: $('demo-media'), colorLabel: $('demo-color-label'), sizeLabel: $('demo-size-label'), qty: $('demo-qty'), add: $('demo-add'), note: $('demo-note'), count: $('demo-count'), drawer: $('demo-drawer'), lines: $('demo-lines'), subtotal: $('demo-subtotal'), ship: $('demo-ship'), shipBar: $('demo-ship-bar'), open: $('demo-cart-open'), close: $('demo-cart-close') };
    const checkout = demo.querySelector('.checkout');
    const cart = [];
    const current = () => {
      const color = demo.querySelector('input[name="color"]:checked').value;
      const size = demo.querySelector('input[name="size"]:checked').value;
      return variants.find((v) => v.color === color && v.size === size);
    };
    const update = () => {
      const color = demo.querySelector('input[name="color"]:checked').value;
      demo.querySelectorAll('input[name="size"]').forEach((input) => {
        input.disabled = !variants.find((v) => v.color === color && v.size === input.value).available;
      });
      const checked = demo.querySelector('input[name="size"]:checked');
      if (checked.disabled) demo.querySelector('input[name="size"]:not(:disabled)').checked = true;
      const v = current();
      els.price.textContent = money.format(v.price);
      els.compare.hidden = !v.compare;
      if (v.compare) els.compare.textContent = money.format(v.compare);
      els.badge.hidden = !v.compare;
      if (v.compare) els.badge.textContent = `-${Math.round((1 - v.price / v.compare) * 100)}%`;
      els.media.style.setProperty('--hc', HEX[v.color]);
      els.colorLabel.textContent = v.color;
      els.sizeLabel.textContent = v.size + (color === 'Grey' ? ' · S sold out' : '');
      els.add.disabled = !v.available;
      els.add.textContent = v.available ? `Add to cart · ${money.format(v.price * clampQty())}` : 'Sold out';
    };
    const clampQty = () => {
      const q = Math.min(9, Math.max(1, parseInt(els.qty.value, 10) || 1));
      els.qty.value = q;
      return q;
    };
    const setDrawer = (open) => {
      els.drawer.classList.toggle('open', open);
      els.drawer.setAttribute('aria-hidden', String(!open));
      els.drawer.querySelectorAll('button').forEach((b) => { b.tabIndex = open ? 0 : -1; });
      if (open) els.close.focus(); else els.open.focus({ preventScroll: true });
    };
    const render = () => {
      const count = cart.reduce((n, l) => n + l.qty, 0);
      const subtotal = cart.reduce((n, l) => n + l.qty * l.v.price, 0);
      els.count.textContent = count;
      els.subtotal.textContent = money.format(subtotal);
      const left = FREE_SHIP - subtotal;
      els.ship.textContent = left > 0 ? `Spend ${money.format(left)} more for free shipping` : 'You unlocked free shipping ✓';
      els.shipBar.style.width = `${Math.min(100, (subtotal / FREE_SHIP) * 100)}%`;
      checkout.disabled = !cart.length;
      els.lines.innerHTML = cart.length ? cart.map((l, i) => `
        <li>
          <span class="thumb" style="--hc:${HEX[l.v.color]}"></span>
          <div><b>Runner Tech Hoodie</b><small>${l.v.color} / ${l.v.size}</small>
            <div class="line-qty"><button type="button" data-i="${i}" data-d="-1" aria-label="Decrease">−</button><small>${l.qty}</small><button type="button" data-i="${i}" data-d="1" aria-label="Increase">+</button></div></div>
          <div class="price">${money.format(l.qty * l.v.price)}<button type="button" class="rm" data-i="${i}">Remove</button></div>
        </li>`).join('') : '<li class="empty">Your cart is empty.</li>';
      if (!els.drawer.classList.contains('open')) els.drawer.querySelectorAll('button').forEach((b) => { b.tabIndex = -1; });
    };
    demo.addEventListener('change', (e) => { if (e.target.name === 'color' || e.target.name === 'size') { els.note.textContent = ''; update(); } });
    els.qty.addEventListener('change', update);
    demo.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { els.qty.value = clampQty() + +b.dataset.q; update(); }));
    els.add.addEventListener('click', async () => {
      const v = current();
      const qty = clampQty();
      els.add.disabled = true;
      els.add.classList.add('loading');
      await new Promise((r) => setTimeout(r, 650)); // stands in for POST /cart/add.js
      const line = cart.find((l) => l.v.id === v.id);
      if (line) line.qty = Math.min(9, line.qty + qty); else cart.push({ v, qty });
      els.add.classList.remove('loading');
      update();
      render();
      els.note.textContent = `Added ${qty} × ${v.color} / ${v.size}`;
      els.open.classList.remove('bump'); void els.open.offsetWidth; els.open.classList.add('bump');
      setDrawer(true);
    });
    els.lines.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const i = +b.dataset.i;
      if (b.classList.contains('rm')) cart.splice(i, 1);
      else { cart[i].qty += +b.dataset.d; if (cart[i].qty < 1) cart.splice(i, 1); else cart[i].qty = Math.min(9, cart[i].qty); }
      render();
      (els.lines.querySelector('button') || els.close).focus();
    });
    checkout.addEventListener('click', () => { checkout.textContent = 'Demo store — no real checkout'; });
    els.open.addEventListener('click', () => setDrawer(true));
    els.close.addEventListener('click', () => setDrawer(false));
    demo.addEventListener('keydown', (e) => { if (e.key === 'Escape' && els.drawer.classList.contains('open')) setDrawer(false); });
    update();
    render();
  }

  /* ---------- Code tabs ---------- */
  const tabs = [...document.querySelectorAll('.code-tabs [role="tab"]')];
  const select = (tab) => tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
