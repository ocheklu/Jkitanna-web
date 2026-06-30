/* Mobile navigation toggle */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var open = nav.getAttribute('data-open') === 'true';
    nav.setAttribute('data-open', String(!open));
    toggle.setAttribute('aria-expanded', String(!open));
  });

  // Close the menu when a link is tapped (single-page anchors / navigation)
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      nav.setAttribute('data-open', 'false');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* Credential badge — tap to unfold its detail (matters on touch; desktop hovers) */
(function () {
  var badges = document.querySelectorAll('.cred-badge--info');
  for (var i = 0; i < badges.length; i++) {
    badges[i].addEventListener('click', function () {
      var open = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!open));
    });
  }
})();

/* Contact channels — tap an icon to reveal its detail */
(function () {
  var channels = document.querySelectorAll('.contact-channels .channel');
  if (!channels.length) return;

  channels.forEach(function (channel) {
    var btn = channel.querySelector('.channel__btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = channel.getAttribute('data-open') === 'true';
      // Close any other open channel for a calm, single-focus reveal.
      channels.forEach(function (other) {
        if (other !== channel) {
          other.setAttribute('data-open', 'false');
          var b = other.querySelector('.channel__btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
      channel.setAttribute('data-open', String(!open));
      btn.setAttribute('aria-expanded', String(!open));
    });
  });
})();

/* Contact form — submit via fetch so the visitor stays on the page and
   sees a gentle confirmation instead of the Formspree redirect. */
(function () {
  var form = document.querySelector('.contact-form');
  if (!form || !window.fetch) return; // no JS/fetch → normal POST + redirect

  var status = document.createElement('p');
  status.className = 'contact-form__status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;
  form.appendChild(status);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var submit = form.querySelector('.contact-form__submit');

    status.hidden = true;
    status.classList.remove('is-error');
    if (submit) submit.disabled = true;

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        // Replace the fields with a calm thank-you note, but keep the card's
        // height so the page doesn't collapse to a short, cramped layout.
        form.style.minHeight = form.offsetHeight + 'px';
        form.classList.add('is-sent');
        form.reset();
        Array.prototype.forEach.call(form.children, function (child) {
          // Inline display:none beats class rules like .btn { display:inline-flex }
          // that would otherwise keep the submit button visible.
          if (child !== status) child.style.display = 'none';
        });
        status.textContent = form.dataset.success || 'Спасибо! Заявка отправлена.';
        status.hidden = false;
      } else {
        return res.json().then(function (data) {
          throw new Error(data && data.error ? data.error : 'error');
        });
      }
    }).catch(function () {
      if (submit) submit.disabled = false;
      status.textContent = form.dataset.error || 'Что-то пошло не так. Напишите, пожалуйста, на почту.';
      status.classList.add('is-error');
      status.hidden = false;
    });
  });
})();

/* Reviews — testimonials start as a three-line teaser; tap to unfold the rest. */
(function () {
  var cards = document.querySelectorAll('.review');
  if (!cards.length) return;

  var aria = {
    ru: ['развернуть отзыв', 'свернуть отзыв'],
    lt: ['išskleisti atsiliepimą', 'suskleisti atsiliepimą'],
    en: ['expand review', 'collapse review']
  };
  var A = aria[(document.documentElement.lang || 'ru').slice(0, 2)] || aria.ru;

  cards.forEach(function (card) {
    var text = card.querySelector('.review__text');
    var author = card.querySelector('.review__author');
    if (!text) return;

    // Teaser = three lines of the body copy.
    var lineH = parseFloat(getComputedStyle(text).lineHeight) || 28;
    var collapsed = Math.round(lineH * 3);

    // Leave short reviews fully open — only fold the ones that overflow.
    if (text.scrollHeight <= collapsed + 8) return;

    card.classList.add('is-collapsible');
    text.style.maxHeight = collapsed + 'px';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'review__toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', A[0]);
    btn.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

    btn.addEventListener('click', function () {
      var open = card.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? A[1] : A[0]);
      text.style.maxHeight = open ? text.scrollHeight + 'px' : collapsed + 'px';
    });

    // Toggle sits below the name, so an open card reads text → name → fold arrow.
    if (author) author.insertAdjacentElement('afterend', btn);
    else card.appendChild(btn);
  });
})();

/* Reviews — reveal the "leave a review" form on request. */
(function () {
  var toggle = document.querySelector('.review-invite__toggle');
  var form = document.getElementById('review-form');
  if (!toggle || !form) return;

  toggle.addEventListener('click', function () {
    form.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.hidden = true;
    var first = form.querySelector('input:not([type=hidden]), textarea');
    if (first) first.focus();
  });
})();

/* Gentle reveal of content as it scrolls into view */
(function () {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  // Mark the document ready so the hidden state in CSS kicks in. If JS or
  // IntersectionObserver is unavailable, content simply stays visible.
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('reveal-ready');

  // Stagger siblings within the same parent for a soft, flowing cascade.
  items.forEach(function (el) {
    var parent = el.parentNode;
    var group = parent ? parent.querySelectorAll(':scope > [data-reveal]') : [el];
    var index = Array.prototype.indexOf.call(group, el);
    el.style.setProperty('--reveal-delay', (Math.max(index, 0) * 0.1) + 's');
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  items.forEach(function (el) { observer.observe(el); });
})();
