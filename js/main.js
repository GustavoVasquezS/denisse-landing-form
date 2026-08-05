// TODO: cambiar a dkarmy@gmail.com (y reactivar en activate.html) cuando se pase de pruebas a producción.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/sentimentapi.noreply@gmail.com';

// Contenido editable: la hoja de Google Sheets publicada es la fuente de
// texto en vivo. Cada fila tiene (key, Ubicación, Texto actual); cada
// elemento editable del HTML lleva un atributo data-key con esa misma key.
// El HTML siempre trae el texto por defecto ya escrito -> si la hoja no
// carga (sin internet, URL caída, fila vacía) el sitio se ve exactamente
// igual, nunca queda en blanco. Solo se sobreescribe lo que la hoja trae
// con contenido real.
const CONTENT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdNhhffmw-wmfiLzB0jxBtI3WieGFw7SqgWxTd6Ze2jX2Va524ZfrgcIaX98PmrJEygK9f_QsCnngN/pub?gid=817921967&single=true&output=csv';

function parseContentCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r') {
      // skip, \n handles the line break
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function applyContentOverrides() {
  try {
    const res = await fetch(CONTENT_SHEET_URL, { cache: 'no-store' });
    if (!res.ok) return;
    const csvText = await res.text();
    const rows = parseContentCSV(csvText);
    rows.shift(); // header: key, Ubicación, Texto actual
    let changed = false;
    for (const cols of rows) {
      const key = (cols[0] || '').trim();
      const texto = cols[2];
      if (!key || !texto || !texto.trim()) continue;
      const el = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
      if (!el) continue;
      // <meta> tags (SEO description) have no visible textContent — the
      // actual text lives in their "content" attribute instead.
      if (el.tagName === 'META') {
        if (el.getAttribute('content') !== texto) {
          el.setAttribute('content', texto);
          changed = true;
        }
      } else if (el.textContent !== texto) {
        el.textContent = texto;
        changed = true;
      }
    }
    if (changed) {
      // Text swaps can change element heights (e.g. a longer testimonial
      // quote) — let anything that measured layout on load (the
      // testimonial carousel's height-lock) recompute against the final text.
      window.dispatchEvent(new Event('content:updated'));
    }
  } catch (err) {
    // Silent fail: the hardcoded HTML text already on the page is the
    // fallback, so a network/parse error here should never break the site.
  }
}
// .finally (not a bare call) so applyLocateHash below always runs after the
// sheet fetch settles, whether it succeeded or silently failed -- otherwise
// the locator tool could highlight stale HTML-default text/position instead
// of the final sheet-resolved content.
applyContentOverrides().finally(applyLocateHash);

document.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
  const dropdown = toggle.closest('.nav-dropdown');
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('is-open');
    document.querySelectorAll('.nav-dropdown.is-open').forEach((d) => {
      d.classList.remove('is-open');
      d.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) { dropdown.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); }
  });
});
document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown.is-open').forEach((d) => {
    d.classList.remove('is-open');
    d.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.nav-dropdown.is-open').forEach((d) => {
    d.classList.remove('is-open');
    d.querySelector('.nav-dropdown-toggle').setAttribute('aria-expanded', 'false');
  });
});

// Botón CTA flotante -- prueba en curso, ver si aporta a la conversión.
// Clona el .nav-btn existente (texto + link) en vez de tener una lista
// aparte por página, así queda igual de correcto en las 7 páginas y sigue
// el contenido en vivo de la hoja sin trabajo extra.
const navBtn = document.querySelector('.nav-btn');
if (navBtn) {
  const floatingCta = document.createElement('a');
  floatingCta.className = 'btn btn-gold floating-cta';
  floatingCta.href = navBtn.getAttribute('href');
  const navBtnTarget = navBtn.getAttribute('target');
  if (navBtnTarget) floatingCta.setAttribute('target', navBtnTarget);
  const navBtnRel = navBtn.getAttribute('rel');
  if (navBtnRel) floatingCta.setAttribute('rel', navBtnRel);
  floatingCta.textContent = navBtn.textContent;
  document.body.appendChild(floatingCta);

  // Si la hoja trae un texto distinto para el botón del nav, que el
  // flotante lo refleje también.
  window.addEventListener('content:updated', () => {
    floatingCta.textContent = navBtn.textContent;
  });

  // Umbral de scroll (px) antes de mostrar el botón -- ajustar acá durante
  // las pruebas si hace falta que aparezca antes/después.
  const FLOATING_CTA_SCROLL_THRESHOLD = 500;
  let footerVisible = false;
  let floatingCtaTicking = false;
  function updateFloatingCtaVisibility() {
    const shouldShow = window.scrollY > FLOATING_CTA_SCROLL_THRESHOLD && !footerVisible;
    floatingCta.classList.toggle('visible', shouldShow);
    // En mobile el botón pasa a ser una barra de ancho completo pegada
    // abajo (ver css/style.css) -- esta clase reserva el espacio
    // equivalente en el body para que el contenido nunca quede tapado
    // detrás, en vez de perseguir cada sección larga con la que podría
    // chocar el botón flotante de escritorio.
    document.body.classList.toggle('floating-cta-visible', shouldShow);
    floatingCtaTicking = false;
  }
  window.addEventListener('scroll', () => {
    if (!floatingCtaTicking) {
      requestAnimationFrame(updateFloatingCtaVisibility);
      floatingCtaTicking = true;
    }
  }, { passive: true });
  updateFloatingCtaVisibility();

  // Ocultar al llegar al footer -- en mobile el botón tapaba los links de
  // Instagram/LinkedIn ahí abajo.
  const siteFooter = document.querySelector('.site-footer');
  if (siteFooter && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      footerVisible = entries[0].isIntersecting;
      updateFloatingCtaVisibility();
    }).observe(siteFooter);
  }
}

const cursoToggle = document.getElementById('cursoToggle');
const cursoDetails = document.getElementById('cursoDetails');

if (cursoToggle && cursoDetails) {
  cursoToggle.addEventListener('click', () => {
    const isOpen = !cursoDetails.classList.contains('hidden');
    cursoDetails.classList.toggle('hidden');
    cursoToggle.textContent = isOpen ? 'Quiero saber más' : 'Ver menos';
    cursoToggle.setAttribute('aria-expanded', String(!isOpen));
  });
}

// Video testimonials: load the YouTube iframe only on click, so the page
// doesn't pay YouTube's embed script cost for videos nobody plays.
document.querySelectorAll('.video-thumb').forEach((btn) => {
  btn.addEventListener('click', () => {
    const frame = btn.closest('.video-testimonial-frame');
    const videoId = btn.dataset.videoId;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.title = btn.getAttribute('aria-label') || 'Video testimonio';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    frame.innerHTML = '';
    frame.appendChild(iframe);
  });
});

document.querySelectorAll('.faq-item').forEach((item) => {
  const question = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  const icon = item.querySelector('.faq-icon');

  question.addEventListener('click', () => {
    const isOpen = question.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.faq-question').forEach((q) => {
      q.setAttribute('aria-expanded', 'false');
      q.parentElement.querySelector('.faq-answer').classList.add('hidden');
      q.querySelector('.faq-icon').textContent = '+';
    });

    if (!isOpen) {
      question.setAttribute('aria-expanded', 'true');
      answer.classList.remove('hidden');
      icon.textContent = '×';
    }
  });
});

const testimonialTrack = document.getElementById('testimonialTrack');
const testimonialPrev = document.getElementById('testimonialPrev');
const testimonialNext = document.getElementById('testimonialNext');
const testimonialDots = document.getElementById('testimonialDots');

if (testimonialTrack) {
  const testimonialCarousel = testimonialTrack.parentElement;
  const pages = testimonialTrack.children;
  const pageCount = pages.length;
  let current = 0;

  for (let i = 0; i < pageCount; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ir al grupo ${i + 1} de testimonios`);
    dot.addEventListener('click', () => goToPage(i));
    testimonialDots.appendChild(dot);
  }

  function updateCarousel() {
    testimonialTrack.style.transform = `translateX(-${current * 100}%)`;
    testimonialCarousel.style.height = pages[current].offsetHeight + 'px';
    testimonialPrev.disabled = current === 0;
    testimonialNext.disabled = current === pageCount - 1;
    [...testimonialDots.children].forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  function goToPage(i) {
    current = Math.max(0, Math.min(pageCount - 1, i));
    updateCarousel();
  }

  testimonialPrev.addEventListener('click', () => goToPage(current - 1));
  testimonialNext.addEventListener('click', () => goToPage(current + 1));
  window.addEventListener('resize', updateCarousel);
  window.addEventListener('content:updated', updateCarousel);
  updateCarousel();

  // Web fonts (Instrument Serif / Inter) can swap in after this first
  // measurement and reflow the text taller, leaving the fixed inline
  // height stale and clipping the card's bottom edge — recheck once
  // fonts are actually ready.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateCarousel);
  }
}

// Herramienta interna de ubicación de texto (ubicar-texto.html): al abrir
// una página con #locate=KEY en el hash, resalta y hace scroll al elemento
// con ese data-key. No-op en cualquier carga normal del sitio (el hash
// nunca trae ese formato salvo que venga de la herramienta interna).
function applyLocateHash() {
  const hash = window.location.hash;
  if (!hash.startsWith('#locate=')) return;
  const key = decodeURIComponent(hash.slice('#locate='.length));
  const el = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (!el) return;

  // Si el elemento vive en una página no-activa del carrusel de
  // testimonios, hay que cambiar de página antes de hacer scroll.
  // updateCarousel/goToPage son locales al bloque de arriba, así que la
  // única forma de invocarlas desde aquí es simular el click del dot
  // correspondiente, que ya está conectado a goToPage.
  const page = el.closest('.testimonial-page');
  if (page && testimonialTrack && testimonialDots) {
    const index = [...testimonialTrack.children].indexOf(page);
    if (index > -1 && testimonialDots.children[index]) {
      testimonialDots.children[index].click();
    }
  }

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('locate-highlight');
  // Duración debe coincidir con la animación locate-pulse en css/style.css.
  setTimeout(() => el.classList.remove('locate-highlight'), 6000);
}
window.addEventListener('hashchange', applyLocateHash);

const form = document.getElementById('agendaForm');
const submitBtn = document.getElementById('agendaSubmitBtn');
const errorMsg = document.getElementById('agendaError');
const successView = document.getElementById('agendaSuccess');
const successName = document.getElementById('successName');

if (form) {
  // Allows other pages (and buttons on this same page) to link here as
  // #agenda?servicio=curso and land with the right option already selected.
  // The servicio param lives inside the hash (not the query string) so it
  // survives the index.html -> /index redirect from vercel.json's cleanUrls,
  // which drops query strings but never touches the fragment.
  // Runs on load AND on hashchange, since clicking a same-page anchor link
  // (e.g. the curso teaser button on this very page) only changes the hash
  // without a reload, so the initial-load code alone would never see it.
  function applyAgendaHash() {
    const hash = window.location.hash.slice(1);
    const [hashTarget, hashQuery] = hash.split('?');
    const preselect = hashQuery ? new URLSearchParams(hashQuery).get('servicio') : null;
    if (preselect) {
      const servicioField = form.querySelector('[name="Servicio"]');
      if (servicioField && [...servicioField.options].some((o) => o.value === preselect)) {
        servicioField.value = preselect;
      }
    }
    if (hashTarget === 'agenda') {
      document.getElementById('agenda')?.scrollIntoView();
    }
  }
  applyAgendaHash();
  window.addEventListener('hashchange', applyAgendaHash);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    if (data.get('_honey')) return;

    errorMsg.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    const payload = { _subject: 'Nueva solicitud de sesión — Denisse Karmy' };
    for (const [key, value] of data.entries()) {
      if (key === '_honey') continue;
      payload[key] = value;
    }

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('request failed');
      successName.textContent = `¡Gracias, ${data.get('Nombre')}!`;
      form.classList.add('hidden');
      successView.classList.remove('hidden');
    } catch (err) {
      errorMsg.textContent = 'No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.';
      errorMsg.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar solicitud';
    }
  });
}
