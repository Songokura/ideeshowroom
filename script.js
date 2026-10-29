/* Idee Showroom - скрипты: герой из плит, шапка, меню, навеска кадров, форма. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hdr = document.getElementById('hdr');
  var hero = document.getElementById('hero');
  var media = document.getElementById('heroMedia');
  var tilesBox = document.getElementById('tiles');
  var dim = document.getElementById('heroDim');

  /* Герой: фасад одевается плитами 1200x600 снизу вверх */
  var lastW = 0, built = false;
  function buildTiles(animate) {
    var W = media.clientWidth, H = media.clientHeight;
    if (!W || !H) return;
    var src = media.dataset.src;
    var iw = +media.dataset.w, ih = +media.dataset.h;
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
        t.className = 'tile' + (animate ? '' : ' on');
        t.style.left = left + 'px';
        t.style.top = top + 'px';
        t.style.width = (right - left) + 'px';
        t.style.height = (bottom - top) + 'px';
        t.style.backgroundImage = 'url(' + src + ')';
        t.style.backgroundSize = bw + 'px ' + bh + 'px';
        t.style.backgroundPosition = (ox - left) + 'px ' + (oy - top) + 'px';
        if (animate) t.style.transitionDelay = ((rows - 1 - r) * 85 + c * 12) + 'ms';
        frag.appendChild(t);
      }
    }
    tilesBox.innerHTML = '';
    tilesBox.appendChild(frag);
    lastW = W;
    if (!animate) { hero.classList.add('on', 'set'); return; }
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
            for (var j = 0; j < all.length; j++) all[j].style.transitionDelay = '';
          }, rows * 85 + 800);
        });
      });
    };
    if (img.decode) img.decode().then(go, go); else img.onload = go;
  }
  buildTiles(!reduce);
  built = true;
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (Math.abs(media.clientWidth - lastW) > 2) buildTiles(false);
    }, 150);
  });

  /* Скролл: шапка и отход героя */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      var hh = hero.offsetHeight || 1;
      hdr.classList.toggle('solid', y > 40);
      hdr.classList.toggle('light', y > hh - 80);
      if (y < hh && !reduce && window.innerWidth > 900) {
        var p = Math.min(1, y / hh);
        media.style.transform = 'translateY(' + (p * 36) + 'px)';
        dim.style.opacity = 1 + p * 0.9;
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

  /* Форма: заявка уходит в WhatsApp с текстом */
  var form = document.getElementById('lead');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = form.phone.value.trim();
      if (phone.replace(/\D/g, '').length < 10) {
        form.phone.focus();
        form.phone.setAttribute('aria-invalid', 'true');
        form.phone.style.borderColor = '#b8503e';
        return;
      }
      var name = form.name.value.trim();
      var obj = form.object.value.trim();
      var text = 'Здравствуйте! Нужен расчёт по объекту.' +
        (name ? '\nИмя: ' + name : '') +
        '\nТелефон: ' + phone +
        (obj ? '\nОбъект: ' + obj : '');
      window.open('https://wa.me/77010001011?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
    form.phone.addEventListener('input', function () {
      form.phone.style.borderColor = '';
      form.phone.removeAttribute('aria-invalid');
    });
  }
})();
