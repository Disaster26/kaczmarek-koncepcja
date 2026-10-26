(function () {
  var TYPY = {
    dyw: { nazwa: 'Schody dywanowe', n: 11 },
    pol: { nazwa: 'Schody policzkowe', n: 10 },
    bol: { nazwa: 'Schody bolcowe', n: 11 },
    sio: { nazwa: 'Schody siodłane', n: 7 },
    spi: { nazwa: 'Schody spiralne', n: 5 },
    bet: { nazwa: 'Schody na beton', n: 11 }
  };
  // wszystkie zdjecia, przeplatane typami (zeby "Wszystkie" bylo zroznicowane)
  var zdjecia = [];
  var klucze = Object.keys(TYPY);
  [2,3,4,5,6,7,8,9,10,11,1].forEach(function (i) {
    klucze.forEach(function (k) {
      if (i <= TYPY[k].n) zdjecia.push({ typ: k, src: 'img/' + k + '-' + i + '.jpg', opis: TYPY[k].nazwa });
    });
  });

  /* menu */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function zamknijMenu() { menu.classList.remove('otwarte'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var o = menu.classList.toggle('otwarte');
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') zamknijMenu(); });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target) && !burger.contains(e.target)) zamknijMenu(); });

  /* galeria */
  var galeria = document.getElementById('galeria');
  var wiecej = document.getElementById('wiecej');
  var filtr = 'all', limit = 12, widoczne = [];
  function rysuj() {
    var lista = zdjecia.filter(function (z) { return filtr === 'all' || z.typ === filtr; });
    widoczne = lista;
    galeria.innerHTML = '';
    lista.slice(0, limit).forEach(function (z, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', z.opis + ' - powiększ zdjęcie');
      var img = document.createElement('img');
      img.src = z.src; img.alt = z.opis; img.loading = 'lazy'; img.decoding = 'async';
      b.appendChild(img);
      b.addEventListener('click', function () { otworz(lista, idx); });
      galeria.appendChild(b);
    });
    wiecej.hidden = lista.length <= limit;
  }
  document.querySelectorAll('.chip[data-filtr]').forEach(function (c) {
    c.addEventListener('click', function () {
      document.querySelectorAll('.chip[data-filtr]').forEach(function (x) { x.classList.remove('aktywny'); });
      c.classList.add('aktywny');
      filtr = c.dataset.filtr; limit = 12; rysuj();
    });
  });
  wiecej.addEventListener('click', function () { limit += 12; rysuj(); });
  rysuj();

  /* lightbox */
  var lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap');
  var lista = [], poz = 0;
  function pokaz() {
    var z = lista[poz];
    lbImg.src = z.src; lbImg.alt = z.opis;
    lbCap.textContent = z.opis + '  ' + (poz + 1) + ' / ' + lista.length;
  }
  function otworz(l, i) { lista = l; poz = i; pokaz(); lb.hidden = false; document.body.style.overflow = 'hidden'; }
  function zamknij() { lb.hidden = true; document.body.style.overflow = ''; }
  function krok(d) { poz = (poz + d + lista.length) % lista.length; pokaz(); }
  document.getElementById('lbX').addEventListener('click', zamknij);
  document.getElementById('lbPrev').addEventListener('click', function () { krok(-1); });
  document.getElementById('lbNext').addEventListener('click', function () { krok(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) zamknij(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') zamknij();
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

  /* kafle rodzajow -> galeria danego typu */
  document.querySelectorAll('.kafel[data-typ]').forEach(function (k) {
    k.addEventListener('click', function () {
      var t = k.dataset.typ;
      otworz(zdjecia.filter(function (z) { return z.typ === t; }), 0);
    });
  });

  /* dolny pasek na telefonie - dopiero po przewinieciu za przyciski hero */
  var mob = document.getElementById('mob');
  var akcje = document.getElementById('heroAkcje');
  var kontakt = document.getElementById('kontakt');
  var zaAkcjami = false, wKontakcie = false;
  function pasek() { mob.classList.toggle('widac', zaAkcjami && !wKontakcie); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (w) {
      zaAkcjami = !w[0].isIntersecting && w[0].boundingClientRect.top < 0; pasek();
    }).observe(akcje);
    new IntersectionObserver(function (w) { wKontakcie = w[0].isIntersecting; pasek(); }, { threshold: 0.15 }).observe(kontakt);
  }

  /* formularz - w wizualizacji tylko przygotowanie wiadomosci e-mail */
  var form = document.getElementById('formularz');
  var info = document.getElementById('formInfo');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(form);
    if (!d.get('imie') || !d.get('tel')) { info.className = 'form-info blad'; info.textContent = 'Proszę podać imię i numer telefonu.'; return; }
    if (!d.get('zgoda')) { info.className = 'form-info blad'; info.textContent = 'Proszę zaznaczyć zgodę na przetwarzanie danych.'; return; }
    var tresc = 'Imię i nazwisko: ' + d.get('imie') + '\nTelefon: ' + d.get('tel') + '\nRodzaj schodów: ' + d.get('typ') +
      '\nMiejscowość: ' + (d.get('miasto') || '-') + '\n\n' + (d.get('wiad') || '');
    info.className = 'form-info';
    info.textContent = 'Dziękujemy. Otwieramy program pocztowy z gotową wiadomością - wystarczy ją wysłać.';
    location.href = 'mailto:biuro@kaczmarekschody.pl?subject=' + encodeURIComponent('Zapytanie o schody') + '&body=' + encodeURIComponent(tresc);
  });
})();
