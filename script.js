// ---------- Menú móvil ----------
const menuBtn = document.getElementById('menuBtn');
const mobileNav = document.getElementById('mobileNav');
if(menuBtn && mobileNav){
  menuBtn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// ---------- Modo oscuro ----------
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function applyTheme(theme){
  if(theme === 'dark'){
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  if(themeToggle){
    themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }
}

// El script en el <head> ya aplicó el tema guardado (o el del sistema) antes de pintar la página.
// Aquí solo sincronizamos el estado del botón con lo que quedó aplicado.
applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

if(themeToggle){
  themeToggle.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    try{ localStorage.setItem('secura-theme', nextTheme); }catch(e){}
  });
}

// Si el usuario no ha elegido un tema manualmente, seguir la preferencia del sistema en vivo
if(window.matchMedia){
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', (e) => {
    let saved = null;
    try{ saved = localStorage.getItem('secura-theme'); }catch(err){}
    if(!saved){
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

// ---------- Tarjetas que se voltean ----------
document.querySelectorAll('.flip-card').forEach(card => {
  const front = card.querySelector('.flip-front');
  const back = card.querySelector('.flip-back');
  card.addEventListener('click', () => {
    const flipped = card.getAttribute('aria-pressed') === 'true';
    card.setAttribute('aria-pressed', flipped ? 'false' : 'true');
    // Solo la cara visible se anuncia en los lectores de pantalla
    front.setAttribute('aria-hidden', flipped ? 'false' : 'true');
    back.setAttribute('aria-hidden', flipped ? 'true' : 'false');
  });
});

// ---------- Imagen ampliada con botón para cerrar ----------
(function(){
  const box = document.getElementById('lightbox');
  if(!box) return;
  const img = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  const titleEl = document.getElementById('lightboxTitle');
  document.querySelectorAll('[data-lightbox]').forEach(btn => {
    btn.addEventListener('click', () => {
      const thumb = btn.querySelector('img');
      img.src = btn.dataset.lightbox;
      img.alt = thumb ? thumb.alt : '';
      if(titleEl && btn.dataset.lightboxTitle) titleEl.textContent = btn.dataset.lightboxTitle;
      if(typeof box.showModal === 'function') box.showModal(); else box.setAttribute('open', '');
      box.querySelector('.lightbox-scroll').scrollTo(0, 0);
      closeBtn.focus();
    });
  });
  const close = () => { if(typeof box.close === 'function') box.close(); else box.removeAttribute('open'); };
  closeBtn.addEventListener('click', close);
  // Tocar fuera de la imagen también cierra (en el fondo oscuro)
  box.addEventListener('click', e => { if(e.target === box) close(); });
  // La tecla Esc cierra el cuadro de forma nativa
})();

// ---------- Carrusel deslizable: Phishing / Smishing / Vishing ----------
// Usa scroll-snap del navegador: funciona con el dedo (swipe), el mouse (arrastrar),
// el teclado (← →) y los botones. JS solo sincroniza los puntos y las flechas.
(function(){
  const carousel = document.getElementById('attackCarousel');
  if(!carousel) return;
  const track = carousel.querySelector('.attack-track');
  const slides = Array.from(carousel.querySelectorAll('.attack-slide'));
  const dots = Array.from(carousel.querySelectorAll('.carousel-dot'));
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;

  function slideStep(){
    return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth;
  }
  function setCurrent(i){
    current = Math.max(0, Math.min(slides.length - 1, i));
    dots.forEach((dot, n) => {
      dot.classList.toggle('active', n === current);
      if(n === current) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
    });
  }
  function goTo(i){
    const target = (i + slides.length) % slides.length;
    track.scrollTo({left: target * slideStep(), behavior: reduceMotion ? 'auto' : 'smooth'});
    setCurrent(target);
  }

  let ticking = false;
  track.addEventListener('scroll', () => {
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setCurrent(Math.round(track.scrollLeft / slideStep()));
      ticking = false;
    });
  }, {passive: true});

  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => goTo(current - 1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => goTo(current + 1));
  dots.forEach(dot => dot.addEventListener('click', () => goTo(Number(dot.dataset.carouselSlide))));
  track.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft'){ e.preventDefault(); goTo(current - 1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); goTo(current + 1); }
  });

  // Arrastrar con el mouse (en pantallas táctiles el swipe ya es nativo)
  let startX = 0, startScroll = 0, dragging = false, moved = false;
  track.addEventListener('pointerdown', e => {
    if(e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; moved = false; startX = e.clientX; startScroll = track.scrollLeft;
  });
  window.addEventListener('pointermove', e => {
    if(!dragging) return;
    const dx = e.clientX - startX;
    if(!moved && Math.abs(dx) > 6){ moved = true; track.classList.add('dragging'); }
    if(moved) track.scrollLeft = startScroll - dx;
  });
  window.addEventListener('pointerup', () => {
    if(!dragging) return;
    dragging = false;
    if(moved){
      track.classList.remove('dragging');
      goTo(Math.round(track.scrollLeft / slideStep()));
    }
  });
  window.addEventListener('resize', () => track.scrollTo({left: current * slideStep(), behavior: 'auto'}));
})();

// ---------- Guía rápida (4 pasos) ----------
const guideToggle = document.getElementById('guideToggle');
const quickGuide = document.getElementById('quickGuide');
if(guideToggle && quickGuide){
  guideToggle.addEventListener('click', () => {
    const open = guideToggle.getAttribute('aria-expanded') === 'true';
    guideToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    guideToggle.textContent = open ? 'Guía rápida' : 'Cerrar guía';
    quickGuide.hidden = open;
    if(!open) quickGuide.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  });
}
const goToChecker = document.getElementById('goToChecker');
if(goToChecker){
  goToChecker.addEventListener('click', () => {
    const input = document.getElementById('urlToCheck');
    document.getElementById('verificacion').scrollIntoView({behavior: 'smooth'});
    setTimeout(() => input.focus({preventScroll: true}), 400);
  });
}

// ---------- Verificador de dominios oficiales ----------
const domainCheckerForm = document.getElementById('domainCheckerForm');
const urlToCheck = document.getElementById('urlToCheck');
const domainResult = document.getElementById('domainResult');

function normalizeHostname(hostname){
  return hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
}

// Construye el resultado con textContent (nunca innerHTML) para que ningún dato
// externo, como los que vendrán de la base de datos, pueda inyectar código.
function showDomainResult(isDangerous, message, steps = []){
  domainResult.hidden = false;
  domainResult.className = 'domain-result ' + (isDangerous ? 'danger' : 'safe');
  domainResult.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = message;
  domainResult.appendChild(strong);
  if(steps.length){
    const title = document.createElement('p');
    title.textContent = 'Qué hacer:';
    const list = document.createElement('ol');
    steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      list.appendChild(li);
    });
    domainResult.append(title, list);
  }
}

// Lista de respaldo. Cuando conecten la base de datos, solo hay que
// reemplazar el cuerpo de loadOfficialDomains() para que devuelva
// un arreglo [{owner, hostname}, ...] desde la base.
const fallbackDomainList =
`BCR:https://www.bancobcr.com/
BN:https://www.bncr.fi.cr/
BP:https://www.bancopopular.fi.cr/
BANHVI:https://www.banhvi.fi.cr/
BAC:https://www.baccredomatic.com/
BCT:https://www.bancobct.com/
Cathay:https://www.bancocathay.com/
Banco CMB:https://www.citigroup.com/
Davivienda:https://davivienda.cr
Banco General:https://www.bgeneral.fi.cr/
Banco Improsa:https://www.grupoimprosa.com/
Banco Lafise:https://www.lafise.com/
Banco Promerica:https://www.promerica.fi.cr/
Scotiabank (DAVIbank):https://www.davibank.cr/
Coopenae:https://www.coopenae.fi.cr/
Coopealianza:https://coopealianza.fi.cr/
Coopeande:https://coopeande1.com/
Coocique:https://coocique.fi.cr/
Grupo Mutual:https://www.grupomutual.fi.cr/
Mucap:https://www.mucap.fi.cr/`;

function parseDomainList(text){
  return text.split(/\r?\n/).reduce((domains, line) => {
    const separator = line.indexOf(':');
    if(separator === -1) return domains;
    const owner = line.slice(0, separator).trim();
    const listedUrl = line.slice(separator + 1).trim();
    try{
      domains.push({owner, hostname: normalizeHostname(new URL(listedUrl).hostname)});
    }catch(error){}
    return domains;
  }, []);
}

async function loadOfficialDomains(){
  // 👉 Aquí se conectará la base de datos. Por ahora usa la lista interna.
  return parseDomainList(fallbackDomainList);
}

if(domainCheckerForm){
  domainCheckerForm.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = urlToCheck.value.trim();
    let parsedUrl;
    try{
      // Si la persona pega "www.banco.com" sin https://, se lo agregamos
      parsedUrl = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : 'https://' + raw);
      if(!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname.includes('.')) throw new Error();
    }catch(error){
      showDomainResult(true, 'La URL no tiene un formato válido y podría ser peligrosa.', [
        'No abras el enlace.',
        'Elimina el mensaje o correo que lo contiene.',
        'Consulta al banco usando su aplicación oficial o un número confiable.'
      ]);
      return;
    }

    try{
      const officialDomains = await loadOfficialDomains();
      const hostname = normalizeHostname(parsedUrl.hostname);
      const match = officialDomains.find(domain => hostname === domain.hostname || hostname.endsWith('.' + domain.hostname));
      if(match){
        showDomainResult(false, 'Este enlace parece real: pertenece a ' + match.owner + ' (' + match.hostname + ').');
      }else{
        showDomainResult(true, 'Este enlace no aparece en la lista oficial y podría ser peligroso.', [
          'No introduzcas contraseñas, códigos ni datos bancarios.',
          'Cierra la página y no descargues archivos.',
          'Entra al banco escribiendo su dirección oficial o usando su aplicación.',
          'Si compartiste información, contacta al banco y cambia tus contraseñas.'
        ]);
      }
    }catch(error){
      showDomainResult(true, 'No se pudo consultar la lista oficial. No abras el enlace hasta verificarlo por otro medio.', [
        'Consulta directamente el sitio web o la aplicación oficial de tu banco.',
        'No compartas información mientras no confirmes el dominio.'
      ]);
    }
  });
}

// ---------- Pestañas del ejercicio práctico (practica.html) ----------
(function(){
  const tablist = document.querySelector('.tabs[role="tablist"]');
  if(!tablist) return;
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  function select(tab, focus){
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      // Al cambiar de pestaña se pausa el video de la anterior
      if(!on){ const v = document.getElementById(t.getAttribute('aria-controls')).querySelector('video'); if(v) v.pause(); }
    });
    if(focus) tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', e => {
      let n = null;
      if(e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if(e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if(e.key === 'Home') n = 0;
      if(e.key === 'End') n = tabs.length - 1;
      if(n !== null){ e.preventDefault(); select(tabs[n], true); }
    });
  });
})();

// ---------- Repaso: "Marca las señales que ya conozcas" ----------
(function(){
  const list = document.getElementById('checklist');
  if(!list) return;
  const boxes = Array.from(list.querySelectorAll('input[type="checkbox"]'));
  const count = document.getElementById('resultCount');
  const msg = document.getElementById('resultMsg');
  const box = document.getElementById('resultBox');
  // ✏️ Mensajes editables, según la cantidad de señales marcadas (0 a 6)
  const messages = [
    'Marca las señales que ya reconoces. Si alguna no te suena, vuelve a mirar el ejercicio práctico.',
    'Vas empezando. Repasa el ejercicio práctico para conocer las señales que te faltan.',
    'Vas empezando. Repasa el ejercicio práctico para conocer las señales que te faltan.',
    '¡Buen avance! Ya reconoces varias señales. Ante la duda, no abras el enlace y compruébalo antes.',
    '¡Buen avance! Ya reconoces varias señales. Ante la duda, no abras el enlace y compruébalo antes.',
    '¡Muy bien! Casi las conoces todas. Repasa la que te falta.',
    '¡Felicidades! Reconoces las 6 señales de alerta. Recuerda: ante la duda, no hagas clic y comprueba el enlace.'
  ];
  function update(){
    const n = boxes.filter(b => b.checked).length;
    count.textContent = n + ' de ' + boxes.length + ' señales marcadas';
    msg.textContent = messages[n];
    box.classList.toggle('done', n === boxes.length);
  }
  boxes.forEach(b => b.addEventListener('change', update));
  update();
})();
