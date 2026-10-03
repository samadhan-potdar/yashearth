/* Yash Earthmovers – interactions & animations (vanilla JS, no dependencies) */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---------- Split headings into masked words ---------- */
  $$('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (word, i) {
      return '<span class="w" aria-hidden="true"><span class="wi" style="--i:' + i + '">' + word + '</span></span>';
    }).join(' ');
    el.classList.add('ready');
  });

  /* ---------- Reveal on scroll ---------- */
  function startAnimations() {
    var targets = $$('[data-split], .fade-up, .fade-left, .fade-right, .img-reveal');
    if (!('IntersectionObserver' in w) || reduce) {
      targets.forEach(function (t) { t.classList.add('in-view'); });
    } else {
      // Clipped image wrappers are watched via their parent so the clip-path never hides them from the observer
      var map = new Map();
      targets.forEach(function (t) {
        var key = t.classList.contains('img-reveal') ? t.parentElement : t;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(t);
      });
      $$('.project.img-reveal').forEach(function (p, i) { p.style.transitionDelay = (i * 120) + 'ms'; });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            map.get(e.target).forEach(function (t) { t.classList.add('in-view'); });
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      map.forEach(function (_, key) { io.observe(key); });
    }
    startCounters();
  }

  /* ---------- Counters ---------- */
  function startCounters() {
    var els = $$('[data-count]');
    function run(el) {
      var end = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (reduce) { el.textContent = end; return; }
      var t0 = null, dur = 1800;
      (function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    }
    if (!('IntersectionObserver' in w)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    els.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }

  /* ---------- Preloader ---------- */
  var pre = $('#preloader');
  var started = false;
  function done() {
    if (started) return; started = true;
    if (pre) pre.classList.add('done');
    setTimeout(startAnimations, reduce ? 0 : 450);
  }
  w.addEventListener('load', function () { setTimeout(done, reduce ? 0 : 1300); });
  setTimeout(done, 3500); // safety net

  /* ---------- Sticky header, back-to-top progress, parallax ---------- */
  var header = $('#header'), toTop = $('#toTop'), ring = $('#toTopRing');
  var parallax = $$('[data-parallax]');
  var ticking = false;
  function onScroll() {
    var y = w.pageYOffset || d.documentElement.scrollTop;
    header.classList.toggle('sticky', y > 80);
    var h = d.documentElement.scrollHeight - w.innerHeight;
    if (ring && h > 0) ring.style.strokeDashoffset = 157 * (1 - Math.min(y / h, 1));
    toTop.classList.toggle('show', y > 600);
    if (!reduce) {
      var vh = w.innerHeight;
      parallax.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var off = (r.top + r.height / 2 - vh / 2) * -0.14;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }
    ticking = false;
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  w.addEventListener('resize', onScroll);
  onScroll();
  toTop.addEventListener('click', function () { w.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Mobile menu ---------- */
  var toggle = $('#menuToggle');
  function setMenu(open) {
    d.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!d.body.classList.contains('menu-open')); });
  $$('.nav-link').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Active nav link on scroll ---------- */
  var links = $$('.nav-link');
  var secs = $$('section[data-nav]');
  if ('IntersectionObserver' in w) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute('data-nav');
        links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { so.observe(s); });
  }

  /* ---------- Custom cursor ---------- */
  var fine = w.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine && !reduce) {
    var dot = $('.cursor-dot'), rg = $('.cursor-ring');
    var mx = 0, my = 0, rx = 0, ry = 0;
    d.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      d.body.classList.add('has-cursor');
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    });
    (function loop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      rg.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(loop);
    })();
    d.addEventListener('mouseover', function (e) {
      rg.classList.toggle('hover', !!e.target.closest('a,button,.project,.g-item,input,select,textarea'));
    });
    d.addEventListener('mouseleave', function () { d.body.classList.remove('has-cursor'); });
  }

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbCount = $('#lbCount');
  var items = $$('.g-item').map(function (a) { return { src: a.getAttribute('href'), alt: $('img', a).alt }; });
  var idx = 0;
  function show(i) {
    idx = (i + items.length) % items.length;
    lbImg.src = items[idx].src; lbImg.alt = items[idx].alt;
    lbCount.textContent = (idx + 1) + ' / ' + items.length;
  }
  function open(i) { show(i); lb.classList.add('open'); d.body.style.overflow = 'hidden'; }
  function close() { lb.classList.remove('open'); d.body.style.overflow = ''; }
  $$('.g-item').forEach(function (a, i) {
    a.addEventListener('click', function (e) { e.preventDefault(); open(i); });
  });
  $$('.project[data-lightbox]').forEach(function (p) {
    p.addEventListener('click', function () {
      var src = p.getAttribute('data-lightbox');
      var i = items.findIndex(function (it) { return it.src === src; });
      open(i < 0 ? 0 : i);
    });
  });
  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', function () { show(idx - 1); });
  $('#lbNext').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  d.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

})();
