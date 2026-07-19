// TODO: cambiar a dkarmy@gmail.com (y reactivar en activate.html) cuando se pase de pruebas a producción.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/sentimentapi.noreply@gmail.com';

const cursoToggle = document.getElementById('cursoToggle');
const cursoDetails = document.getElementById('cursoDetails');

cursoToggle.addEventListener('click', () => {
  const isOpen = !cursoDetails.classList.contains('hidden');
  cursoDetails.classList.toggle('hidden');
  cursoToggle.textContent = isOpen ? 'Quiero saber más' : 'Ver menos';
  cursoToggle.setAttribute('aria-expanded', String(!isOpen));
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
}

const form = document.getElementById('agendaForm');
const submitBtn = document.getElementById('agendaSubmitBtn');
const errorMsg = document.getElementById('agendaError');
const successView = document.getElementById('agendaSuccess');
const successName = document.getElementById('successName');

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
