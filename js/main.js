/* ==================================================================
   MEHUL MUNJAPARA — PORTFOLIO JAVASCRIPT ENGINE
   - Sticky Ghost Header on Scroll
   - Shared Mobile Drawer Menu with Focus Trap & ESC key
   - Character Split Wave-Stagger Reveal Animation
   - IntersectionObserver Viewport Triggers
   - Number Counter Animation
   - Interactive Scroll-Linked Process Timeline
   - Smooth In-Page Anchor Navigation
   ================================================================== */

(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');

  // =========================================================
  // 1) GHOST STICKY HEADER & MOBILE MENU
  // =========================================================
  var ghost = document.getElementById('ghostHeader');
  var overlay = document.getElementById('headerMobileOverlay');
  var toggles = document.querySelectorAll('[data-menu-toggle]');
  var mobileLinks = overlay ? overlay.querySelectorAll('.header_mobile-link, .header_mobile-cta') : [];
  var STICKY_OFFSET = 180;
  var ticking = false;
  var menuOpen = false;

  function updateGhostState() {
    if (!ghost) return;
    var shouldShow = window.scrollY > STICKY_OFFSET;
    ghost.classList.toggle('header-ghost--visible', shouldShow);
    ghost.toggleAttribute('inert', !shouldShow);
    ghost.setAttribute('aria-hidden', String(!shouldShow));
    ticking = false;
  }

  function handleScroll() {
    if (!ticking) {
      requestAnimationFrame(updateGhostState);
      ticking = true;
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  updateGhostState();

  // Mobile menu open / close
  function openMenu() {
    if (!overlay) return;
    menuOpen = true;
    overlay.classList.add('header_mobile-overlay--open');
    toggles.forEach(function (btn) {
      btn.classList.add('header_toggle--active');
      btn.setAttribute('aria-expanded', 'true');
    });
    document.body.classList.add('header_no-scroll');

    setTimeout(function () {
      if (!menuOpen) return;
      var first = overlay.querySelector('.header_mobile-link');
      if (first) first.focus();
    }, 60);
  }

  function closeMenu(focusTarget) {
    if (!overlay) return;
    menuOpen = false;
    overlay.classList.remove('header_mobile-overlay--open');
    toggles.forEach(function (btn) {
      btn.classList.remove('header_toggle--active');
      btn.setAttribute('aria-expanded', 'false');
    });
    document.body.classList.remove('header_no-scroll');
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    }
  }

  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (menuOpen) {
        closeMenu(btn);
      } else {
        openMenu();
      }
    });
  });

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeMenu();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!menuOpen || !overlay) return;
    if (e.key === 'Escape') {
      var visibleToggle = Array.from(toggles).find(function (b) { return b.offsetParent !== null; });
      closeMenu(visibleToggle);
      return;
    }
    if (e.key === 'Tab') {
      var focusables = overlay.querySelectorAll('a[href], button:not([disabled])');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!overlay.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  mobileLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      closeMenu();
    });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1100 && menuOpen) closeMenu();
  });

  // =========================================================
  // 1b) LIGHT / DARK THEME TOGGLE
  // =========================================================
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    docEl.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.setAttribute('content', theme === 'dark' ? '#06080D' : '#F4F5F8');
    try { localStorage.setItem('theme', theme); } catch (e) {}
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }

  if (docEl.getAttribute('data-theme') === 'light' && themeMeta) themeMeta.setAttribute('content', '#F4F5F8');

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = docEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reduced) {
        applyTheme(next);
        return;
      }
      // Circular reveal of the new theme, expanding from the toggle
      var r = btn.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var transition = document.startViewTransition(function () { applyTheme(next); });
      transition.ready.then(function () {
        docEl.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      });
    });
  });

  // =========================================================
  // 2) WAVE-STAGGER & CHARACTER-SPLIT REVEAL ANIMATIONS
  // =========================================================
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DESKTOP_BREAKPOINT = 900;
  var isMobile = window.innerWidth < DESKTOP_BREAKPOINT;
  var DEFAULT_WAVE_STEP = 80;
  var COUNTER_KICKOFF = 150;
  var CHAR_STEP = 24;

  function splitChars(el) {
    var i = 0;
    function walk(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (child) {
        if (child.nodeType === Node.TEXT_NODE) {
          var frag = document.createDocumentFragment();
          // Keep each word in a no-wrap wrapper so lines only break between words
          child.textContent.split(/(\s+)/).forEach(function (token) {
            if (token === '') return;
            if (/^\s+$/.test(token)) {
              frag.appendChild(document.createTextNode(' '));
              return;
            }
            var word = document.createElement('span');
            word.className = 'js-anim-word';
            token.split('').forEach(function (ch) {
              var span = document.createElement('span');
              span.className = 'js-anim-char';
              span.style.setProperty('--i', i);
              span.textContent = ch;
              word.appendChild(span);
              i++;
            });
            frag.appendChild(word);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    }
    walk(el);
    return i;
  }

  function animateCount(el, delay) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = parseInt(el.getAttribute('data-count-duration') || '1200', 10);

    setTimeout(function () {
      if (prefersReducedMotion) {
        el.textContent = target + suffix;
        return;
      }
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        el.textContent = Math.floor(progress * target) + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target + suffix;
        }
      }
      requestAnimationFrame(step);
    }, Math.max(delay, 0));
  }

  function instantReveal(group) {
    group.querySelectorAll('[data-animate]').forEach(function (el) {
      el.classList.add('is-visible');
    });
    group.querySelectorAll('[data-count-to]').forEach(function (el) {
      var target = el.getAttribute('data-count-to');
      var suffix = el.getAttribute('data-suffix') || '';
      el.textContent = target + suffix;
    });
  }

  function runGroup(group) {
    if (prefersReducedMotion) {
      instantReveal(group);
      return;
    }

    var waveStep = parseInt(group.getAttribute('data-animate-wave') || String(DEFAULT_WAVE_STEP), 10);
    var items = Array.prototype.slice.call(group.querySelectorAll('[data-animate]'));

    items.forEach(function (el, autoIndex) {
      var type = el.getAttribute('data-animate');
      var idxAttr = el.getAttribute('data-animate-index');
      var index = idxAttr !== null && idxAttr !== '' ? parseFloat(idxAttr) : autoIndex;
      var extraDelay = parseInt(el.getAttribute('data-animate-delay') || '0', 10);
      var startAt = Math.max(index * waveStep + extraDelay, 0);

      if (type === 'chars' && !isMobile) {
        splitChars(el);
        var chars = el.querySelectorAll('.js-anim-char');
        chars.forEach(function (c, ci) {
          setTimeout(function () {
            c.classList.add('is-visible');
          }, startAt + ci * CHAR_STEP);
        });
      } else {
        if (type === 'chars') {
          el.classList.add('is-visible');
        } else {
          setTimeout(function () {
            el.classList.add('is-visible');
          }, startAt);
        }
      }

      var counters = el.hasAttribute('data-count-to') ? [el] : el.querySelectorAll('[data-count-to]');
      counters.forEach(function (c, ci) {
        animateCount(c, startAt + COUNTER_KICKOFF + ci * 60);
      });
    });
  }

  var groups = document.querySelectorAll('[data-animate-group]');
  if (window.Motion && !prefersReducedMotion) {
    // Reveals and counters are driven by js/animations.js
  } else if (!('IntersectionObserver' in window)) {
    groups.forEach(instantReveal);
  } else {
    groups.forEach(function (group) {
      var rawThreshold = parseFloat(group.getAttribute('data-animate-threshold') || '0.2');
      function safeThreshold() {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var groupH = group.getBoundingClientRect().height || vh;
        var maxSafe = Math.min(1, (vh / groupH) * 0.85);
        return Math.min(rawThreshold, maxSafe);
      }

      var threshold = safeThreshold();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runGroup(group);
            io.disconnect();
          }
        });
      }, { threshold: threshold, rootMargin: '0px 0px -8% 0px' });
      io.observe(group);
    });
  }

  // =========================================================
  // 3) SCROLL-LINKED PROCESS TIMELINE (DYNAMIC PROGRESS FILL)
  // =========================================================
  var list = document.querySelector('[data-process-list]');
  if (list) {
    var track = list.querySelector('[data-process-track]');
    var fill = list.querySelector('[data-process-fill]');
    var steps = Array.prototype.slice.call(list.querySelectorAll('[data-process-step]'));

    if (track && fill && steps.length) {
      if (prefersReducedMotion) {
        steps.forEach(function (step) { step.classList.add('is-active'); });
        fill.style.height = '100%';
      } else {
        var icons = steps.map(function (step) { return step.querySelector('[data-process-icon]'); });
        var processTicking = false;
        var resizeTimer = null;

        function measureTrack() {
          var listRect = list.getBoundingClientRect();
          var firstRect = icons[0].getBoundingClientRect();
          var lastRect = icons[icons.length - 1].getBoundingClientRect();
          var top = (firstRect.top + firstRect.height / 2) - listRect.top;
          var bottom = (lastRect.top + lastRect.height / 2) - listRect.top;
          track.style.top = top + 'px';
          track.style.height = Math.max(bottom - top, 0) + 'px';
        }

        function updateProcess() {
          processTicking = false;
          var triggerY = window.innerHeight * 0.5;
          var trackRect = track.getBoundingClientRect();

          var progress = trackRect.height > 0
            ? (triggerY - trackRect.top) / trackRect.height
            : 0;
          progress = Math.min(Math.max(progress, 0), 1);

          fill.style.height = (progress * 100) + '%';

          icons.forEach(function (icon, i) {
            var rect = icon.getBoundingClientRect();
            var center = rect.top + rect.height / 2;
            steps[i].classList.toggle('is-active', center <= triggerY);
          });
        }

        function onProcessScroll() {
          if (!processTicking) {
            processTicking = true;
            requestAnimationFrame(updateProcess);
          }
        }

        function onProcessResize() {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function () {
            measureTrack();
            updateProcess();
          }, 120);
        }

        measureTrack();
        updateProcess();
        window.addEventListener('scroll', onProcessScroll, { passive: true });
        window.addEventListener('resize', onProcessResize);
      }
    }
  }

  // =========================================================
  // 4) SMOOTH SCROLLING FOR IN-PAGE ANCHORS
  // =========================================================
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (href === '#' || href === '') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var headerOffset = 90;
        var elementPosition = target.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        if (window.Motion && !prefersReducedMotion) {
          // Eased scroll via Motion; any user scroll input cancels it
          var startY = window.pageYOffset;
          var distance = Math.abs(offsetPosition - startY);
          var scrollAnim = window.Motion.animate(startY, offsetPosition, {
            duration: Math.min(1.6, 0.6 + distance / 4000),
            ease: [0.65, 0, 0.35, 1],
            onUpdate: function (v) { window.scrollTo(0, v); }
          });
          var cancel = function () {
            scrollAnim.stop();
            window.removeEventListener('wheel', cancel);
            window.removeEventListener('touchstart', cancel);
          };
          window.addEventListener('wheel', cancel, { passive: true });
          window.addEventListener('touchstart', cancel, { passive: true });
          scrollAnim.then(cancel);
        } else {
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });

  // =========================================================
  // 5) FORMSPREE AJAX CONTACT FORM & INTERACTIVE VALIDATION
  // =========================================================
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var nameInput = document.getElementById('contact-name');
    var emailInput = document.getElementById('contact-email');
    var projectTypeSelect = document.getElementById('contact-project-type');
    var budgetSelect = document.getElementById('contact-budget');
    var messageInput = document.getElementById('contact-message');
    var submitBtn = document.getElementById('contact-submit-btn');
    var submitText = submitBtn ? submitBtn.querySelector('.contact-form__submit-text') : null;
    var successCard = document.getElementById('contact-form-success');
    var errorCard = document.getElementById('contact-form-error');
    var resetBtn = document.getElementById('contact-form-reset-btn');

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setFieldError(input, errorId, message) {
      var group = input.closest('.contact-form__group');
      var errorEl = document.getElementById(errorId);
      if (group) group.classList.add('has-error');
      if (errorEl) {
        if (message) errorEl.textContent = message;
        errorEl.style.display = 'block';
      }
    }

    function clearFieldError(input, errorId) {
      var group = input.closest('.contact-form__group');
      var errorEl = document.getElementById(errorId);
      if (group) group.classList.remove('has-error');
      if (errorEl) errorEl.style.display = 'none';
    }

    // Attach real-time input listeners to clear errors on change
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        if (nameInput.value.trim() !== '') clearFieldError(nameInput, 'name-error');
      });
    }
    if (emailInput) {
      emailInput.addEventListener('input', function () {
        if (emailRegex.test(emailInput.value.trim())) clearFieldError(emailInput, 'email-error');
      });
    }
    if (projectTypeSelect) {
      projectTypeSelect.addEventListener('change', function () {
        if (projectTypeSelect.value !== '') clearFieldError(projectTypeSelect, 'project-type-error');
      });
    }
    if (messageInput) {
      messageInput.addEventListener('input', function () {
        if (messageInput.value.trim() !== '') clearFieldError(messageInput, 'message-error');
      });
    }

    // Form submit handler with AJAX Formspree endpoint
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var hasError = false;
      var firstInvalid = null;

      // Validate Name
      if (!nameInput || nameInput.value.trim() === '') {
        setFieldError(nameInput, 'name-error', 'Please enter your name.');
        hasError = true;
        if (!firstInvalid) firstInvalid = nameInput;
      } else {
        clearFieldError(nameInput, 'name-error');
      }

      // Validate Email
      if (!emailInput || emailInput.value.trim() === '') {
        setFieldError(emailInput, 'email-error', 'Please enter your email.');
        hasError = true;
        if (!firstInvalid) firstInvalid = emailInput;
      } else if (!emailRegex.test(emailInput.value.trim())) {
        setFieldError(emailInput, 'email-error', 'Please enter a valid email address.');
        hasError = true;
        if (!firstInvalid) firstInvalid = emailInput;
      } else {
        clearFieldError(emailInput, 'email-error');
      }

      // Validate Project Type
      if (!projectTypeSelect || projectTypeSelect.value === '') {
        setFieldError(projectTypeSelect, 'project-type-error', 'Please select a project type.');
        hasError = true;
        if (!firstInvalid) firstInvalid = projectTypeSelect;
      } else {
        clearFieldError(projectTypeSelect, 'project-type-error');
      }

      // Validate Message
      if (!messageInput || messageInput.value.trim() === '') {
        setFieldError(messageInput, 'message-error', 'Please enter a message.');
        hasError = true;
        if (!firstInvalid) firstInvalid = messageInput;
      } else {
        clearFieldError(messageInput, 'message-error');
      }

      if (hasError) {
        if (firstInvalid && typeof firstInvalid.focus === 'function') {
          firstInvalid.focus();
        }
        return;
      }

      // Disable button & show spinner
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-submitting');
        if (submitText) submitText.textContent = 'Sending message...';
      }
      if (errorCard) errorCard.hidden = true;

      var formData = new FormData(contactForm);

      fetch('https://formspree.io/f/mbgdweby', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(function (response) {
          if (response.ok) {
            contactForm.reset();
            contactForm.style.display = 'none';
            if (successCard) {
              successCard.hidden = false;
              successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          } else {
            return response.json().then(function (data) {
              var errorMsg = 'Oops! There was a problem submitting your form. Please try again or email munjapara525@gmail.com.';
              if (data && data.errors && data.errors.length > 0) {
                errorMsg = data.errors.map(function (err) { return err.message; }).join(', ');
              }
              if (errorCard) {
                var errP = errorCard.querySelector('.contact-form__status-error-text');
                if (errP) errP.textContent = errorMsg;
                errorCard.hidden = false;
              }
            });
          }
        })
        .catch(function () {
          if (errorCard) {
            var errP = errorCard.querySelector('.contact-form__status-error-text');
            if (errP) errP.textContent = 'Network error. Please check your internet connection or email directly at munjapara525@gmail.com.';
            errorCard.hidden = false;
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-submitting');
            if (submitText) submitText.textContent = 'Send message';
          }
        });
    });

    // Reset button to allow sending another message
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (successCard) successCard.hidden = true;
        if (errorCard) errorCard.hidden = true;
        contactForm.style.display = 'flex';
        if (nameInput) nameInput.focus();
      });
    }
  }

})();
