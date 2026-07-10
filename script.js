const RECIPIENT_EMAIL = 'sentimentapi.noreply@gmail.com';
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`;

const form = document.getElementById('contentForm');
const submitBtn = document.getElementById('submitBtn');
const errorMsg = document.getElementById('errorMsg');
const successView = document.getElementById('successView');

const imageFieldLabels = {
  img_foto_principal: 'Foto personal principal',
  img_foto_secundaria: 'Foto personal secundaria',
  img_logo: 'Logo/isotipo',
  img_portada_libro: 'Portada del libro',
  img_fotos_servicios: 'Fotos de servicios/cursos',
  img_fotos_sesiones: 'Fotos/video de sesiones',
  img_certificaciones: 'Certificaciones/avales',
  img_medios: 'Medios/empresas',
  img_hero_bg: 'Imagen hero'
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';

  if (RECIPIENT_EMAIL === 'tu-correo@dominio.com') {
    errorMsg.textContent = 'Configura primero el correo destino en script.js antes de compartir el formulario.';
    errorMsg.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar información';
    return;
  }

  const data = new FormData(form);
  const payload = { _subject: 'Contenido landing — Denisse Karmy' };

  for (const [key, value] of data.entries()) {
    if (key.startsWith('img_')) continue;
    payload[key] = value;
  }

  const checklistText = Object.entries(imageFieldLabels)
    .map(([key, label]) => `${data.get(key) ? '✅' : '⬜'} ${label}`)
    .join('\n');
  payload['Checklist de imagenes'] = checklistText;

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('request failed');
    form.classList.add('hidden');
    successView.classList.remove('hidden');
  } catch (err) {
    errorMsg.textContent = 'No pudimos enviar el formulario. Intenta de nuevo en unos minutos.';
    errorMsg.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar información';
  }
});
