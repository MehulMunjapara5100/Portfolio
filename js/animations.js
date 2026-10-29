/* ==================================================================
   MEHUL MUNJAPARA — MOTION LAYER
   Built on Motion (motion.dev), the engine formerly known as Framer Motion.
   Every entrance and interaction runs on spring physics:
   - Intro timeline for header + hero
   - Masked word reveals for headings
   - In-view staggered reveals for every section
   - Counters, scroll progress bar, hero parallax
   - Sticky header, mobile menu, FAQ accordion, process timeline
   - Magnetic buttons, card hover lift, 3D tilt, cursor spotlight
   - Form feedback (error shake, success pop)
   Falls back to main.js CSS reveals when Motion is unavailable or
   the visitor prefers reduced motion.
   ================================================================== */

(function () {
  'use strict';

  var M = window.Motion;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!M || reduce) return;

  var animate = M.animate;
  var stagger = M.stagger;
  var inView = M.inView;
  var scroll = M.scroll;

  // Spring presets (Framer Motion style)
  var ENTER = { type: 'spring', duration: 1, bounce: 0 };
  var SMOOTH = { type: 'spring', stiffness: 170, damping: 26 };
  var SNAPPY = { type: 'spring', stiffness: 400, damping: 30 };
  var BOUNCY = { type: 'spring', stiffness: 320, damping: 14 };
  var MAGNET = { type: 'spring', stiffness: 160, damping: 14, mass: 0.2 };
  var EASE = [0.22, 1, 0.36, 1];

  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.documentElement.classList.add('motion-ready');

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function assign(a, b) { var o = {}; for (var k in a) o[k] = a[k]; for (var j in b) o[j] = b[j]; return o; }

  // Hand transform ownership to Motion for interactive elements
  function own(els) {
    els.forEach(function (el) { el.classList.add('m-spring'); });
    return els;
  }

  // Run `fn` whenever an element's class (or other attribute) changes
  function watch(el, attr, fn) {
    if (!el) return;
    new MutationObserver(function () { fn(el); }).observe(el, { attributes: true, attributeFilter: [attr] });
  }

  // After an entrance finishes, hand control back to CSS
  function settle(els) {
    els.forEach(function (el) {
      el.classList.add('is-visible');
      el.style.opacity = '';
      el.style.transform = '';
      el.style.filter = '';
    });
  }

  function hide(els) {
    els.forEach(function (el) {
      el.classList.add('m-anim');
      el.style.opacity = '0';
    });
  }

  function reveal(els, opts) {
    opts = opts || {};
    if (!els.length) return;
    var from = opts.from || { y: 40 };
    var keyframes = { opacity: [0, 1] };
    if (from.y !== undefined) keyframes.y = [from.y, 0];
    if (from.x !== undefined) keyframes.x = [from.x, 0];
    if (from.scale !== undefined) keyframes.scale = [from.scale, 1];
    if (from.blur) keyframes.filter = ['blur(' + from.blur + 'px)', 'blur(0px)'];

    animate(els, keyframes, assign(ENTER, {
      duration: opts.duration || ENTER.duration,
      bounce: opts.bounce || 0,
      delay: stagger(opts.stagger || 0.08, { startDelay: opts.delay || 0 })
    })).then(function () { settle(els); });
  }

  // Reveal each element as it scrolls into view. Elements entering in the
  // same frame are batched so they still stagger together, while tall
  // stacked grids on mobile reveal card-by-card instead of all at once.
  function onEnter(els, opts) {
    els = els.filter(Boolean);
    if (!els.length) return;
    hide(els);
    var queue = [];
    var scheduled = false;
    els.forEach(function (el) {
      inView(el, function () {
        queue.push(el);
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function () {
          var batch = queue.sort(function (a, b) { return els.indexOf(a) - els.indexOf(b); });
          queue = [];
          scheduled = false;
          reveal(batch, opts);
        });
      }, { amount: (opts && opts.amount) || 0.15 });
    });
  }

  // ---------------------------------------------------------------
  // 1) WORD SPLITTING (masked line reveals)
  // ---------------------------------------------------------------
  function splitWords(el) {
    var inners = [];
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (token) {
            if (token === '') return;
            if (/^\s+$/.test(token)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            var mask = document.createElement('span');
            mask.className = 'm-word';
            var inner = document.createElement('span');
            inner.className = 'm-word__inner';
            inner.textContent = token;
            mask.appendChild(inner);
            frag.appendChild(mask);
            inners.push(inner);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    }
    walk(el);
    return inners;
  }

  function wordReveal(words, delay) {
    return animate(words, { y: ['110%', '0%'], rotate: [4, 0] }, {
      type: 'spring',
      duration: 1.1,
      bounce: 0.1,
      delay: stagger(0.06, { startDelay: delay || 0 })
    });
  }

  // ---------------------------------------------------------------
  // 2) SCROLL PROGRESS BAR
  // ---------------------------------------------------------------
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  scroll(animate(bar, { scaleX: [0, 1] }, { ease: 'linear' }));

  // ---------------------------------------------------------------
  // 3) INTRO TIMELINE — HEADER + HERO
  // ---------------------------------------------------------------
  var header = $('#mainHeader');
  var heroHeading = $('.hero-section_heading');
  var heroWords = heroHeading ? splitWords(heroHeading) : [];
  if (heroHeading) {
    heroHeading.querySelectorAll('[data-animate]').forEach(function (l) { l.classList.add('is-visible'); });
  }

  var heroBits = $$('.hero-section_status, .hero-section_description, .hero-section_btn-wrapper, .hero-section_stats');
  var heroImage = $('.hero-section_image-wrapper');
  var heroCard = $('.hero-section_card');
  var headerBits = header ? $$('.header_logo, .header_nav-link, .header_cta, .header_toggle', header) : [];

  hide(heroBits.concat(heroImage ? [heroImage] : [], heroCard ? [heroCard] : [], headerBits));

  animate(headerBits, { opacity: [0, 1], y: [-16, 0] }, assign(SMOOTH, { delay: stagger(0.04) }))
    .then(function () { settle(headerBits); });

  if (heroBits[0]) {
    animate(heroBits[0], { opacity: [0, 1], y: [16, 0], scale: [0.9, 1] }, assign(BOUNCY, { delay: 0.15 }))
      .then(function () { settle([heroBits[0]]); });
  }

  wordReveal(heroWords, 0.25);

  reveal(heroBits.slice(1), { from: { y: 28, blur: 8 }, delay: 0.65, stagger: 0.12 });

  if (heroImage) {
    animate(heroImage,
      { opacity: [0, 1], clipPath: ['inset(18% 12% 18% 12% round 32px)', 'inset(0% 0% 0% 0% round 32px)'], scale: [1.06, 1] },
      { duration: 1.4, delay: 0.35, ease: EASE }
    ).then(function () {
      settle([heroImage]);
      heroImage.style.clipPath = '';
    });
  }

  if (heroCard) {
    animate(heroCard, { opacity: [0, 1], y: [40, 0], scale: [0.94, 1] }, assign(BOUNCY, { stiffness: 220, damping: 18, delay: 1.1 }))
      .then(function () { settle([heroCard]); });
  }

  var heroSpot = $('.hero-section_spotlight');
  if (heroSpot) {
    animate(heroSpot, { opacity: [0, 1], scaleX: [0.4, 1], y: [-80, 0] }, { duration: 1.8, delay: 0.1, ease: EASE });
  }

  // Flip words: cycles the accent phrase in the headline
  var flipEl = $('[data-flip-words]');
  if (flipEl) {
    var phrases = flipEl.getAttribute('data-flip-words').split('|');
    var flipIndex = 0;
    var flipNext = function () {
      if (document.hidden) return;
      flipIndex = (flipIndex + 1) % phrases.length;
      var old = $$('.m-word__inner', flipEl);
      animate(old, { y: '-110%', opacity: 0, filter: 'blur(6px)' }, { duration: 0.35, ease: [0.4, 0, 1, 1] })
        .then(function () {
          flipEl.textContent = phrases[flipIndex];
          var inners = splitWords(flipEl);
          animate(inners, { y: ['110%', '0%'], opacity: [0, 1], filter: ['blur(6px)', 'blur(0px)'] }, {
            type: 'spring', duration: 0.8, bounce: 0.2, delay: stagger(0.06)
          });
        });
    };
    setTimeout(function () { setInterval(flipNext, 3000); }, 2600);
  }

  // Hero parallax as it scrolls away (uses the `translate` property so it
  // composes with transforms Motion applies)
  var hero = $('.hero-section');
  var heroContent = $('.hero-section_content');
  if (hero && heroImage && heroContent) {
    scroll(function (p) {
      heroImage.style.translate = '0 ' + (p * 90).toFixed(1) + 'px';
      heroContent.style.translate = '0 ' + (p * -40).toFixed(1) + 'px';
      heroContent.style.opacity = String(1 - p * 0.9);
    }, { target: hero, offset: ['start start', 'end start'] });
  }

  // ---------------------------------------------------------------
  // 4) STICKY GHOST HEADER (spring in / out)
  // ---------------------------------------------------------------
  var ghost = $('#ghostHeader');
  if (ghost) {
    var ghostShown = ghost.classList.contains('header-ghost--visible');
    animate(ghost, { y: ghostShown ? 0 : '-140%', opacity: ghostShown ? 1 : 0 }, { duration: 0 });
    watch(ghost, 'class', function () {
      var show = ghost.classList.contains('header-ghost--visible');
      if (show === ghostShown) return;
      ghostShown = show;
      animate(ghost, { y: show ? 0 : '-140%', opacity: show ? 1 : 0 }, show ? assign(BOUNCY, { stiffness: 260, damping: 22 }) : SNAPPY);
    });
  }

  // ---------------------------------------------------------------
  // 5) MOBILE MENU (spring panel + staggered links)
  // ---------------------------------------------------------------
  var overlay = $('#headerMobileOverlay');
  var panel = overlay && $('.header_mobile-panel', overlay);
  if (panel) {
    var menuItems = $$('.header_mobile-item, .header_mobile-footer', panel);
    var menuShown = false;
    animate(panel, { x: '110%' }, { duration: 0 });
    watch(overlay, 'class', function () {
      var open = overlay.classList.contains('header_mobile-overlay--open');
      if (open === menuShown) return;
      menuShown = open;
      if (open) {
        animate(panel, { x: 0 }, { type: 'spring', stiffness: 260, damping: 30 });
        animate(menuItems, { opacity: [0, 1], x: [40, 0] }, assign(SMOOTH, { delay: stagger(0.045, { startDelay: 0.12 }) }));
      } else {
        animate(panel, { x: '110%' }, { type: 'spring', stiffness: 320, damping: 36 });
      }
    });
  }

  // ---------------------------------------------------------------
  // 6) COUNTERS
  // ---------------------------------------------------------------
  $$('[data-count-to]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    el.textContent = '0' + suffix;
    inView(el, function () {
      animate(0, target, {
        duration: 1.8,
        delay: el.closest('.hero-section') ? 0.9 : 0.2,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: function (v) { el.textContent = Math.round(v) + suffix; }
      });
    }, { amount: 0.6 });
  });

  // ---------------------------------------------------------------
  // 7) SECTION HEADINGS — masked word reveal + supporting copy
  // ---------------------------------------------------------------
  $$('main section h2').forEach(function (h2) {
    var words = splitWords(h2);
    h2.classList.add('is-visible');
    h2.style.opacity = '1';
    var head = h2.parentElement.closest('[class*="header"], .section-head, .process-section_intro') || h2.parentElement;
    var badge = $$('[class*="badge"], .pill--badge', head).filter(function (b) { return b !== h2; });
    var copy = $$('p', head).filter(function (p) { return !h2.contains(p); });

    hide(badge.concat(copy));
    animate(words, { y: '110%' }, { duration: 0 });

    inView(h2, function () {
      animate(badge, { opacity: [0, 1], y: [12, 0], scale: [0.85, 1] }, BOUNCY).then(function () { settle(badge); });
      wordReveal(words, 0.1);
      reveal(copy, { from: { y: 20, blur: 6 }, delay: 0.35 });
    }, { amount: 0.4 });
  });

  // ---------------------------------------------------------------
  // 8) SECTION CONTENT REVEALS
  // ---------------------------------------------------------------
  onEnter($$('.logo-marquee__viewport'), { from: { y: 20 } });

  onEnter($$('.work-card'), { from: { y: 80, scale: 0.94 }, stagger: 0.12, duration: 1.1, amount: 0.2 });

  onEnter($$('.benefit-card'), { from: { y: 60, scale: 0.96 }, stagger: 0.12 });

  onEnter($$('.why-card'), { from: { y: 50, scale: 0.95 }, stagger: 0.07 });

  $$('.process-step').forEach(function (step) {
    var icon = $('.process-step_icon', step);
    var card = $('.process-step_card', step);
    hide([icon, card]);
    inView(step, function () {
      animate(icon, { opacity: [0, 1], scale: [0.3, 1], rotate: [-45, 0] }, BOUNCY)
        .then(function () { settle([icon]); });
      animate(card, { opacity: [0, 1], x: [60, 0] }, assign(SMOOTH, { delay: 0.08 }))
        .then(function () { settle([card]); });
    }, { amount: 0.5 });

    // Pop the icon when the scroll-linked timeline reaches this step
    own([icon]);
    var active = false;
    watch(step, 'class', function () {
      var now = step.classList.contains('is-active');
      if (now === active) return;
      active = now;
      animate(icon, { scale: now ? 1.1 : 1 }, now ? BOUNCY : SMOOTH);
    });
  });

  onEnter($$('.expertise-card'), { from: { y: 50, scale: 0.95, blur: 6 }, stagger: 0.06 });

  onEnter($$('.testimonial-card, .testimonial-trust-card, .testimonial-cta'), { from: { y: 60 }, stagger: 0.1 });

  onEnter($$('.faq-item'), { from: { y: 30 }, stagger: 0.06, duration: 0.8 });

  onEnter($$('.contact-form-card, .contact-info-card'), { from: { y: 60, scale: 0.97 }, stagger: 0.15, amount: 0.1 });

  onEnter($$('.contact-info-item'), { from: { x: 30 }, stagger: 0.1, delay: 0.4 });

  onEnter($$('.footer__left > *, .footer__pages-menu, .footer__bottom-wrapper'), { from: { y: 30 }, stagger: 0.08 });

  onEnter($$('.footer__wordmark'), { from: { y: 120, blur: 12 }, duration: 1.6, amount: 0.3 });

  // Anything still using data-animate that wasn't handled above
  onEnter($$('[data-animate="fade-up"]').filter(function (el) {
    return !el.classList.contains('is-visible') && el.style.opacity !== '0';
  }), { from: { y: 30 } });

  // ---------------------------------------------------------------
  // 9) FAQ ACCORDION (spring height)
  // ---------------------------------------------------------------
  $$('.faq-item').forEach(function (item) {
    var summary = $('summary', item);
    var answer = $('.faq-item__answer', item);
    var icon = own([$('.faq-item__icon', item)])[0];
    var busy = false;
    if (item.open) animate(icon, { rotate: 180 }, { duration: 0 });

    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (busy) return;
      busy = true;
      answer.style.overflow = 'hidden';

      if (!item.open) {
        item.open = true;
        var h = answer.scrollHeight;
        animate(icon, { rotate: 180 }, BOUNCY);
        animate(answer, { height: ['0px', h + 'px'], opacity: [0, 1] }, { type: 'spring', stiffness: 220, damping: 26 })
          .then(function () {
            answer.style.height = '';
            answer.style.overflow = '';
            busy = false;
          });
      } else {
        animate(icon, { rotate: 0 }, BOUNCY);
        animate(answer, { height: [answer.offsetHeight + 'px', '0px'], opacity: [1, 0] }, SNAPPY)
          .then(function () {
            item.open = false;
            answer.style.height = '';
            answer.style.opacity = '';
            answer.style.overflow = '';
            busy = false;
          });
      }
    });
  });

  // ---------------------------------------------------------------
  // 10) CONTACT FORM FEEDBACK
  // ---------------------------------------------------------------
  $$('.contact-form__group').forEach(function (group) {
    var hadError = false;
    watch(group, 'class', function () {
      var has = group.classList.contains('has-error');
      if (has && !hadError) {
        animate(group, { x: [0, -10, 9, -6, 4, 0] }, { duration: 0.45, ease: 'easeOut' });
      }
      hadError = has;
    });
  });

  var success = $('#contact-form-success');
  watch(success, 'hidden', function () {
    if (success.hidden) return;
    animate(success, { opacity: [0, 1], scale: [0.92, 1], y: [20, 0] }, BOUNCY);
    var check = $('.contact-form__status-icon', success);
    if (check) animate(check, { scale: [0, 1], rotate: [-90, 0] }, assign(BOUNCY, { delay: 0.15 }));
  });

  var errorCard = $('#contact-form-error');
  watch(errorCard, 'hidden', function () {
    if (errorCard.hidden) return;
    animate(errorCard, { opacity: [0, 1], y: [-10, 0] }, SNAPPY);
  });

  // ---------------------------------------------------------------
  // 11) THEME TOGGLE FEEDBACK
  // ---------------------------------------------------------------
  var toggles = own($$('[data-theme-toggle]'));
  document.addEventListener('themechange', function () {
    toggles.forEach(function (t) {
      animate($$('.theme-toggle__icon', t), { rotate: [-90, 0], scale: [0.4, 1] }, BOUNCY);
    });
  });

  // ---------------------------------------------------------------
  // 12) PRESS FEEDBACK (touch + mouse)
  // ---------------------------------------------------------------
  toggles.forEach(function (t) {
    t.addEventListener('pointerdown', function () { animate(t, { scale: 0.88 }, SNAPPY); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (evt) {
      t.addEventListener(evt, function () { animate(t, { scale: 1 }, BOUNCY); });
    });
  });

  var pressables = own($$('.hero-section_btn, .header_cta, .testimonial-cta, .contact-form__submit, .contact-info-card__chat-btn, .btn'));
  pressables.forEach(function (btn) {
    btn.addEventListener('pointerdown', function () { animate(btn, { scale: 0.95 }, SNAPPY); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (evt) {
      btn.addEventListener(evt, function () { animate(btn, { scale: 1 }, BOUNCY); });
    });
  });

  // ---------------------------------------------------------------
  // 13) POINTER INTERACTIONS (desktop only)
  // ---------------------------------------------------------------
  if (!canHover) return;

  // Magnetic buttons
  pressables.forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      animate(btn, {
        x: (e.clientX - r.left - r.width / 2) * 0.22,
        y: (e.clientY - r.top - r.height / 2) * 0.32
      }, MAGNET);
    });
    btn.addEventListener('pointerleave', function () {
      animate(btn, { x: 0, y: 0 }, BOUNCY);
    });
  });

  // Hover lift on cards
  own($$('.work-card, .benefit-card, .why-card, .expertise-card')).forEach(function (card) {
    card.addEventListener('pointerenter', function () { animate(card, { y: -6 }, SMOOTH); });
    card.addEventListener('pointerleave', function () { animate(card, { y: 0 }, SMOOTH); });
  });

  // Spotlight fill + glowing border that follow the cursor across cards
  $$('.work-card, .benefit-card, .why-card, .expertise-card, .testimonial-card, .contact-info-card, .process-step_card, .contact-form-card')
    .forEach(function (card) {
      ['spotlight', 'glow-ring'].forEach(function (cls) {
        var span = document.createElement('span');
        span.className = cls;
        span.setAttribute('aria-hidden', 'true');
        card.appendChild(span);
      });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });

  // 3D tilt on project screenshots and the portrait
  $$('.work-media, .hero-section_image').forEach(function (media) {
    var host = media.closest('.work-card') || media.closest('.hero-section_image-wrapper');
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      animate(media, { rotateX: py * -6, rotateY: px * 8, scale: 1.02 }, SMOOTH);
    });
    host.addEventListener('pointerleave', function () {
      animate(media, { rotateX: 0, rotateY: 0, scale: 1 }, SMOOTH);
    });
  });
})();
