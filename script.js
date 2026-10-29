/* Idee Showroom - скрипты: герой из плит, шапка, меню, навеска кадров, лента, форма. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hdr = document.getElementById('hdr');
  var hero = document.getElementById('hero');
  var media = document.getElementById('heroMedia');
  var tilesBox = document.getElementById('tiles');
  var dim = document.getElementById('heroDim');
  var mobile = function () { return window.innerWidth <= 900; };

  /* Герой: фасад одевается плитами 1200x600 снизу вверх. Только интро, дальше работает <picture>. */
  function skipIntro() {
    hero.classList.add('on', 'set');
  }
  function buildTiles() {
    var W = media.clientWidth, H = media.clientHeight;
    if (!W || !H) return skipIntro();
    var m = mobile();
    var src = m ? media.dataset.srcM : media.dataset.src;
    var iw = +(m ? media.dataset.wm : media.dataset.w), ih = +(m ? media.dataset.hm : media.dataset.h);
    var scale = Math.max(W / iw, H / ih);
    var bw = Math.ceil(iw * scale), bh = Math.ceil(ih * scale);
    var ox = (W - bw) / 2, oy = (H - bh) * 0.5;
    var cols = W >= 600 ? 5 : 3;
    var tw = W / cols, th = tw / 2;
    var rows = Math.ceil(H / th);
    var frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++) {
      var top = Math.round(r * th), bottom = Math.round((r + 1) * th);
      for (var c = 0; c < cols; c++) {
        var left = Math.round(c * tw), right = Math.round((c + 1) * tw);
        var t = document.createElement('div');
        t.className = 'tile';
        t.style.left = left + 'px';
        t.style.top = top + 'px';
        t.style.width = (right - left) + 'px';
        t.style.height = (bottom - top) + 'px';
        t.style.backgroundImage = 'url(' + src + ')';
        t.style.backgroundSize = bw + 'px ' + bh + 'px';
        t.style.backgroundPosition = (ox - left) + 'px ' + (oy - top) + 'px';
        t.style.transitionDelay = ((rows - 1 - r) * 85 + c * 12) + 'ms';
        frag.appendChild(t);
      }
    }
    tilesBox.appendChild(frag);
    var img = new Image();
    img.src = src;
    var go = function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var all = tilesBox.children;
          for (var i = 0; i < all.length; i++) all[i].classList.add('on');
          setTimeout(function () { hero.classList.add('on'); }, (rows - 1) * 85 + 250);
          setTimeout(function () {
            hero.classList.add('set');
            setTimeout(function () { tilesBox.innerHTML = ''; }, 500);
          }, rows * 85 + 800);
        });
      });
    };
    if (img.decode) img.decode().then(go, go); else img.onload = go;
  }
  /* Интро пропускаем при хэше в адресе и если страница уже прокручена (переход из рекламы по якорю). */
  if (reduce || location.hash || (window.scrollY || window.pageYOffset) > 80) skipIntro();
  else buildTiles();

  /* Шапка: тема по секции под ней, отход героя */
  var themed = [].slice.call(document.querySelectorAll('[data-hdr]'));
  var zones = [];
  function measure() {
    zones = themed.map(function (el) {
      return { top: el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset), light: el.dataset.hdr === 'light' };
    });
  }
  measure();
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      var hh = hero.offsetHeight || 1;
      var probe = y + 40;
      var light = false;
      for (var i = 0; i < zones.length; i++) if (zones[i].top <= probe) light = zones[i].light;
      hdr.classList.toggle('solid', y > 40);
      hdr.classList.toggle('light', light);
      if (y < hh && !reduce && !mobile()) {
        var p = Math.min(1, y / hh);
        media.style.transform = 'translateY(' + (p * 36) + 'px)';
        dim.style.opacity = 1 + p * 0.9;
      }
      /* Липкая панель: после половины героя, прячется на форме */
      var form = document.getElementById('lead');
      var ft = form ? form.getBoundingClientRect().top : Infinity;
      document.body.classList.toggle('sticky-on', y > hh * 0.55 && ft > window.innerHeight * 0.6);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', function () { measure(); onScroll(); });
  onScroll();

  /* Пересчёт - только при смене ширины (iOS шлёт resize при сворачивании адресной строки) */
  var lastW = window.innerWidth, rt;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(rt);
    rt = setTimeout(function () { measure(); onScroll(); updateStrips(); }, 150);
  });

  /* Меню */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) menu.removeAttribute('hidden'); else menu.setAttribute('hidden', '');
  }
  burger.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('menu-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
  });

  /* Навеска кадров при появлении */
  var hang = document.querySelectorAll('.hang');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    hang.forEach(function (el) { io.observe(el); });
  } else {
    hang.forEach(function (el) { el.classList.add('in'); });
  }

  /* Ленты со стрелками: шаг в одну карточку, края гаснут, без прокрутки стрелки спрятаны */
  var navs = [].slice.call(document.querySelectorAll('.strip-nav'));
  function stripState(nav) {
    var strip = document.getElementById(nav.dataset.strip);
    if (!strip) return;
    var max = strip.scrollWidth - strip.clientWidth;
    var off = max <= 1;
    nav.classList.toggle('is-off', off);
    var btns = nav.querySelectorAll('.strip-btn');
    btns[0].disabled = off || strip.scrollLeft <= 1;
    btns[1].disabled = off || strip.scrollLeft >= max - 1;
  }
  function updateStrips() { navs.forEach(stripState); }
  navs.forEach(function (nav) {
    var strip = document.getElementById(nav.dataset.strip);
    if (!strip) return;
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('.strip-btn');
      if (!b || b.disabled) return;
      var card = strip.firstElementChild;
      var w = card.getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(strip).columnGap) || 0;
      strip.scrollBy({ left: (w + gap) * +b.dataset.dir, behavior: reduce ? 'auto' : 'smooth' });
    });
    strip.addEventListener('scroll', function () { stripState(nav); }, { passive: true });
    stripState(nav);
  });
  window.addEventListener('load', updateStrips);

  /* Форма: заявка уходит в WhatsApp с текстом (совместимо с LeadBot: настоящий submit, window.open сразу) */
  var form = document.getElementById('lead');
  if (form) {
    var err = document.getElementById('phoneErr');
    var ok = document.getElementById('formOk');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.company && form.company.value) return;
      var phone = form.phone.value.trim();
      if (phone.replace(/\D/g, '').length < 10) {
        form.phone.setAttribute('aria-invalid', 'true');
        err.hidden = false;
        form.phone.focus();
        return;
      }
      var name = form.name.value.trim();
      var obj = form.object.value.trim();
      var text = 'Здравствуйте! Нужен расчёт по объекту.' +
        (name ? '\nИмя: ' + name : '') +
        '\nТелефон: ' + phone +
        (obj ? '\nОбъект: ' + obj : '');
      window.open('https://wa.me/77010001011?text=' + encodeURIComponent(text), '_blank', 'noopener');
      ok.hidden = false;
    });
    form.phone.addEventListener('input', function () {
      form.phone.removeAttribute('aria-invalid');
      err.hidden = true;
    });
  }
})();
