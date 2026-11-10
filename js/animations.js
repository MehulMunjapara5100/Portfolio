/* ==================================================================
   MEHUL MUNJAPARA — MOTION LAYER
   Built on Motion (motion.dev), the engine formerly known as Framer Motion.
   Motion is kept purposeful and calm:
   - Intro sequence for header + hero, rotating headline phrase
   - Masked word reveals for headings
   - In-view staggered reveals for every section
   - Counters and scroll progress bar
   - Sticky header, mobile menu, FAQ accordion, process timeline
   - Form feedback (error shake, success state)
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

  // Critically damped springs: smooth settle, no bounce
  var ENTER = { type: 'spring', duration: 0.9, bounce: 0 };
  var SMOOTH = { type: 'spring', stiffness: 220, damping: 30 };
  var SNAPPY = { type: 'spring', stiffness: 420, damping: 40 };
  var EASE = [0.22, 1, 0.36, 1];

  document.documentElement.classList.add('motion-ready');

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function assign(a, b) { var o = {}; for (var k in a) o[k] = a[k]; for (var j in b) o[j] = b[j]; return o; }

  // Hand transform ownership to Motion for interactive elements
  function own(els) {
    els.forEach(function (el) { el.classList.add('m-spring'); });
    return els;
  }

  // Run `fn` whenever an element's attribute changes
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
    var from = opts.from || { y: 24 };
    var keyframes = { opacity: [0, 1] };
    if (from.y !== undefined) keyframes.y = [from.y, 0];
    if (from.x !== undefined) keyframes.x = [from.x, 0];

    animate(els, keyframes, assign(ENTER, {
      duration: opts.duration || ENTER.duration,
      delay: stagger(opts.stagger || 0.07, { startDelay: opts.delay || 0 })
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
    return animate(words, { y: ['105%', '0%'] }, {
      type: 'spring',
      duration: 0.9,
      bounce: 0,
      delay: stagger(0.045, { startDelay: delay || 0 })
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
  // 3) INTRO SEQUENCE — HEADER + HERO
  // ---------------------------------------------------------------
  var header = $('#mainHeader');
  var heroHeading = $('.hero-section_heading');
  var heroWords = heroHeading ? splitWords(heroHeading) : [];
  if (heroHeading) {
    heroHeading.querySelectorAll('[data-animate]').forEach(function (l) { l.classList.add('is-visible'); });
  }

  var heroBits = $$('.hero-section_status, .hero-section_description, .hero-section_btn-wrapper, .hero-section_stats');
  var heroImage = $('.hero-section_image');
  var heroCard = $('.hero-section_card');
  var headerBits = header ? $$('.header_logo, .header_nav, .theme-toggle, .header_cta, .header_toggle', header) : [];

  hide(heroBits.concat(heroImage ? [heroImage] : [], heroCard ? [heroCard] : [], headerBits));

  animate(headerBits, { opacity: [0, 1], y: [-8, 0] }, assign(ENTER, { duration: 0.7, delay: stagger(0.05) }))
    .then(function () { settle(headerBits); });

  reveal(heroBits.slice(0, 1), { from: { y: 12 }, delay: 0.1 });
  wordReveal(heroWords, 0.2);
  reveal(heroBits.slice(1), { from: { y: 16 }, delay: 0.5, stagger: 0.09 });

  if (heroImage) {
    animate(heroImage,
      { opacity: [0, 1], clipPath: ['inset(6% 6% 6% 6% round 20px)', 'inset(0% 0% 0% 0% round 20px)'], scale: [1.03, 1] },
      { duration: 1.2, delay: 0.3, ease: EASE }
    ).then(function () {
      settle([heroImage]);
      heroImage.style.clipPath = '';
    });
  }

  if (heroCard) {
    animate(heroCard, { opacity: [0, 1], y: [16, 0] }, assign(ENTER, { delay: 0.9 }))
      .then(function () { settle([heroCard]); });
  }

  // Rotating accent phrase in the headline
  var flipEl = $('[data-flip-words]');
  if (flipEl) {
    var phrases = flipEl.getAttribute('data-flip-words').split('|');
    var flipIndex = 0;
    var flipNext = function () {
      if (document.hidden) return;
      flipIndex = (flipIndex + 1) % phrases.length;
      var old = $$('.m-word__inner', flipEl);
      animate(old, { y: '-105%', opacity: 0 }, { duration: 0.3, ease: [0.4, 0, 1, 1] })
        .then(function () {
          flipEl.textContent = phrases[flipIndex];
          var inners = splitWords(flipEl);
          animate(inners, { y: ['105%', '0%'], opacity: [0, 1] }, assign(ENTER, { duration: 0.7, delay: stagger(0.05) }));
        });
    };
    setTimeout(function () { setInterval(flipNext, 3200); }, 2600);
  }

  // ---------------------------------------------------------------
  // 4) STICKY HEADER
  // ---------------------------------------------------------------
  var ghost = $('#ghostHeader');
  if (ghost) {
    var ghostShown = ghost.classList.contains('header-ghost--visible');
    animate(ghost, { y: ghostShown ? 0 : '-140%', opacity: ghostShown ? 1 : 0 }, { duration: 0 });
    watch(ghost, 'class', function () {
      var show = ghost.classList.contains('header-ghost--visible');
      if (show === ghostShown) return;
      ghostShown = show;
      animate(ghost, { y: show ? 0 : '-140%', opacity: show ? 1 : 0 }, show ? SMOOTH : SNAPPY);
    });
  }

  // ---------------------------------------------------------------
  // 5) MOBILE MENU
  // ---------------------------------------------------------------
  var overlay = $('#headerMobileOverlay');
  var panel = overlay && $('.header_mobile-panel', overlay);
  if (panel) {
    var menuItems = $$('.header_mobile-item, .header_mobile-footer', panel);
    var menuShown = false;
    animate(panel, { x: '100%' }, { duration: 0 });
    watch(overlay, 'class', function () {
      var open = overlay.classList.contains('header_mobile-overlay--open');
      if (open === menuShown) return;
      menuShown = open;
      if (open) {
        animate(panel, { x: 0 }, { type: 'spring', stiffness: 300, damping: 36 });
        animate(menuItems, { opacity: [0, 1], x: [16, 0] }, assign(SMOOTH, { delay: stagger(0.035, { startDelay: 0.1 }) }));
      } else {
        animate(panel, { x: '100%' }, SNAPPY);
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
        duration: 1.6,
        delay: el.closest('.hero-section') ? 0.8 : 0.15,
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
    animate(words, { y: '105%' }, { duration: 0 });

    inView(h2, function () {
      reveal(badge, { from: { y: 8 } });
      wordReveal(words, 0.08);
      reveal(copy, { from: { y: 14 }, delay: 0.3 });
    }, { amount: 0.4 });
  });

  // ---------------------------------------------------------------
  // 8) SECTION CONTENT REVEALS
  // ---------------------------------------------------------------
  onEnter($$('.logo-marquee__viewport'), { from: { y: 0 } });

  onEnter($$('.work-card'), { from: { y: 32 }, stagger: 0.1, amount: 0.2 });

  onEnter($$('.benefit-card'), { from: { y: 28 }, stagger: 0.09 });

  onEnter($$('.why-card'), { from: { y: 24 }, stagger: 0.06 });

  $$('.process-step').forEach(function (step) {
    var icon = $('.process-step_icon', step);
    var card = $('.process-step_card', step);
    hide([icon, card]);
    inView(step, function () {
      animate(icon, { opacity: [0, 1], scale: [0.7, 1] }, SMOOTH)
        .then(function () { settle([icon]); });
      animate(card, { opacity: [0, 1], x: [24, 0] }, assign(ENTER, { delay: 0.06 }))
        .then(function () { settle([card]); });
    }, { amount: 0.5 });

    // Gentle emphasis when the scroll-linked timeline reaches this step
    own([icon]);
    var active = false;
    watch(step, 'class', function () {
      var now = step.classList.contains('is-active');
      if (now === active) return;
      active = now;
      animate(icon, { scale: now ? 1.06 : 1 }, SMOOTH);
    });
  });

  onEnter($$('.expertise-card'), { from: { y: 24 }, stagger: 0.05 });

  onEnter($$('.testimonial-card, .testimonial-trust-card, .testimonial-cta'), { from: { y: 28 }, stagger: 0.08 });

  onEnter($$('.faq-item'), { from: { y: 16 }, stagger: 0.05, duration: 0.7 });

  onEnter($$('.contact-form-card, .contact-info-card'), { from: { y: 28 }, stagger: 0.12, amount: 0.1 });

  onEnter($$('.contact-info-item'), { from: { x: 12 }, stagger: 0.08, delay: 0.3 });

  onEnter($$('.footer__left > *, .footer__pages-menu, .footer__bottom-wrapper'), { from: { y: 16 }, stagger: 0.06 });

  onEnter($$('.footer__wordmark'), { from: { y: 40 }, duration: 1.2, amount: 0.3 });

  // Anything still using data-animate that wasn't handled above
  onEnter($$('[data-animate="fade-up"]').filter(function (el) {
    return !el.classList.contains('is-visible') && el.style.opacity !== '0';
  }), { from: { y: 20 } });

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
        animate(icon, { rotate: 180 }, SMOOTH);
        animate(answer, { height: ['0px', h + 'px'], opacity: [0, 1] }, SMOOTH)
          .then(function () {
            answer.style.height = '';
            answer.style.overflow = '';
            busy = false;
          });
      } else {
        animate(icon, { rotate: 0 }, SMOOTH);
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
        animate(group, { x: [0, -6, 5, -3, 0] }, { duration: 0.35, ease: 'easeOut' });
      }
      hadError = has;
    });
  });

  var success = $('#contact-form-success');
  watch(success, 'hidden', function () {
    if (success.hidden) return;
    animate(success, { opacity: [0, 1], y: [12, 0] }, ENTER);
    var check = $('.contact-form__status-icon', success);
    if (check) animate(check, { scale: [0.6, 1], opacity: [0, 1] }, assign(SMOOTH, { delay: 0.1 }));
  });

  var errorCard = $('#contact-form-error');
  watch(errorCard, 'hidden', function () {
    if (errorCard.hidden) return;
    animate(errorCard, { opacity: [0, 1], y: [-6, 0] }, SNAPPY);
  });

  // ---------------------------------------------------------------
  // 11) THEME TOGGLE FEEDBACK
  // ---------------------------------------------------------------
  var toggles = $$('[data-theme-toggle]');
  document.addEventListener('themechange', function () {
    toggles.forEach(function (t) {
      animate($$('.theme-toggle__icon', t), { rotate: [-60, 0], opacity: [0, 1] }, SMOOTH);
    });
  });
})();
