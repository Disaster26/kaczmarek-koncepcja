/* Kaczmarek Schody - wersja do wdrozenia (05.11.2026) */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var TYPY = { dyw: 'Schody dywanowe', pol: 'Schody policzkowe', bol: 'Schody bolcowe', sio: 'Schody siodłane', spi: 'Schody spiralne', bet: 'Schody na beton', pod: 'Podwieszane', wst: 'Z wstęgą' };

  /* ---------------- menu */
  var burger = $('burger'), menu = $('menu');
  function ustawMenu(o) {
    menu.classList.toggle('otwarte', o);
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    burger.setAttribute('aria-label', o ? 'Zamknij menu' : 'Otwórz menu');
  }
  burger.addEventListener('click', function () { ustawMenu(!menu.classList.contains('otwarte')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') ustawMenu(false); });
  document.addEventListener('click', function (e) { if (menu.classList.contains('otwarte') && !menu.contains(e.target) && !burger.contains(e.target)) ustawMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('otwarte')) { ustawMenu(false); burger.focus(); } });

  /* ---------------- okna (zdjecie / film): fokus do srodka, powrot do przycisku, Tab w obrebie okna */
  var oknoOtwarte = null, skad = null;
  function otworzOkno(el, fokus) {
    skad = document.activeElement; oknoOtwarte = el;
    el.hidden = false; document.body.style.overflow = 'hidden';
    setTimeout(function () { fokus.focus(); }, 30);
  }
  function zamknijOkno() {
    if (!oknoOtwarte) return;
    oknoOtwarte.hidden = true; oknoOtwarte = null; document.body.style.overflow = '';
    if (skad && skad.focus) skad.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (!oknoOtwarte || e.key !== 'Tab') return;
    var f = [].slice.call(oknoOtwarte.querySelectorAll('button,video[controls],a[href]')).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });

  /* ---------------- lightbox zdjec: lista z przyciskow w .galeria */
  var lb = $('lb'), lbImg = $('lbImg'), lbCap = $('lbCap'), lbNr = $('lbNr');
  var lista = [], poz = 0;
  function pokaz() {
    var z = lista[poz];
    lbImg.src = z.src; lbImg.alt = z.opis;
    lbCap.textContent = z.opis; lbNr.textContent = (poz + 1) + ' / ' + lista.length;
  }
  function otworzZdjecie(l, i) { lista = l; poz = i; pokaz(); otworzOkno(lb, $('lbX')); }
  function krok(d) { poz = (poz + d + lista.length) % lista.length; pokaz(); }
  $('lbX').addEventListener('click', zamknijOkno);
  $('lbPrev').addEventListener('click', function () { krok(-1); });
  $('lbNext').addEventListener('click', function () { krok(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-fig')) zamknijOkno(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') zamknijOkno();
    if (e.key === 'ArrowLeft') krok(-1);
    if (e.key === 'ArrowRight') krok(1);
  });
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) krok(dx < 0 ? 1 : -1);
    x0 = null;
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.galeria button[data-pelne]');
    if (!b) return;
    var przyciski = [].slice.call(b.parentNode.querySelectorAll('button[data-pelne]'));
    var l = przyciski.map(function (x) { return { src: x.getAttribute('data-pelne'), opis: x.getAttribute('data-opis') }; });
    var pelna = galeriaPelna();
    if (pelna && b.parentNode.id === 'galeria') l = pelna;   /* realizacje: caly wynik filtra, nie tylko widoczne */
    otworzZdjecie(l, przyciski.indexOf(b));
  });

  /* ---------------- realizacje.html: filtr i "pokaz wiecej" (pierwsze 10 jest w HTML) */
  var galeria = $('galeria'), wiecej = $('wiecej'), daneEl = $('galeriaDane');
  var DANE = daneEl ? JSON.parse(daneEl.textContent) : null;
  var filtr = 'all', limit = 10;
  var typZAdresu = (location.search.match(/[?&]typ=(\w+)/) || [])[1];
  if (DANE && typZAdresu && TYPY[typZAdresu]) filtr = typZAdresu;
  function wynik() { return DANE.filter(function (z) { return filtr === 'all' || z.t.indexOf(filtr) > -1; }); }
  function galeriaPelna() {
    if (!DANE) return null;
    return wynik().map(function (z) { return { src: 'img/' + z.s + '.webp', opis: z.o }; });
  }
  function el(z) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-pelne', 'img/' + z.s + '.webp');
    b.setAttribute('data-opis', z.o);
    b.setAttribute('aria-label', z.o + ' - powiększ zdjęcie');
    var i = document.createElement('img');
    var duze = z.w > 900;
    i.src = 'img/' + z.s + (duze ? '-800' : '') + '.webp';
    if (duze) { i.srcset = 'img/' + z.s + '-800.webp 800w, img/' + z.s + '.webp ' + z.w + 'w'; i.sizes = '(min-width:1280px) 46vw, (min-width:761px) 31vw, 50vw'; }
    i.alt = z.o; i.width = z.w; i.height = z.h; i.loading = 'lazy'; i.decoding = 'async';
    b.appendChild(i);
    return b;
  }
  function rysuj(odNowa) {
    var l = wynik();
    var obecne = galeria.querySelectorAll('button').length;
    if (odNowa) { galeria.innerHTML = ''; obecne = 0; }
    l.slice(obecne, limit).forEach(function (z) { galeria.appendChild(el(z)); });
    wiecej.hidden = l.length <= limit;
  }
  var chipy = document.querySelectorAll('.chip[data-filtr]');
  function zaznacz(lista, atr, f) {
    lista.forEach(function (x) { var a = x.getAttribute(atr) === f; x.classList.toggle('aktywny', a); x.setAttribute('aria-pressed', a ? 'true' : 'false'); });
  }
  if (DANE) {
    chipy.forEach(function (c) {
      c.addEventListener('click', function () { filtr = c.getAttribute('data-filtr'); limit = 10; zaznacz(chipy, 'data-filtr', filtr); rysuj(true); });
    });
    wiecej.addEventListener('click', function () { limit += 10; rysuj(false); });
    zaznacz(chipy, 'data-filtr', filtr);
    rysuj(filtr !== 'all');
  }
  function pokazChip(c) { if (c && c.parentNode.scrollWidth > c.parentNode.clientWidth) c.parentNode.scrollLeft = c.offsetLeft - c.parentNode.offsetLeft - 16; }
  pokazChip(document.querySelector('.chip[data-filtr].aktywny'));

  /* filtr filmow: ?typ=bet|led|bal */
  var filmy = document.querySelectorAll('#filmySiatka .film');
  var fchipy = document.querySelectorAll('.chip[data-ffiltr]');
  function filtrujFilmy(f) {
    zaznacz(fchipy, 'data-ffiltr', f);
    filmy.forEach(function (x) { x.hidden = f !== 'all' && (' ' + x.getAttribute('data-typy') + ' ').indexOf(' ' + f + ' ') < 0; });
  }
  fchipy.forEach(function (c) { c.addEventListener('click', function () { filtrujFilmy(c.getAttribute('data-ffiltr')); }); });
  if (filmy.length && typZAdresu && document.querySelector('.chip[data-ffiltr="' + typZAdresu + '"]')) {
    filtrujFilmy(typZAdresu);
    pokazChip(document.querySelector('.chip[data-ffiltr="' + typZAdresu + '"]'));
    if (!TYPY[typZAdresu] && !location.hash) $('filmy').scrollIntoView();
  }

  /* ---------------- dolny pasek na telefonie - dopiero po przewinieciu za przyciski hero */
  var mob = $('mob'), akcje = $('heroAkcje') || document.querySelector('.podstrona-tytul'), kontakt = $('kontakt');
  if (mob) {
    var zaAkcjami = !akcje, wKontakcie = false;
    var pasek = function () { mob.classList.toggle('widac', zaAkcjami && !wKontakcie); };
    pasek();
    if ('IntersectionObserver' in window) {
      if (akcje) new IntersectionObserver(function (w) { zaAkcjami = !w[0].isIntersecting && w[0].boundingClientRect.top < 0; pasek(); }).observe(akcje);
      if (kontakt) new IntersectionObserver(function (w) { wKontakcie = w[0].isIntersecting; pasek(); }, { threshold: 0.15 }).observe(kontakt);
    }
  }

  /* ---------------- mapa Google dopiero po kliknieciu */
  var mp = $('mapaPokaz');
  if (mp) mp.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.title = 'Mapa dojazdu - Chocz, ul. Zapłocie 17A';
    f.src = 'https://maps.google.com/maps?q=Zap%C5%82ocie%2017A%2C%2063-313%20Chocz&z=13&output=embed';
    f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    var m = $('mapa'); m.innerHTML = ''; m.appendChild(f); f.focus();
  });

  /* ---------------- formularz: walidacja + wysylka na /wyslij.php (adres w body[data-form]; na podgladzie brak) */
  var form = $('formularz'), info = $('formInfo');
  if (!form) return;
  var cel = document.body.getAttribute('data-form');
  var znacznik = null;
  function pobierzZnacznik() {
    if (!cel || znacznik) return;
    znacznik = fetch(cel + '?znacznik=1', { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { return j.z; }).catch(function () { znacznik = null; return ''; });
  }
  form.addEventListener('focusin', pobierzZnacznik, { once: true });
  function blad(pole, tekst) {
    info.className = 'form-info blad'; info.textContent = tekst;
    if (pole) { pole.setAttribute('aria-invalid', 'true'); pole.focus(); }
  }
  form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });
  form.addEventListener('change', function (e) { if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });
  var TEL_BLAD = 'Nie udało się wysłać. Prosimy zadzwonić: <a href="tel:+48501552195">501 552 195</a> lub napisać na <a href="mailto:biuro@kaczmarekschody.pl">biuro@kaczmarekschody.pl</a>.';
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); });
    var f = form.elements;
    if (!f.imie.value.trim()) return blad(f.imie, 'Proszę podać imię i nazwisko.');
    if (f.tel.value.replace(/\D/g, '').length < 9) return blad(f.tel, 'Proszę podać numer telefonu (min. 9 cyfr).');
    if (f.email.value.trim() && !/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[a-z]{2,}$/i.test(f.email.value.trim())) return blad(f.email, 'Proszę sprawdzić adres e-mail albo zostawić to pole puste.');
    if (!f.zgoda.checked) return blad(f.zgoda, 'Proszę zaznaczyć zgodę na przetwarzanie danych.');
    if (!cel) {
      info.className = 'form-info';
      info.innerHTML = 'To jest podgląd strony - wysyłka formularza zadziała na kaczmarekschody.pl. Teraz prosimy zadzwonić: <a href="tel:+48501552195">501 552 195</a>.';
      return;
    }
    var btn = form.querySelector('button[type=submit]');
    btn.disabled = true; info.className = 'form-info'; info.textContent = 'Wysyłamy...';
    var mail = !!f.email.value.trim();
    pobierzZnacznik();
    Promise.resolve(znacznik).then(function (z) {
      var d = new FormData(form);
      d.append('_z', z || ''); d.append('strona', location.pathname);
      /* znacznik musi miec min. 3 s - przy bardzo szybkim wypelnieniu chwila oczekiwania */
      return new Promise(function (ok) { setTimeout(ok, z && (Date.now() / 1000 - parseInt(z, 10)) < 3.5 ? 3500 : 0); }).then(function () {
        return fetch(cel, { method: 'POST', body: d, credentials: 'same-origin' });
      });
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.success) throw j;
      info.className = 'form-info ok';
      info.textContent = 'Dziękujemy, zapytanie wysłane. Oddzwonimy, aby omówić szczegóły i umówić pomiar.' +
        (mail ? ' Potwierdzenie wysłaliśmy na podany e-mail - jeśli go nie widać, prosimy sprawdzić też folder SPAM.' : '');
      form.reset(); znacznik = null;
    }).catch(function () {
      info.className = 'form-info blad'; info.innerHTML = TEL_BLAD; znacznik = null;
    }).then(function () { btn.disabled = false; });
  });
})();

/* filmy: petle (tryptyk w hero, karta na podstronie) laduja sie po wczytaniu strony, tylko widoczne i przy dobrym polaczeniu;
   pelny film pobiera sie dopiero po kliknieciu */
(function () {
  var petle = [].slice.call(document.querySelectorAll('.petla'));
  function wolno() {
    var c = navigator.connection;
    return (c && (c.saveData || /2g/.test(c.effectiveType || ''))) || matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function startPetli() {
    if (wolno()) return;
    petle.forEach(function (v) {
      if (!v.parentNode.offsetWidth || v.dataset.start) return;
      v.dataset.start = 1;
      v.querySelectorAll('source').forEach(function (s) { s.src = s.getAttribute('data-src'); });
      v.load();
      v.addEventListener('playing', function () { v.classList.add('gra'); }, { once: true });
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
  }
  function poWczytaniu() { setTimeout(startPetli, 300); }
  if (document.readyState === 'complete') poWczytaniu(); else addEventListener('load', poWczytaniu);
  addEventListener('resize', function () { clearTimeout(startPetli.t); startPetli.t = setTimeout(startPetli, 400); });

  var wm = document.getElementById('wm'), wv = document.getElementById('wmV'), wx = document.getElementById('wmX'), skad = null;
  function otworz(el) {
    skad = el;
    wv.poster = el.getAttribute('data-plakat') || '';
    wv.src = el.getAttribute('data-film');
    wv.muted = true;
    wm.hidden = false; document.body.style.overflow = 'hidden';
    petle.forEach(function (v) { v.pause(); });
    var p = wv.play(); if (p && p.catch) p.catch(function () {});
    setTimeout(function () { wx.focus(); }, 30);
  }
  function zamknij() {
    wv.pause(); wv.removeAttribute('src'); wv.load();
    wm.hidden = true; document.body.style.overflow = '';
    petle.forEach(function (v) { if (v.classList.contains('gra')) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
    if (skad) skad.focus();
  }
  document.querySelectorAll('[data-film]').forEach(function (el) { el.addEventListener('click', function () { otworz(el); }); });
  wx.addEventListener('click', zamknij);
  wm.addEventListener('click', function (e) { if (e.target === wm) zamknij(); });
  addEventListener('keydown', function (e) {
    if (wm.hidden) return;
    if (e.key === 'Escape') zamknij();
    if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === wx ? wv : wx).focus(); }
  });
})();

/* naglowek nad zdjeciem przezroczysty, po przewinieciu ciemny; odslanianie zdjec przy przewijaniu */
(function () {
  var hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('wejscie'); }); });
  var top = document.getElementById('top');
  function stan() { top.classList.toggle('przewiniete', scrollY > 40); }
  stan(); addEventListener('scroll', stan, { passive: true });
  var el = document.querySelectorAll('.odslon');
  if (!('IntersectionObserver' in window)) { el.forEach(function (e) { e.classList.add('widac'); }); return; }
  var io = new IntersectionObserver(function (w) {
    w.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('widac'); io.unobserve(x.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  el.forEach(function (e) { io.observe(e); });
})();
