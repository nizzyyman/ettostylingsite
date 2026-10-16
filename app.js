const content = {
  client: {
    headline: 'Get matched with an eye<br> you trust.',
    introduction: 'Meet a stylist who understands your taste and how you live, with Etto attending to the details along the way.',
    description: 'to outsource my aesthetic life.',
    action: 'Apply for membership',
    steps: [
      ['It starts with a conversation', 'We ingest your life, your taste, and what you want. This happen automatically with software + a conversation with us.'],
      ['a considered introduction', ''],
      ['New wardrobe, more you', ''],
    ],
    confirmation: 'A little closer to you.',
    confirmationCopy: 'Thank you for your interest in ETTO. Your membership request has been received.',
  },
  stylist: {
    headline: 'Have control over your<br> creative vision',
    introduction: 'Work with members who value your taste. Get the support to give your creative work full attention.',
    description: 'for aligned clients.',
    action: 'Partner with Etto',
    steps: [
      ['Show us your eye', 'Share your perspective and the work that makes your style unmistakably yours.'],
      ['Get matched with clients', ''],
      ['Grow your practice', ''],
    ],
    confirmation: 'Your eye belongs here.',
    confirmationCopy: 'Thank you for sharing your interest. Your stylist application has been received.',
  },
};

const form = document.querySelector('#signup-form');
const confirmation = document.querySelector('#confirmation');
const email = document.querySelector('#email');
const instagram = document.querySelector('#instagram');
let currentRole = 'client';
let submitting = false;
let pendingSubmission = null;
const storyCards = [...document.querySelectorAll('.story-card')];
const storyGrid = document.querySelector('.story-grid');
let activeStep = 0;

function setActiveStep(index) {
  activeStep = index;
  storyCards.forEach((card, i) => {
    const active = i === index;
    card.classList.toggle('is-active', active);
    card.setAttribute('aria-pressed', String(active));
  });
  document.querySelector('#story-count').textContent = `${index + 1} : ${storyCards.length}`;
  document.querySelector('#story-progress-fill').style.width = `${((index + 1) / storyCards.length) * 100}%`;
}

function clearError(input) {
  input.removeAttribute('aria-invalid');
  document.querySelector(`#${input.id}-error`).textContent = '';
}

function setRole(role) {
  if (!content[role] || submitting) return;
  currentRole = role;
  const copy = content[role];
  document.querySelector(`input[name="role"][value="${role}"]`).checked = true;
  document.querySelector('#hero-title').innerHTML = copy.headline;
  document.querySelector('#signup-copy').textContent = copy.introduction;
  document.querySelector('#role-description').textContent = copy.description;
  document.querySelector('#submit-label').textContent = copy.action;
  document.querySelector('#instagram-field').hidden = role !== 'stylist';
  instagram.required = role === 'stylist';
  instagram.disabled = role !== 'stylist';
  copy.steps.forEach(([title, description], i) => {
    document.querySelector(`#step-${i + 1}-title`).textContent = title;
    document.querySelector(`#step-${i + 1}-copy`).textContent = description;
  });
  document.querySelectorAll('[data-switch-role]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.switchRole === role));
  });
  setActiveStep(0);
  [email, instagram].forEach(clearError);
  confirmation.hidden = true;
  form.hidden = false;
}

document.querySelectorAll('input[name="role"]').forEach(input => {
  input.addEventListener('change', () => setRole(input.value));
});
document.querySelectorAll('[data-role]').forEach(link => {
  link.addEventListener('click', () => setRole(link.dataset.role));
});
document.querySelectorAll('[data-switch-role]').forEach(button => {
  button.addEventListener('click', () => setRole(button.dataset.switchRole));
});
storyCards.forEach((card, index) => {
  card.addEventListener('click', () => setActiveStep(index));
  card.addEventListener('focus', () => setActiveStep(index));
  card.addEventListener('pointerenter', () => {
    if (window.matchMedia('(hover: hover)').matches) setActiveStep(index);
  });
});
storyGrid.addEventListener('scroll', () => {
  if (!window.matchMedia('(max-width: 700px)').matches) return;
  const closest = storyCards.reduce((best, card, index) => {
    const distance = Math.abs(card.getBoundingClientRect().left - storyGrid.getBoundingClientRect().left);
    return distance < best.distance ? { index, distance } : best;
  }, { index: 0, distance: Infinity });
  if (closest.index !== activeStep) setActiveStep(closest.index);
}, { passive: true });
[email, instagram].forEach(input => input.addEventListener('input', () => clearError(input)));

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  const formError = document.querySelector('#form-error');
  formError.textContent = '';
  [email, instagram].forEach(clearError);
  email.value = email.value.trim();
  instagram.value = instagram.value.trim();
  const errors = [];
  if (!email.value || !email.validity.valid) errors.push([email, 'Please enter a valid email address.']);
  if (currentRole === 'stylist' && !/^@?[a-zA-Z0-9._]{1,30}$/.test(instagram.value)) {
    errors.push([instagram, 'Enter your Instagram handle, e.g. @yourname.']);
  }
  if (errors.length) {
    errors.forEach(([input, message]) => {
      input.setAttribute('aria-invalid', 'true');
      document.querySelector(`#${input.id}-error`).textContent = message;
    });
    errors[0][0].focus();
    return;
  }
  const payload = { role: currentRole, email: email.value, instagram: currentRole === 'stylist' ? instagram.value : '', website: form.elements.website.value };
  const signature = JSON.stringify(payload);
  if (!pendingSubmission || pendingSubmission.signature !== signature) pendingSubmission = { signature, id: crypto.randomUUID() };
  submitting = true;
  const controls = [...document.querySelectorAll('#signup-form input, #signup-form button, input[name="role"], [data-switch-role]')];
  const previousDisabled = controls.map(control => control.disabled);
  controls.forEach(control => { control.disabled = true; });
  form.setAttribute('aria-busy', 'true');
  document.querySelector('#submit-label').textContent = 'Sending…';
  try {
    const response = await fetch(new URL('api/signup', document.baseURI), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, id: pendingSubmission.id }), signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.error || 'Please try again. Your details are still here.');
    document.querySelector('#confirmation-title').textContent = content[payload.role].confirmation;
    document.querySelector('#confirmation-copy').textContent = content[payload.role].confirmationCopy;
    form.hidden = true;
    confirmation.hidden = false;
    form.reset();
    document.querySelector(`input[name="role"][value="${payload.role}"]`).checked = true;
    pendingSubmission = null;
    confirmation.focus({ preventScroll: true });
  } catch (error) {
    formError.textContent = error.name === 'TimeoutError' || error.name === 'TypeError'
      ? 'We couldn’t confirm your submission. Please try again. Your details are still here.' : error.message;
  } finally {
    submitting = false;
    controls.forEach((control, index) => { control.disabled = previousDisabled[index]; });
    form.removeAttribute('aria-busy');
    document.querySelector('#submit-label').textContent = content[currentRole].action;
  }
});
document.querySelector('#reset-form').addEventListener('click', () => {
  setRole(currentRole);
  email.focus({ preventScroll: true });
});
document.querySelector('#year').textContent = new Date().getFullYear();
setRole(new URLSearchParams(location.search).get('role') === 'stylist' ? 'stylist' : 'client');
