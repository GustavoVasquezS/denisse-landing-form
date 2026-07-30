// TODO: cambiar a dkarmy@gmail.com (y reactivar en activate.html) cuando se pase de pruebas a producción.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/sentimentapi.noreply@gmail.com';

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
  updateCarousel();

  // Web fonts (Instrument Serif / Inter) can swap in after this first
  // measurement and reflow the text taller, leaving the fixed inline
  // height stale and clipping the card's bottom edge — recheck once
  // fonts are actually ready.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateCarousel);
  }
}

const form = document.getElementById('agendaForm');
const submitBtn = document.getElementById('agendaSubmitBtn');
const errorMsg = document.getElementById('agendaError');
const successView = document.getElementById('agendaSuccess');
const successName = document.getElementById('successName');

if (form) {
  // Allows other pages to link here as index.html#agenda?servicio=curso
  // and land with the right option already selected. The servicio param
  // lives inside the hash (not the query string) so it survives the
  // index.html -> /index redirect from vercel.json's cleanUrls, which
  // drops query strings but never touches the fragment.
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
