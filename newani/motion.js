/* =====================================================================
   newani: motion layer for the homepage
   GSAP + ScrollTrigger + Lenis. Skipped entirely for prefers-reduced-motion,
   in which case the page shows its normal static layout.
===================================================================== */
(function () {
  var root = document.documentElement;
  var loader = document.getElementById('loader');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    if (loader) loader.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('motion');

  // eyebrows are inline-flex: keep their text in one flex item so it still wraps once split into words
  Array.prototype.forEach.call(document.querySelectorAll('.eyebrow'), function (e) {
    e.innerHTML = '<span>' + e.innerHTML + '</span>';
  });

  var BG = { cream: '#F7F2E9', deep: '#F1E9DA', card: '#FFFFFF', dark: '#191510' };

  // document-space position, unaffected by transforms
  function docTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function docLeft(el) { var x = 0; while (el) { x += el.offsetLeft; el = el.offsetParent; } return x; }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- split text into words (.w) and letters (.l), keeping inner wrappers ---------- */
  function split(el) {
    if (el._split) return el._split;
    var words = [], letters = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          if (!ch.nodeValue.trim()) return;
          var frag = document.createDocumentFragment();
          ch.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            Array.from(part).forEach(function (c) {
              var l = document.createElement('span'); l.className = 'l'; l.textContent = c;
              w.appendChild(l); letters.push(l);
            });
            frag.appendChild(w); words.push(w);
          });
          ch.parentNode.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR') { walk(ch); }
      });
    })(el);
    return (el._split = { words: words, letters: letters });
  }

  /* ---------- smooth scroll (Lenis on GSAP's ticker, so pins and scrubs stay in sync) ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  // same-page links glide
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.6 });
    else window.scrollTo({ top: target === 0 ? 0 : docTop(target) - 20, behavior: 'smooth' });
  });

  /* ---------- header: full width at the top, floating pill once scrolled ---------- */
  var header = $('#header');
  ScrollTrigger.create({ start: 80, end: 'max', onToggle: function (s) { header.classList.toggle('is-pill', s.isActive); } });

  /* ---------- buttons: label rolls like a cube ---------- */
  $$('.btn:not(.btn-ghost)').forEach(function (b) {
    var html = b.innerHTML;
    b.innerHTML = '<span class="btn__roll"><span class="btn__f">' + html + '</span><span class="btn__b" aria-hidden="true">' + html + '</span></span>';
  });

  /* ---------- page colour follows the section in the middle of the screen ---------- */
  var bgSecs = $$('[data-bg]'), curBg = null, bgFrame = 0;
  function checkBg() {
    if (++bgFrame % 3) return;
    var mid = window.innerHeight * 0.5;
    for (var i = bgSecs.length - 1; i >= 0; i--) {
      var r = bgSecs[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) {
        var k = bgSecs[i].getAttribute('data-bg');
        if (k !== curBg) {
          curBg = k;
          gsap.to(document.body, { backgroundColor: BG[k], duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
        }
        return;
      }
    }
  }
  gsap.set(document.body, { backgroundColor: BG.cream });
  gsap.ticker.add(checkBg);

  /* =====================================================================
     LOADER + HERO INTRO (plays once on load)
  ===================================================================== */
  var title = $('.hero__title');
  var titleSplit = split(title);
  // each letter takes a solid colour along an ink -> warm grey ramp; the highlight stays orange
  var plain = titleSplit.letters.filter(function (l) { return !l.closest('.hl'); });
  plain.forEach(function (l, i) {
    l.style.color = gsap.utils.interpolate('#1A1712', '#4A4034', i / Math.max(1, plain.length - 1));
  });
  gsap.set(titleSplit.letters, { yPercent: 110, autoAlpha: 0 });
  gsap.set(['.hero__eyebrow', '.hero__support', '.hero__cta'], { y: 24, autoAlpha: 0 });
  gsap.set('.lens', { yPercent: 30, autoAlpha: 0, scale: 0.94 });

  function heroIntro() {
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to('.hero__eyebrow', { y: 0, autoAlpha: 1, duration: 0.6 })
      .to(titleSplit.letters, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.016 }, 0.1)
      .to('.hero__support', { y: 0, autoAlpha: 1, duration: 0.7 }, 0.55)
      .to('.hero__cta', { y: 0, autoAlpha: 1, duration: 0.7 }, 0.68)
      .to('.lens', { yPercent: 0, autoAlpha: 1, scale: 1, duration: 1.1, ease: 'expo.out' }, 0.8);
  }

  var t0 = performance.now(), lifted = false;
  if (loader) gsap.to('#loader .ld__bar i', { scaleX: 0.85, duration: 1.4, ease: 'power2.out' });
  function lift() {
    if (lifted) return; lifted = true;
    if (!loader) { if (lenis) lenis.start(); heroIntro(); return; }
    gsap.timeline({ onComplete: function () { loader.remove(); } })
      .to('#loader .ld__bar i', { scaleX: 1, duration: 0.3, ease: 'power2.out', overwrite: true })
      .to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '+=0.12')
      .add(function () { if (lenis) lenis.start(); heroIntro(); }, '-=0.45');
  }
  function whenLoaded() { setTimeout(lift, Math.max(0, 1100 - (performance.now() - t0))); }
  if (document.readyState === 'complete') whenLoaded(); else window.addEventListener('load', whenLoaded);
  setTimeout(lift, 5000);   // never hold the page for a slow image

  /* =====================================================================
     SCROLL SCENES
  ===================================================================== */
  var mm = gsap.matchMedia();
  mm.add({
    desktop: '(min-width: 901px)',
    tall: '(min-height: 640px)'
  }, function (ctx) {
    var isDesktop = ctx.conditions.desktop;
    var canPin = isDesktop && ctx.conditions.tall;
    var cleanups = [];
    function keep(f) { if (typeof f === 'function') cleanups.push(f); }

    /* generic helpers (created per section, in page order) */
    function revealHeading(sec) {
      $$('[data-reveal]', sec).forEach(function (h) {
        var ws = split(h).words;
        gsap.fromTo(ws, { opacity: 0.12 }, { opacity: 1, stagger: 0.3, ease: 'none',
          scrollTrigger: { trigger: h, start: 'top 88%', end: 'top 45%', scrub: 0.4 } });
      });
    }
    function revealWords(sec) {
      $$('[data-words]', sec).forEach(function (p) {
        gsap.fromTo(split(p).words, { opacity: 0.15 }, { opacity: 1, stagger: 0.2, ease: 'none',
          scrollTrigger: { trigger: p, start: 'top 85%', end: 'bottom 55%', scrub: 0.4 } });
      });
    }
    function rise(sec) {
      $$('[data-rise]', sec).forEach(function (group) {
        var kids = Array.prototype.slice.call(group.children);
        gsap.set(kids, { y: 70, autoAlpha: 0, rotation: 2 });
        ScrollTrigger.batch(kids, {
          start: 'top 90%',
          once: true,
          onEnter: function (batch) { gsap.to(batch, { y: 0, autoAlpha: 1, rotation: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }); }
        });
      });
    }
    function parallax(sec) {
      $$('[data-parallax]', sec).forEach(function (frame) {
        var img = $('img', frame);
        gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, { yPercent: 7, scale: 1.16, ease: 'none',
          scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } });
        if (frame.hasAttribute('data-clip')) {
          gsap.fromTo(frame, { clipPath: 'inset(30% 12% 30% 12% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', ease: 'none',
            scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 35%', scrub: 0.5 } });
        }
      });
    }
    function section(sec) { revealHeading(sec); revealWords(sec); rise(sec); parallax(sec); }
    // scale a pinned block down if it is taller than the screen, so nothing is cut off
    function fitter(wrap) {
      function fit() {
        gsap.set(wrap, { scale: 1 });
        var sc = Math.min(1, (window.innerHeight - 40) / wrap.offsetHeight);
        gsap.set(wrap, { scale: sc, transformOrigin: '50% 50%' });
      }
      fit();
      ScrollTrigger.addEventListener('refreshInit', fit);
      return function () { ScrollTrigger.removeEventListener('refreshInit', fit); gsap.set(wrap, { clearProps: 'scale,transformOrigin' }); };
    }

    /* ===== 01 HERO: CLARITY lens travels down and lands on the eyes; the portrait sharpens ===== */
    keep((function () {
      var hero = $('.hero'), lensWrap = $('.lens-wrap'), stage = $('.stage'), media = $('.stage__media');
      var EYE_X = 0.513, EYE_Y = 0.298, EYE_W = 0.40;    // eye line in hero.jpg, as a share of the photo
      var RINGS = $$('.ring');
      function eyeX() { return docLeft(media) + media.offsetWidth * EYE_X; }
      function eyeY() { return docTop(media) + media.offsetHeight * EYE_Y; }
      function heroEnd() { return Math.max(300, eyeY() - window.innerHeight * 0.42); }
      function bleed() { return Math.max(0, Math.floor((root.clientWidth - stage.offsetWidth) / 2)); }

      gsap.set(RINGS, { scale: 0, autoAlpha: 0, transformOrigin: '50% 50%' });

      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: hero, start: 0, end: heroEnd, scrub: true, invalidateOnRefresh: true }
      })
        .to(lensWrap, {
          x: function () { return eyeX() - (docLeft(lensWrap) + lensWrap.offsetWidth / 2); },
          y: function () { return eyeY() - (docTop(lensWrap) + lensWrap.offsetHeight * 0.42); },
          scale: function () { return media.offsetWidth * EYE_W / lensWrap.offsetWidth; },
          duration: 1
        }, 0)
        .fromTo(stage, { scale: isDesktop ? 0.62 : 0.86, transformOrigin: '50% 100%' }, { scale: 1, duration: 1 }, 0)
        .to('.hero__fade', { autoAlpha: 0, duration: 0.18 }, 0.04)
        .fromTo('.stage__bg', { opacity: 0, scale: 1.6, transformOrigin: '50% 100%' }, { opacity: 1, scale: 1, duration: 0.5 }, 0.1)
        .fromTo('.stage__photo', { autoAlpha: 0, yPercent: 6 }, { autoAlpha: 1, yPercent: 0, duration: 0.3 }, 0.28)
        .fromTo('.stage__photo img', { filter: 'blur(22px) saturate(.6)' }, { filter: 'blur(0px) saturate(1)', duration: 0.68 }, 0.3)
        .fromTo('.stage .hero-card', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.8)
        .fromTo('.stage__bg', { left: 0, right: 0 }, { left: function () { return -bleed(); }, right: function () { return -bleed(); }, duration: 0.25, ease: 'power2.inOut' }, 0.75)
        .fromTo(RINGS, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'power2.out', stagger: 0.12 }, 0.55);

      // side lines: letters fade in as the lens comes down
      [['.stage__line--l', 0.55], ['.stage__line--r', 0.7]].forEach(function (pair) {
        var ls = split($(pair[0])).letters;
        gsap.set(ls, { opacity: 0 });
        gsap.to(ls, { opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power1.out',
          scrollTrigger: { trigger: hero, start: function () { return heroEnd() * pair[1]; }, toggleActions: 'play none none reverse', invalidateOnRefresh: true } });
      });

      // rings drift with the mouse, inner ring most (like looking through a lens)
      if (fine) {
        var DEPTH = [34, 22, 12];
        var movers = RINGS.map(function (r) { return { x: gsap.quickTo(r, 'x', { duration: 1.1, ease: 'power3.out' }), y: gsap.quickTo(r, 'y', { duration: 1.1, ease: 'power3.out' }) }; });
        var onMove = function (e) {
          var box = stage.getBoundingClientRect();
          if (box.bottom < 0 || box.top > window.innerHeight) return;
          var nx = e.clientX / window.innerWidth * 2 - 1, ny = e.clientY / window.innerHeight * 2 - 1;
          movers.forEach(function (m, i) { m.x(nx * DEPTH[i]); m.y(ny * DEPTH[i]); });
        };
        window.addEventListener('mousemove', onMove, { passive: true });
        return function () { window.removeEventListener('mousemove', onMove); };
      }
    })());

    /* ===== 02 MARQUEE: endless loop that speeds up and leans with scroll speed ===== */
    keep((function () {
      var track = $('#mtrack');
      var items = $$('.logo-item', track);
      var loop = gsap.to(track, { x: function () { return -(track.scrollWidth / 2 + 30); }, duration: 44, ease: 'none', repeat: -1 });
      var skewTo = gsap.quickTo(items, 'skewX', { duration: 0.5, ease: 'power3' });
      var settle;
      ScrollTrigger.create({
        trigger: '.marquee-sec', start: 'top bottom', end: 'bottom top',
        onUpdate: function (s) {
          var v = s.getVelocity();
          var dir = v < 0 ? -1 : 1;
          gsap.to(loop, { timeScale: dir * Math.min(6, 1 + Math.abs(v) / 400), duration: 0.2, overwrite: true });
          skewTo(gsap.utils.clamp(-12, 12, -v / 160));
          clearTimeout(settle);
          settle = setTimeout(function () { gsap.to(loop, { timeScale: dir, duration: 0.9, overwrite: true }); skewTo(0); }, 140);
        }
      });
    })());

    /* ===== 03 NUMBERS: pinned, each figure counts up ===== */
    keep((function () {
      var sec = $('.numbers');
      revealHeading(sec);
      var stats = $$('.stat', sec);
      var nums = $$('.num', sec);
      var fmt = function (n) { return Math.round(n).toLocaleString('en-IN'); };
      var counters = nums.map(function (n) { var o = { v: 0 }; n.textContent = '0' + n.dataset.suffix; return o; });
      function build(tl) {
        tl.fromTo(stats, { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out' }, 0);
        nums.forEach(function (n, i) {
          tl.to(counters[i], { v: +n.dataset.to, duration: 1, ease: 'power2.out',
            onUpdate: function () { n.textContent = fmt(counters[i].v) + n.dataset.suffix; } }, 0.15 + i * 0.15);
        });
        return tl;
      }
      if (canPin) {
        sec.classList.add('is-pinned');
        build(gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: '+=110%', pin: true, scrub: 0.5 } }))
          .to({}, { duration: 0.3 });
        return function () { sec.classList.remove('is-pinned'); nums.forEach(function (n) { n.textContent = fmt(+n.dataset.to) + n.dataset.suffix; }); };
      }
      build(gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 70%', once: true } }));
    })());

    /* ===== 04 MANIFESTO: words light up one by one, the rest fly out, the key lines settle centre ===== */
    keep((function () {
      var sec = $('.manifesto');
      var copy = $('.manifesto__copy', sec);
      var words = split(copy).words;
      var colorEls = $$('.mf-1, .mf-2', copy);
      var plainWords = words.filter(function (w) { return !w.closest('.mf-1, .mf-2'); });
      var nameWords = words.filter(function (w) { return w.closest('.mf-1, .mf-2'); });
      var finalBox = $('.manifesto__final', sec);
      var DIM = 'rgba(247,242,233,.14)', TEXT = '#F7F2E9';
      sec.classList.add('is-pinned');
      gsap.set(finalBox, { autoAlpha: 0 });
      gsap.set(words, { color: DIM });

      function lineGroups() {
        var groups = [], last = null;
        plainWords.forEach(function (w) {
          var t = Math.round(w.getBoundingClientRect().top);
          if (last === null || Math.abs(t - last) > 4) { groups.push([]); last = t; }
          groups[groups.length - 1].push(w);
        });
        return groups;
      }

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: sec, start: 'top top', end: '+=' + (isDesktop ? '320%' : '240%'), pin: true, scrub: 0.4, invalidateOnRefresh: true }
      });
      tl.to(words, { color: TEXT, stagger: 1, duration: 1 })
        .to(nameWords, { color: function (i, el) { return el.closest('.mf-1') ? '#F26A1B' : '#F6B26B'; }, duration: 4, stagger: 0.15 })
        .to({}, { duration: 8 });
      var outAt = tl.duration();
      lineGroups().forEach(function (line, i) {
        tl.to(line, { y: -100, rotation: -45, transformOrigin: '0% 100%', autoAlpha: 0, duration: 8, ease: 'power2.in', stagger: { each: 0.6 } }, outAt + i * 5);
      });
      tl.to(['.manifesto__eyebrow'], { autoAlpha: 0, duration: 6 }, outAt)
        .to(nameWords, { autoAlpha: 0, duration: 6 }, '>-4')
        .fromTo(finalBox, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 10, ease: 'power2.out' }, '<')
        .fromTo($$('strong', finalBox), { scale: 0.92 }, { scale: 1, duration: 12, ease: 'power2.out', stagger: 2 }, '<')
        .to({}, { duration: 14 });
      return function () { sec.classList.remove('is-pinned'); };
    })());

    /* ===== 05 QUESTIONS ===== */
    section($('.questions'));

    /* ===== 06 AUDIT FILM: grows to full width, pins, glass panel in, copy wipes from faint to white ===== */
    keep((function () {
      var sec = $('.film');
      var fMedia = $('.film__media', sec), panel = $('.film__panel', sec), lines = $$('.reveal', sec);
      var probe = $('.film__probe', sec);
      if (!canPin) {
        gsap.fromTo(lines, { '--p': '0%' }, { '--p': '115%', stagger: 0.6, ease: 'none',
          scrollTrigger: { trigger: panel, start: 'top 80%', end: 'bottom 60%', scrub: 0.5 } });
        gsap.fromTo($('img', fMedia), { scale: 1.2 }, { scale: 1, ease: 'none',
          scrollTrigger: { trigger: fMedia, start: 'top bottom', end: 'top 30%', scrub: true } });
        return;
      }
      function cw() { return probe.offsetWidth; }
      gsap.fromTo(fMedia, { width: function () { return cw() + 'px'; }, borderRadius: 20 },
        { width: function () { return root.clientWidth + 'px'; }, borderRadius: 0, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top center', end: 'center center', scrub: true, invalidateOnRefresh: true } });
      var pin = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'center center', end: '+=170%', pin: true, scrub: 0.6 } })
        .fromTo(panel, { xPercent: 100, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 1, ease: 'power2.out' })
        .fromTo(lines, { '--p': '0%' }, { '--p': '115%', duration: 1.2, stagger: 0.9, ease: 'none' }, '+=0.1')
        .to({}, { duration: 0.5 });
      gsap.timeline({
        defaults: { ease: 'none', immediateRender: false },
        scrollTrigger: {
          start: function () { return pin.scrollTrigger.end; },
          end: function () { return pin.scrollTrigger.end + window.innerHeight * 0.6; },
          scrub: true, invalidateOnRefresh: true
        }
      })
        .fromTo(fMedia, { width: function () { return root.clientWidth + 'px'; }, borderRadius: 0 }, { width: function () { return cw() + 'px'; }, borderRadius: 20, duration: 1 }, 0);
    })());

    /* ===== 07 REVIEW AREAS ===== */
    section($('.areas-sec'));

    /* ===== 08 OPTIONS: scattered cards gather into the row ===== */
    keep((function () {
      var sec = $('.options');
      var tiles = $$('.opt', sec), opts = $('.opts', sec);
      revealHeading(sec);
      if (!canPin) {
        gsap.from(tiles, { y: 90, rotation: function (i) { return [-6, 4, 7][i]; }, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
          scrollTrigger: { trigger: opts, start: 'top 85%', once: true } });
        return;
      }
      var scatter = [{ x: -160, y: 120, r: -12 }, { x: 30, y: -110, r: 8 }, { x: 190, y: 150, r: 14 }];
      sec.classList.add('is-pinned');
      var unfit = fitter($('.wrap', sec));
      var settled = false;
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: sec, start: 'top top', end: '+=160%', pin: true, scrub: 0.5,
          onUpdate: function (s) { settled = s.progress > 0.8; } }
      })
        .fromTo(tiles,
          { x: function (i) { return scatter[i].x; }, y: function (i) { return scatter[i].y; }, rotation: function (i) { return scatter[i].r; }, scale: 0.92 },
          { x: 0, y: 0, rotation: 0, scale: 1, duration: 1, ease: 'power2.inOut', stagger: 0.08 }, 0)
        .fromTo(opts, { backgroundColor: 'rgba(241,233,218,0)' }, { backgroundColor: 'rgba(241,233,218,1)', duration: 0.3 }, 0.85)
        .to({}, { duration: 0.3 });
      var untilt = fine ? tilt(tiles, function () { return settled; }) : null;
      return function () { sec.classList.remove('is-pinned'); unfit(); if (untilt) untilt(); };
    })());

    /* ===== 09 WHY ===== */
    keep((function () {
      var sec = $('#why');
      section(sec);
      if (fine) return tilt($$('.trust', sec), null, 6);
    })());

    /* ===== 10 BRANDING + 11 ABOUT ===== */
    section($('#branding'));
    section($('#about'));

    /* ===== 12 PROCESS: the four steps are held like a hand of cards, then dealt one by one ===== */
    keep((function () {
      var sec = $('.process');
      var cards = $$('.step', sec), bodies = $$('.step__body', sec), row = $('.steps', sec);
      revealHeading(sec);
      if (!canPin) {
        gsap.from(cards, { y: 80, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
          scrollTrigger: { trigger: row, start: 'top 85%', once: true } });
        return;
      }
      sec.classList.add('is-pinned');
      var unfit = fitter($('.wrap', sec));
      var FAN = [{ dx: -0.16, dy: 0.42, r: -14 }, { dx: -0.05, dy: 0.34, r: -4 }, { dx: 0.05, dy: 0.34, r: 4 }, { dx: 0.16, dy: 0.42, r: 14 }];
      cards.forEach(function (c, i) { c.style.zIndex = i + 1; });
      function handX(i, c) { return (row.offsetWidth / 2) - (c.offsetLeft + c.offsetWidth / 2) + FAN[i].dx * row.offsetWidth; }
      gsap.set(cards, { x: handX, y: function (i, c) { return FAN[i].dy * c.offsetHeight; }, rotation: function (i) { return FAN[i].r; } });
      gsap.set(bodies, { autoAlpha: 0 });
      var settled = false;
      var tl = gsap.timeline({
        scrollTrigger: { trigger: sec, start: 'top top', end: '+=200%', pin: true, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: function (s) { settled = s.progress > 0.92; } }
      });
      tl.fromTo(cards, { x: handX, y: function (i, c) { return FAN[i].dy * c.offsetHeight + 60; }, rotation: function (i) { return FAN[i].r * 0.4; } },
        { x: handX, y: function (i, c) { return FAN[i].dy * c.offsetHeight; }, rotation: function (i) { return FAN[i].r; }, duration: 0.5, ease: 'power2.out' }, 0);
      cards.forEach(function (c, i) {
        var at = 0.6 + i * 0.7;
        tl.to(c, { x: 0, y: 0, rotation: 0, duration: 0.8, ease: 'power3.inOut' }, at)
          .to(bodies[i], { autoAlpha: 1, duration: 0.3 }, at + 0.6);
      });
      tl.fromTo($('.process-cta', sec), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4 })
        .to({}, { duration: 0.5 });
      var untilt = fine ? tilt(cards, function () { return settled; }) : null;
      return function () { sec.classList.remove('is-pinned'); unfit(); if (untilt) untilt(); gsap.set($('.process-cta', sec), { clearProps: 'all' }); };
    })());

    /* ===== 13 CONTACT ===== */
    keep((function () {
      var sec = $('#contact');
      section(sec);
      gsap.from($('.form-card', sec), { y: 120, rotation: 3, autoAlpha: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
    })());

    /* ===== 14 FINAL CTA: big line rises letter by letter ===== */
    keep((function () {
      var sec = $('.section--dark');
      var big = split($('.finalcta .eyebrow', sec)).letters;
      gsap.from(big, { yPercent: 100, autoAlpha: 0, rotation: 8, duration: 0.9, ease: 'power3.out', stagger: 0.025,
        scrollTrigger: { trigger: sec, start: 'top 70%', once: true } });
      gsap.from($$('.finalcta > :not(.eyebrow)', sec), { y: 30, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: sec, start: 'top 60%', once: true } });
    })());
    return function () { cleanups.forEach(function (f) { f(); }); };
  });

  /* =====================================================================
     POINTER EFFECTS (mouse only)
  ===================================================================== */
  // 3D tilt with a shadow that falls away from the cursor (the cursor is the light)
  function tilt(els, ready, max) {
    max = max || 10;
    var offs = els.map(function (el) {
      gsap.set(el, { transformPerspective: 900 });
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
      function move(e) {
        if (ready && !ready()) return;
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        rx(-py * max); ry(px * max);
        el.style.boxShadow = (-px * 30) + 'px ' + (-py * 30 + 18) + 'px 44px rgba(25,21,16,.14)';
      }
      function leave() { rx(0); ry(0); el.style.boxShadow = ''; }
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      return function () { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); leave(); };
    });
    return function () { offs.forEach(function (f) { f(); }); };
  }

  if (fine) {
    /* cursor: a dot inside four corner brackets; the brackets wrap anything clickable */
    root.classList.add('has-cur');
    var dot = $('.cur__dot'), box = $('.cur__box');
    var dX = gsap.quickTo(dot, 'x', { duration: 0.08 }), dY = gsap.quickTo(dot, 'y', { duration: 0.08 });
    var bX = gsap.quickTo(box, 'x', { duration: 0.35, ease: 'power3' }), bY = gsap.quickTo(box, 'y', { duration: 0.35, ease: 'power3' });
    var bW = gsap.quickTo(box, 'width', { duration: 0.35, ease: 'power3' }), bH = gsap.quickTo(box, 'height', { duration: 0.35, ease: 'power3' });
    var mx = -100, my = -100;
    gsap.set([dot, box], { autoAlpha: 0 });
    function placeCursor() {
      dX(mx); dY(my);
      var el = document.elementFromPoint(mx, my);
      var field = el && el.closest('input, textarea');
      var target = el && !field && el.closest('a, button, [data-cursor]');
      gsap.to([dot, box], { autoAlpha: field ? 0 : 1, duration: 0.2, overwrite: 'auto' });
      if (target) {
        var r = target.getBoundingClientRect();
        bX(r.left - 7); bY(r.top - 7); bW(r.width + 14); bH(r.height + 14);
      } else {
        bX(mx - 16); bY(my - 16); bW(32); bH(32);
      }
    }
    window.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; placeCursor(); }, { passive: true });
    if (lenis) lenis.on('scroll', placeCursor); else window.addEventListener('scroll', placeCursor, { passive: true });
    document.addEventListener('mouseleave', function () { gsap.to([dot, box], { autoAlpha: 0, duration: 0.2 }); });

    /* magnetic primary buttons */
    $$('[data-magnetic]').forEach(function (b) {
      var x = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), y = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35);
      });
      b.addEventListener('mouseleave', function () { x(0); y(0); });
    });

    /* letter wave + proximity weight on big headings */
    $$('[data-wave], .eyebrow[data-reveal]').forEach(function (h) {
      var ls = split(h).letters;
      var centers = [], fs = 40;
      var ys = ls.map(function (l) { return gsap.quickTo(l, 'y', { duration: 0.4, ease: 'power3' }); });
      var wt = ls.map(function (l) { return gsap.quickTo(l, '--wt', { duration: 0.4, ease: 'power3' }); });
      h.addEventListener('mouseenter', function () {
        fs = parseFloat(getComputedStyle(h).fontSize);
        centers = ls.map(function (l) { var r = l.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      });
      h.addEventListener('mousemove', function (e) {
        var reach = fs * 1.2;
        ls.forEach(function (l, i) {
          var c = centers[i]; if (!c) return;
          if (Math.abs(c[1] - e.clientY) > fs * 0.9) { ys[i](0); wt[i](0); return; }
          var dx = c[0] - e.clientX;
          var f = Math.exp(-(dx * dx) / (2 * reach * reach));
          ys[i](-f * fs * 0.16); wt[i](f);
        });
      });
      h.addEventListener('mouseleave', function () { ys.forEach(function (q) { q(0); }); wt.forEach(function (q) { q(0); }); });
    });
  }

  // measurements depend on images and fonts
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
