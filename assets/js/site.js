/* AJ The Foot Doc: motion layer.
   Stack mirrors nikolaradeski.com: Lenis smooth scroll + GSAP/ScrollTrigger, plus its signature
   moves — branded preloader with a counter, custom cursor, magnetic buttons, and clip-path image
   reveals. Easing cubic-bezier(.16,1,.3,1) / expo.out confirmed from breedlove.xyz's bundle.
   Everything is guarded for prefers-reduced-motion and coarse-pointer (touch) devices. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  document.documentElement.classList.add('js');

  var hasGsap = typeof gsap !== 'undefined';
  var hasST = hasGsap && typeof ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (typeof Lenis !== 'undefined' && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return 1 - Math.pow(1 - t, 3); } });
    if (hasST) { lenis.on('scroll', ScrollTrigger.update); }
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })();
  }

  /* ---------- Hero entrance (played after the preloader, or immediately) ---------- */
  var heroPlayed = false;
  function playHero() {
    if (heroPlayed) return;
    heroPlayed = true;
    /* Entrance is CSS-driven off the `loaded` class (see style.css). Adding the class is all that
       is needed; content is visible by default and can NEVER get stuck hidden by a throttled/paused
       animation ticker — the earlier GSAP `.from()` approach could, which blanked the hero. */
    document.documentElement.classList.add('loaded');
    /* Scroll-linked drift: photo parallax + credential strip. Both are safe (never hide anything).
       The photo's `y` is independent of the hover-tilt's rotate/scale, so GSAP composes them. */
    if (hasST) {
      var photoEl = document.querySelector('.hero3 .photo-card');
      if (photoEl) gsap.to(photoEl, { y: 55, ease: 'none', scrollTrigger: { trigger: '.hero3', start: 'top top', end: 'bottom top', scrub: .6 } });
      var stripEl = document.querySelector('.cred-strip .track');
      if (stripEl) gsap.to(stripEl, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero3', start: 'top top', end: 'bottom top', scrub: .6 } });
    }
  }

  /* ---------- Preloader: brand mark + 0→100 counter, then wipe up (homepage only, every load) ---------- */
  function runPreloader() {
    var pre = document.getElementById('preloader');
    if (!pre) { playHero(); return; }
    if (reduce || !hasGsap) {
      pre.parentNode && pre.parentNode.removeChild(pre);
      playHero();
      return;
    }
    if (lenis) lenis.stop();
    var numEl = pre.querySelector('.pre-count');
    var barEl = pre.querySelector('.pre-bar span');
    var counter = { v: 0 };
    var tl = gsap.timeline();
    tl.to(counter, {
      v: 100, duration: 1.3, ease: 'power2.inOut',
      onUpdate: function () {
        var n = Math.round(counter.v);
        if (numEl) numEl.textContent = n;
        if (barEl) barEl.style.transform = 'scaleX(' + (n / 100) + ')';
      }
    });
    tl.to('.pre-mark, .pre-count, .pre-bar', { opacity: 0, y: -14, duration: .5, ease: 'power2.in', stagger: .04 }, '+=0.15');
    tl.to(pre, { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '-=0.1');
    tl.add(function () {
      if (lenis) lenis.start();
      pre.parentNode && pre.parentNode.removeChild(pre);
      playHero();
    });
  }

  /* Kick off after the DOM is parsed (not window.load — that waits on every asset). */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(runPreloader, 60); });
  } else {
    setTimeout(runPreloader, 60);
  }
  /* Hard safety: if the preloader's GSAP timeline stalls (e.g. tab backgrounded, throttled rAF),
     force the overlay away so the page can never get stuck behind it. */
  setTimeout(function () {
    var pre = document.getElementById('preloader');
    if (pre && pre.parentNode) pre.parentNode.removeChild(pre);
    if (lenis) lenis.start();
    playHero();
  }, 4000);

  if (reduce) return;

  /* ---------- Scroll reveals ---------- */
  var selectors = [
    '.section-head', '.pillar', '.video-card', '.media-item', '.post-card',
    '.resource-card', '.split > *', '.stats-band > div', '.t-item',
    '.award-list li', '.cta-band', '.faq details', '.connect-card', '.article-head', '.pull-quote'
  ];
  if (hasST) {
    gsap.utils.toArray(selectors.join(',')).forEach(function (el) {
      var siblings = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [el];
      var idx = siblings.indexOf(el);
      gsap.fromTo(el,
        { opacity: 0, y: 52, scale: .96 },
        { opacity: 1, y: 0, scale: 1, duration: .8, ease: 'expo.out', delay: Math.min(idx * .11, .44),
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } });
    });

  }

  /* ---------- Clip-path image reveals (nikola signature): photo un-clips + settles from a slight zoom.
     The animation is a CSS transition (browsers interpolate clip-path reliably; GSAP does NOT — it
     can't tween inset() because the browser normalizes it and the token counts stop matching). The
     trigger is IntersectionObserver, which fires on real viewport intersection independent of Lenis
     and can never leave an image stuck hidden. ---------- */
  if ('IntersectionObserver' in window) {
    /* Observe the UNCLIPPED container, not the image: a fully clip-path'd image reports as
       not-intersecting in Chrome, which would deadlock its own reveal. */
    var clipWraps = document.querySelectorAll('.split-img, .post-card .thumb, .contact-portrait');
    clipWraps.forEach(function (w) { var img = w.querySelector('img'); if (img) img.classList.add('clip-reveal'); });
    var iio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var img = en.target.querySelector('img.clip-reveal');
        if (img) img.classList.add('in');
        iio.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    clipWraps.forEach(function (w) { iio.observe(w); });
  }

  if (!hasST) {
    var els2 = document.querySelectorAll(selectors.join(','));
    els2.forEach(function (el) { el.classList.add('rv'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var sib = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
          el.style.transitionDelay = Math.min(sib.indexOf(el) * 110, 440) + 'ms';
          el.classList.add('in'); io.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els2.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Stat count-up ---------- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var done = false;
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || done) return; done = true; cio.disconnect();
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var t0 = null;
        (function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1300, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4))) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
      });
    }, { threshold: 0.4 });
    cio.observe(el);
  });

  /* ---------- Photo card 3D tilt ---------- */
  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    if (!finePointer) return;
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      if (hasGsap) gsap.to(card, { duration: .5, ease: 'power3.out', rotateY: px * 9, rotateX: -py * 9, scale: 1.03, transformPerspective: 800 });
    });
    card.addEventListener('mouseleave', function () {
      if (hasGsap) gsap.to(card, { duration: .6, ease: 'expo.out', rotateY: 0, rotateX: 0, scale: 1 });
    });
  });

  /* ---------- Magnetic buttons: element pulls toward the cursor ---------- */
  if (hasGsap && finePointer) {
    document.querySelectorAll('.btn, .btn-gold, .btn-ghost, .pillnav a, .pillnav .go, .nav-cta, .cf-submit').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'expo.out' });
      var yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'expo.out' });
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.5);
      });
      el.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Custom cursor: dot + trailing ring, grows over interactive elements ---------- */
  if (hasGsap && finePointer) {
    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.documentElement.classList.add('has-cursor');
    var dx = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' });
    var dy = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
    var rx = gsap.quickTo(ring, 'x', { duration: .38, ease: 'power3' });
    var ry = gsap.quickTo(ring, 'y', { duration: .38, ease: 'power3' });
    window.addEventListener('mousemove', function (e) {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    });
    document.querySelectorAll('a, button, .cf-tabs label, [data-tilt], summary').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.documentElement.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.documentElement.classList.remove('cursor-hover'); });
    });
    window.addEventListener('mousedown', function () { document.documentElement.classList.add('cursor-down'); });
    window.addEventListener('mouseup', function () { document.documentElement.classList.remove('cursor-down'); });
  }
})();
