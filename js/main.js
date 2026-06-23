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
