/* Kaczmarek Schody - "stopien po stopniu" (06.11.2026) */
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
    var b = e.target.closest && e.target.closest('[data-lb] button[data-pelne]');
    if (!b) return;
    var box = b.closest('[data-lb]');
    var przyciski = [].slice.call(box.querySelectorAll('button[data-pelne]'));
    var l = przyciski.map(function (x) { return { src: x.getAttribute('data-pelne'), opis: x.getAttribute('data-opis') }; });
    var pelna = galeriaPelna();
    if (pelna && box.id === 'galeria') l = pelna;   /* realizacje: caly wynik filtra, nie tylko widoczne */
    otworzZdjecie(l, przyciski.indexOf(b));
  });

  /* ---------------- realizacje.html: filtr i "pokaz wiecej" (pierwsze 10 jest w HTML) */
  var galeria = $('galeria'), wiecej = $('wiecej'), daneEl = $('galeriaDane');
  var DANE = daneEl ? JSON.parse(daneEl.textContent) : null;
  var filtr = 'all', limit = 12;
  var typZAdresu = (location.search.match(/[?&]typ=(\w+)/) || [])[1];
  if (DANE && typZAdresu && TYPY[typZAdresu]) filtr = typZAdresu;
  function wynik() { return DANE.filter(function (z) { return filtr === 'all' || z.t.indexOf(filtr) > -1; }); }
  function galeriaPelna() {
    if (!DANE) return null;
    return wynik().map(function (z) { return { src: z.u || 'img/' + z.s + '.webp', opis: z.o }; });
  }
  function el(z) {
    if (z.u) return elDodane(z);
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-pelne', 'img/' + z.s + '.webp');
    b.setAttribute('data-opis', z.o);
    b.setAttribute('aria-label', z.o + ' - powiększ zdjęcie');
    var i = document.createElement('img');
    var war = [640, 960, 1280].filter(function (t) { return z.w > t * 1.12; });
    i.src = 'img/' + z.s + (war.length ? '-' + (war.indexOf(960) > -1 ? 960 : war[war.length - 1]) : '') + '.webp';
    if (war.length) { i.srcset = war.map(function (t) { return 'img/' + z.s + '-' + t + '.webp ' + t + 'w'; }).concat('img/' + z.s + '.webp ' + z.w + 'w').join(', '); i.sizes = '(min-width:1280px) 420px, (min-width:761px) 31vw, 50vw'; }
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
      c.addEventListener('click', function () { filtr = c.getAttribute('data-filtr'); limit = 12; zaznacz(chipy, 'data-filtr', filtr); rysuj(true); });
    });
    wiecej.addEventListener('click', function () { limit += 12; rysuj(false); });
    zaznacz(chipy, 'data-filtr', filtr);
    rysuj(filtr !== 'all');
  }
  function pokazChip(c) { if (c && c.parentNode.scrollWidth > c.parentNode.clientWidth) c.parentNode.scrollLeft = c.offsetLeft - c.parentNode.offsetLeft - 16; }
  pokazChip(document.querySelector('.chip[data-filtr].aktywny'));

  /* ---------------- zdjecia z panelu WordPress "Zdjecia realizacji" (tylko wersja na kaczmarekschody.pl: <body data-zdjecia>)
     dodane: na poczatku galerii Realizacje i na podstronie danego rodzaju; ukryte: znikaja ze wszystkich galerii */
  function elDodane(z) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('data-pelne', z.u);
    b.setAttribute('data-opis', z.o);
    b.setAttribute('aria-label', z.o + ' - powiększ zdjęcie');
    var i = document.createElement('img');
    i.src = z.m || z.u;
    if (z.ss) { i.srcset = z.ss; i.sizes = '(min-width:1280px) 420px, (min-width:761px) 31vw, 50vw'; }
    i.alt = z.o; if (z.w && z.h) { i.width = z.w; i.height = z.h; } i.loading = 'lazy'; i.decoding = 'async';
    b.appendChild(i);
    return b;
  }
  var zrodloZdjec = document.body.getAttribute('data-zdjecia');
  if (zrodloZdjec && window.fetch) {
    fetch(zrodloZdjec, { cache: 'no-cache', credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || typeof j !== 'object') return;
      var ukryte = Array.isArray(j.ukryte) ? j.ukryte.filter(function (n) { return /^[a-z0-9-]+$/.test(n); }) : [];
      var dodane = (Array.isArray(j.dodane) ? j.dodane : []).filter(function (z) {
        return z && typeof z.u === 'string' && /^(https?:)?\/\//.test(z.u) && Array.isArray(z.t);
      }).map(function (z) { return { u: z.u, m: z.m, ss: typeof z.ss === 'string' ? z.ss : '', w: +z.w || 0, h: +z.h || 0, o: String(z.o || 'Realizacja Kaczmarek Schody'), t: z.t }; });
      if (!ukryte.length && !dodane.length) return;
      if (ukryte.length) {
        document.querySelectorAll('[data-lb] button[data-pelne]').forEach(function (b) {
          var m = (b.getAttribute('data-pelne') || '').match(/(?:^|\/)img\/([a-z0-9-]+)\.webp$/);
          if (m && ukryte.indexOf(m[1]) > -1 && b.closest('[data-lb]').querySelectorAll('button[data-pelne]').length > 1) (b.closest('.rp') || b).remove();   /* karta nigdy nie zostaje pusta */
        });
      }
      if (DANE) {
        DANE = dodane.concat(DANE.filter(function (z) { return ukryte.indexOf(z.s) < 0; }));
        rysuj(true);
      }
      document.querySelectorAll('.galeria[data-typ]').forEach(function (g) {
        var typ = g.getAttribute('data-typ'), pierwszy = g.firstChild;
        dodane.filter(function (z) { return z.t.indexOf(typ) > -1; }).forEach(function (z) { g.insertBefore(elDodane(z), pierwszy); });
      });
    }).catch(function () {});
  }

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

  /* ---------------- zgoda na cookies (12 miesiecy: localStorage + cookie ks_zgoda): mapa Google + Statystyki (GA4) */
  var ZG = 'ks_zgoda', DNI = 365;
  // Google Analytics 4 ze starej strony (Site Kit: tag Google GT-PBGJ6ZSK -> strumien G-BPENWEQQ2M).
  // Consent Mode v2: domyslnie odmowa (skrypt w <head>), gtag.js wczytuje sie dopiero po zgodzie na "Statystyki".
  // Na podgladzie (github.io, localhost) tag sie nie laduje, zeby nie liczyc testow w statystykach klienta.
  var GA = 'G-BPENWEQQ2M', gaJest = false;
  var PODGLAD = /(^|\.)github\.io$/i.test(location.hostname) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:';
  function gaZastosuj(z) {
    if (!window.gtag) return;
    var tak = !!(z && z.stat);
    window.gtag('consent', 'update', { analytics_storage: tak ? 'granted' : 'denied' });
    if (tak && !gaJest) {
      gaJest = true;
      if (PODGLAD && !/[?&]ga-test=1(&|$)/.test(location.search)) return;
      var sc = document.createElement('script');
      sc.async = true; sc.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
      document.head.appendChild(sc);
      window.gtag('js', new Date());
      window.gtag('config', GA);
    }
    if (!tak) {   // cofniecie zgody: usun pliki _ga
      var host = location.hostname.replace(/^www\./, '');
      document.cookie.split(';').forEach(function (c) {
        var n = c.split('=')[0].trim();
        if (/^(_ga|_gid|_gat)/.test(n)) ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) { document.cookie = n + '=; Max-Age=0; path=/' + d; });
      });
    }
  }
  function zgodaCzytaj() {
    try { var z = JSON.parse(localStorage.getItem(ZG) || 'null'); if (z && z.t && (Date.now() - z.t) < DNI * 864e5) return z; } catch (err) {}
    var m = document.cookie.match(/(?:^|; )ks_zgoda=([^;]+)/);
    if (m) { var a = decodeURIComponent(m[1]).split('|'); return { mapy: a[0] === '1', t: +a[1] || Date.now(), stat: a[2] === '1' }; }
    return null;
  }
  var ZGODA = zgodaCzytaj(), ck = $('ck');
  var mapaZaslona = $('mapa') ? $('mapa').innerHTML : '';
  function mapaWstaw() {
    var m = $('mapa'); if (!m || m.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.title = 'Mapa dojazdu - Chocz, ul. Zapłocie 17A';
    f.src = 'https://maps.google.com/maps?q=Zap%C5%82ocie%2017A%2C%2063-313%20Chocz&z=13&hl=pl&output=embed';
    f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    f.setAttribute('loading', 'lazy');
    m.innerHTML = ''; m.appendChild(f);
  }
  function podepnijPokaz() {
    var mp = $('mapaPokaz');
    if (mp) mp.addEventListener('click', function () { var z = ZGODA || {}; z.mapy = true; zgodaZapisz(z); banerZamknij(); });
  }
  function zastosuj() {
    gaZastosuj(ZGODA);
    var m = $('mapa'); if (!m) return;
    if (ZGODA && ZGODA.mapy) mapaWstaw();
    else if (m.querySelector('iframe')) { m.innerHTML = mapaZaslona; podepnijPokaz(); }
  }
  function zgodaZapisz(z) {
    z.t = Date.now();
    try { localStorage.setItem(ZG, JSON.stringify(z)); } catch (err) {}
    document.cookie = ZG + '=' + encodeURIComponent((z.mapy ? '1' : '0') + '|' + z.t + '|' + (z.stat ? '1' : '0')) + '; max-age=' + (DNI * 86400) + '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    var bylGa = gaJest && !z.stat;
    ZGODA = z; zastosuj();
    if (bylGa && !PODGLAD) location.reload();   // GA byl juz wczytany - przeladowanie, zeby przestal dzialac
  }
  function banerPokaz(ust) {
    if (!ck) return;
    ck.hidden = false;
    $('ckMapy').checked = !!(ZGODA && ZGODA.mapy);
    $('ckStat').checked = !!(ZGODA && ZGODA.stat);
    $('ckUst').hidden = !ust;
    ck.querySelector('[data-ck="zapisz"]').hidden = !ust;
    ck.querySelector('[data-ck="ustawienia"]').hidden = !!ust;
    ck.querySelector('[data-ck="ustawienia"]').setAttribute('aria-expanded', ust ? 'true' : 'false');
  }
  function banerZamknij() { if (ck) ck.hidden = true; }
  if (ck) {
    ck.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) return;
      var a = b.getAttribute('data-ck');
      if (a === 'wszystkie') { zgodaZapisz({ mapy: true, stat: true }); banerZamknij(); }
      else if (a === 'niezbedne') { zgodaZapisz({ mapy: false, stat: false }); banerZamknij(); }
      else if (a === 'ustawienia') { banerPokaz(true); $('ckStat').focus(); }
      else if (a === 'zapisz') { zgodaZapisz({ mapy: $('ckMapy').checked, stat: $('ckStat').checked }); banerZamknij(); }
    });
    if (!ZGODA) banerPokaz(false);
  }
  document.querySelectorAll('[data-cookies-ustaw]').forEach(function (b) { b.addEventListener('click', function () { banerPokaz(true); }); });
  podepnijPokaz();
  zastosuj();
  document.querySelectorAll('[data-rok]').forEach(function (x) { x.textContent = new Date().getFullYear(); });

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

/* leniwe obrazy (data-src) - ladowane ok. 1 ekran przed wejsciem w widok, w karuzelach takze w poziomie */
(function () {
  var el = [].slice.call(document.querySelectorAll('img[data-lz]'));
  function laduj(i) {
    if (i.getAttribute('data-srcset')) i.srcset = i.getAttribute('data-srcset');
    if (i.getAttribute('data-src')) i.src = i.getAttribute('data-src');
    i.removeAttribute('data-lz');
  }
  if (!('IntersectionObserver' in window)) { el.forEach(laduj); return; }
  var io = new IntersectionObserver(function (w) {
    w.forEach(function (x) { if (x.isIntersecting) { laduj(x.target); io.unobserve(x.target); } });
  }, { rootMargin: '500px 600px' });
  el.forEach(function (i) { io.observe(i); });
  /* karuzela: przy pierwszym dotyku / przewinieciu / strzalce doladuj jej pozostale zdjecia (sa przyciete przez pas, wiec IO ich nie widzi) */
  document.querySelectorAll('[data-tor]').forEach(function (t) {
    function wszystkie() { t.querySelectorAll('img[data-lz]').forEach(function (i) { laduj(i); io.unobserve(i); }); }
    ['pointerdown', 'touchstart', 'mouseenter', 'focusin'].forEach(function (ev) { t.addEventListener(ev, wszystkie, { once: true, passive: true }); });
    t.querySelector('.tor-pas').addEventListener('scroll', wszystkie, { once: true, passive: true });
  });
  /* powiekszenie: przed otwarciem doladuj */
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('button[data-pelne]'); if (b) { var i = b.querySelector('img[data-lz]'); if (i) laduj(i); } }, true);
})();

/* karuzele: przewijanie palcem (natywnie), przeciaganie mysza, strzalki, licznik; przeciagniecie nie klika */
(function () {
  document.querySelectorAll('[data-tor]').forEach(function (t) {
    var pas = t.querySelector('.tor-pas'), wst = t.querySelector('.tor-wst'), dal = t.querySelector('.tor-dal'), licz = t.querySelector('.tor-licz');
    var el = pas.children, n = el.length;
    function cele() { var o = el[0].offsetLeft, m = pas.scrollWidth - pas.clientWidth; return [].map.call(el, function (x) { return Math.min(m, x.offsetLeft - o); }); }
    function nr() { var c = cele(), b = 0; c.forEach(function (v, i) { if (Math.abs(v - pas.scrollLeft) < Math.abs(c[b] - pas.scrollLeft)) b = i; }); return b; }
    function stan() {
      var max = pas.scrollWidth - pas.clientWidth - 2;
      if (wst) wst.disabled = pas.scrollLeft <= 2;
      if (dal) dal.disabled = pas.scrollLeft >= max;
      if (licz) licz.textContent = (nr() + 1) + ' / ' + n;
    }
    function idz(d) {
      var c = cele(), x = pas.scrollLeft, w = pas.clientWidth, cel;
      if (d > 0) { cel = c.filter(function (v, i) { return v > x + 4 && (c[i] + el[i].offsetWidth > x + w - 4 || v >= x + w * 0.5); })[0]; if (cel === undefined) cel = c[c.length - 1]; }
      else { var p = c.filter(function (v) { return v < x - 4 && v >= x - w; }); cel = p.length ? p[0] : (c.filter(function (v) { return v < x - 4; }).pop() || 0); }
      pas.scrollTo({ left: cel, behavior: 'smooth' });
    }
    if (wst) wst.addEventListener('click', function () { idz(-1); });
    if (dal) dal.addEventListener('click', function () { idz(1); });
    pas.addEventListener('scroll', function () { cancelAnimationFrame(stan.r); stan.r = requestAnimationFrame(stan); }, { passive: true });
    addEventListener('resize', stan);
    stan();
    var x0 = 0, s0 = 0, wcis = false, ruch = false;
    pas.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      wcis = true; ruch = false; x0 = e.clientX; s0 = pas.scrollLeft;
    });
    addEventListener('pointermove', function (e) {
      if (!wcis) return;
      var dx = e.clientX - x0;
      if (!ruch && Math.abs(dx) > 6) { ruch = true; pas.classList.add('ciagnie'); }
      if (ruch) { pas.scrollLeft = s0 - dx; e.preventDefault(); }
    });
    addEventListener('pointerup', function () {
      if (!wcis) return;
      wcis = false;
      if (!ruch) return;
      var c = cele(), cel = c[nr()];
      pas.classList.remove('ciagnie');
      pas.scrollTo({ left: cel, behavior: 'smooth' });
      setTimeout(function () { ruch = false; }, 0);
    });
    pas.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); } }, true);
    pas.addEventListener('dragstart', function (e) { e.preventDefault(); });
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

/* konfigurator "Skomponuj swoje schody" (dodatki/): kroki, wybor kafla, pasek postepu, stan w adresie (?drewno=dab&porecz=c3...),
   kompozycja z kodem, kopiowanie, link, wysylka na /wyslij.php (adres w body[data-form]; na podgladzie ekran sukcesu bez wysylki) */
(function () {
  var k = document.getElementById('konfigurator');
  if (!k) return;
  var KROKI = ['drewno', 'porecz', 'wypelnienie', 'slup', 'zakonczenie'];
  var WSZ = KROKI.concat('kompozycja');
  var NAZWY = { drewno: 'Drewno', porecz: 'Poręcz', wypelnienie: 'Wypełnienie', slup: 'Słup', zakonczenie: 'Zakończenie słupa' };
  var stan = {}, biez = 'drewno';
  var ruch = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || k).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || k).querySelectorAll(s)); }
  function panel(kr) { return $('.konf-panel[data-krok="' + kr + '"]'); }
  function kafel(kr, id) { return id && id !== 'nie' ? $('.konf-panel[data-krok="' + kr + '"] .konf-kafel[data-id="' + id + '"]') : null; }
  function laduj(p) { $$('img[data-lz]', p).forEach(function (i) { i.src = i.getAttribute('data-src'); i.removeAttribute('data-lz'); }); }
  function zrodlo(b) { var i = b.querySelector('img'); return i.getAttribute('src') || i.getAttribute('data-src'); }
  function kodKroku(kr) { var b = kafel(kr, stan[kr]); return b ? b.getAttribute('data-kod') : '?'; }
  function kod() { return KROKI.map(kodKroku).join(' · '); }
  function link() {
    var p = new URLSearchParams();
    KROKI.forEach(function (kr) { if (stan[kr]) p.set(kr, stan[kr]); });
    var q = p.toString();
    return location.origin + location.pathname + (q ? '?' + q : '') + '#konfigurator';
  }
  function zapiszAdres() { try { history.replaceState(null, '', link().replace(location.origin, '')); } catch (e) {} }

  function postep() {
    var gotowe = 0;
    KROKI.forEach(function (kr) {
      var b = kafel(kr, stan[kr]), w = $('[data-wyb="' + kr + '"]');
      if (stan[kr]) gotowe++;
      w.textContent = b ? b.getAttribute('data-kod') : (stan[kr] === 'nie' ? 'nie wiem' : 'do wyboru');
    });
    $$('.konf-postep button').forEach(function (b) {
      var kr = b.getAttribute('data-idz');
      b.classList.toggle('zrobione', !!stan[kr] && stan[kr] !== 'nie');
      b.classList.toggle('pominiete', stan[kr] === 'nie');
      if (kr === biez) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('#konfPasek').style.width = (biez === 'kompozycja' ? 100 : gotowe / KROKI.length * 100) + '%';
    var akt = $('.konf-postep [aria-current]');
    if (akt) { var ol = akt.closest('ol'); if (ol.scrollWidth > ol.clientWidth + 2) ol.scrollTo({ left: akt.parentNode.offsetLeft - ol.offsetLeft - 16, behavior: ruch ? 'smooth' : 'auto' }); }
  }
  function zaznacz(kr) {
    var p = panel(kr);
    $$('.konf-kafel', p).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-id') === stan[kr] ? 'true' : 'false'); });
    var d = $('[data-dalej]', p); if (d) d.disabled = !stan[kr] || stan[kr] === 'nie';
  }
  function grupa(p, g) {
    $$('.konf-typy .chip', p).forEach(function (c) { var a = c.getAttribute('data-grupa') === g; c.classList.toggle('aktywny', a); c.setAttribute('aria-pressed', a ? 'true' : 'false'); });
    $$('.konf-siatka', p).forEach(function (s) { s.hidden = s.getAttribute('data-grupa') !== g; s.scrollLeft = 0; });
    laduj(p);
  }
  function pokaz(kr, przewin) {
    biez = kr;
    WSZ.forEach(function (x) { var p = panel(x); p.hidden = x !== kr; p.classList.toggle('wchodzi', x === kr && ruch && przewin); });
    var p = panel(kr);
    if (kr === 'wypelnienie') { var b = kafel(kr, stan[kr]); grupa(p, b ? b.closest('.konf-siatka').getAttribute('data-grupa') : 'tralki'); }
    laduj(p);
    if (kr === 'kompozycja') wynik();
    postep();
    if (przewin) {
      var r = $('.konf-ramka').getBoundingClientRect();
      if (r.top < 0 || r.top > innerHeight * 0.5) $('.konf-ramka').scrollIntoView({ block: 'start', behavior: ruch ? 'smooth' : 'auto' });
      var h = $('h3', p); if (h) h.focus({ preventScroll: true });
    }
  }
  function nastepny(kr) { return WSZ[WSZ.indexOf(kr) + 1] || 'kompozycja'; }
  function poprzedni(kr) { return WSZ[Math.max(0, WSZ.indexOf(kr) - 1)]; }

  function wynik() {
    var ul = $('#konfMini'); ul.innerHTML = '';
    KROKI.forEach(function (kr) {
      var b = kafel(kr, stan[kr]), li = document.createElement('li');
      if (b) {
        li.innerHTML = '<span class="konf-mfoto"><img alt="" width="160" height="160"></span><span class="konf-mt"><small></small><b></b></span><button type="button" class="konf-zmien">Zmień</button>';
        li.querySelector('img').src = zrodlo(b);
        li.querySelector('b').textContent = b.getAttribute('data-nazwa');
      } else {
        li.className = 'brak';
        li.innerHTML = '<span class="konf-mfoto"></span><span class="konf-mt"><small></small><b>jeszcze nie wiem</b></span><button type="button" class="konf-zmien">Wybierz</button>';
      }
      li.querySelector('small').textContent = NAZWY[kr];
      li.querySelector('.konf-zmien').setAttribute('data-idz', kr);
      li.querySelector('.konf-zmien').setAttribute('aria-label', (b ? 'Zmień: ' : 'Wybierz: ') + NAZWY[kr]);
      ul.appendChild(li);
    });
    $('#konfKod').textContent = kod();
  }
  function info(t) { var i = $('#konfInfo'); i.textContent = t; clearTimeout(info.t); info.t = setTimeout(function () { i.textContent = ''; }, 6000); }
  function kopiuj(t, ok) {
    function stary() {
      var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0';
      document.body.appendChild(a); a.select(); var r = false; try { r = document.execCommand('copy'); } catch (e) {} document.body.removeChild(a);
      info(r ? ok : 'Nie udało się skopiować. Kod: ' + t);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(function () { info(ok); }, stary); else stary();
  }

  /* zdarzenia */
  k.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t || !k.contains(t)) return;
    var p = t.closest('.konf-panel'), kr = p ? p.getAttribute('data-krok') : null;
    if (t.classList.contains('konf-kafel')) {
      stan[kr] = t.getAttribute('data-id'); zaznacz(kr); postep(); zapiszAdres();
      var d = $('[data-dalej]', p); if (d && ruch) { d.classList.remove('puls'); void d.offsetWidth; d.classList.add('puls'); }
    } else if (t.hasAttribute('data-idz')) pokaz(t.getAttribute('data-idz'), true);
    else if (t.hasAttribute('data-dalej')) pokaz(nastepny(kr), true);
    else if (t.hasAttribute('data-wstecz')) pokaz(poprzedni(kr), true);
    else if (t.hasAttribute('data-pomin')) { stan[kr] = 'nie'; zaznacz(kr); zapiszAdres(); pokaz(nastepny(kr), true); }
    else if (t.hasAttribute('data-grupa')) grupa(p, t.getAttribute('data-grupa'));
    else if (t.id === 'konfKopiuj') kopiuj(kod(), 'Skopiowano kod: ' + kod());
    else if (t.id === 'konfLink') {
      var u = link();
      if (navigator.share && window.matchMedia('(pointer:coarse)').matches) navigator.share({ title: 'Moja kompozycja schodów - Kaczmarek Schody', text: 'Kod: ' + kod(), url: u }).catch(function () {});
      else kopiuj(u, 'Skopiowano link do kompozycji.');
    } else if (t.id === 'konfOdNowa') {
      stan = {}; KROKI.forEach(zaznacz); zapiszAdres(); pokaz('drewno', true);
    }
  });

  /* stan z adresu (link do udostepnienia) */
  var q = new URLSearchParams(location.search), byl = false;
  KROKI.forEach(function (kr) {
    var v = (q.get(kr) || '').toLowerCase();
    if (v && (v === 'nie' || kafel(kr, v))) { stan[kr] = v; byl = true; }
    zaznacz(kr);
  });
  var start = 'drewno';
  if (byl) { start = 'kompozycja'; for (var i = 0; i < KROKI.length; i++) if (!stan[KROKI[i]]) { start = KROKI[i]; break; } }
  pokaz(start, false);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (w) { document.body.classList.toggle('w-konf', w[0].isIntersecting); }, { threshold: 0.25 }).observe($('.konf-ramka'));

  /* formularz kompozycji */
  var f = $('#konfForm'), fi = $('#konfFormInfo'), cel = document.body.getAttribute('data-form'), znacznik = null;
  function pobierz() {
    if (!cel || znacznik) return;
    znacznik = fetch(cel + '?znacznik=1', { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { return j.z; }).catch(function () { znacznik = null; return ''; });
  }
  f.addEventListener('focusin', pobierz, { once: true });
  function blad(pole, t) { fi.className = 'form-info blad'; fi.textContent = t; if (pole) { pole.setAttribute('aria-invalid', 'true'); pole.focus(); } }
  f.addEventListener('input', function (e) { e.target.removeAttribute('aria-invalid'); });
  f.addEventListener('change', function (e) { e.target.removeAttribute('aria-invalid'); });
  function sukces(podglad) {
    $('#konfKodOk').textContent = kod();
    $('#konfPodglad').hidden = !podglad;
    f.hidden = true; var w = $('#konfWyslane'); w.hidden = false; w.focus({ preventScroll: true });
    if (w.getBoundingClientRect().top < 0) w.scrollIntoView({ block: 'start', behavior: ruch ? 'smooth' : 'auto' });
  }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var el = f.elements;
    if (!el.imie.value.trim()) return blad(el.imie, 'Proszę podać imię i nazwisko.');
    if (el.tel.value.replace(/\D/g, '').length < 9) return blad(el.tel, 'Proszę podać numer telefonu (min. 9 cyfr).');
    if (el.email.value.trim() && !/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[a-z]{2,}$/i.test(el.email.value.trim())) return blad(el.email, 'Proszę sprawdzić adres e-mail albo zostawić to pole puste.');
    if (!el.zgoda.checked) return blad(el.zgoda, 'Proszę zaznaczyć zgodę na przetwarzanie danych.');
    fi.className = 'form-info'; fi.textContent = '';
    if (!cel) { sukces(true); return; }   // podglad: bez wysylki
    var btn = f.querySelector('button[type=submit]');
    btn.disabled = true; fi.textContent = 'Wysyłamy...';
    pobierz();
    var opis = KROKI.map(function (kr) { var b = kafel(kr, stan[kr]); return NAZWY[kr] + ': ' + (b ? b.getAttribute('data-nazwa') : 'jeszcze nie wiem'); }).join('\n');
    Promise.resolve(znacznik).then(function (z) {
      var d = new FormData();
      ['imie', 'tel', 'email', '_honey'].forEach(function (n) { d.append(n, el[n].value); });
      d.append('zgoda', 'tak');
      d.append('typ', ('Konfigurator: ' + kod()).slice(0, 80));
      d.append('wiad', 'Kompozycja z konfiguratora na stronie:\n' + opis + '\n\nKod: ' + kod() + '\nLink: ' + link() + (el.uwagi.value.trim() ? '\n\nUwagi:\n' + el.uwagi.value.trim() : ''));
      d.append('_z', z || ''); d.append('strona', location.pathname);
      return new Promise(function (ok) { setTimeout(ok, z && (Date.now() / 1000 - parseInt(z, 10)) < 3.5 ? 3500 : 0); }).then(function () {
        return fetch(cel, { method: 'POST', body: d, credentials: 'same-origin' });
      });
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.success) throw j;
      fi.textContent = ''; znacznik = null; sukces(false); f.reset();
    }).catch(function () {
      fi.className = 'form-info blad'; znacznik = null;
      fi.innerHTML = 'Nie udało się wysłać. Prosimy zadzwonić: <a href="tel:+48501552195">501 552 195</a> i podać kod kompozycji.';
    }).then(function () { btn.disabled = false; });
  });
})();
