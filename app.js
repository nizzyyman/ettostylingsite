const content = {
  client: {
    description: 'for a stylist who sees the person you already are.',
    action: 'Join the list',
    stepsDescription: 'Not a new you. A wardrobe that feels like you.\nHere’s how we get there.',
    steps: [
      ['Tell us what you’re looking for', 'Your taste, your everyday, and what you want to feel. We start with you.'],
      ['Meet your stylist', 'Find someone who gets your eye, your life, and where you want to go.'],
      ['New wardrobe, more you', 'Make room for pieces that feel right. And a style that feels entirely your own.'],
    ],
    confirmation: 'A little closer to you.',
    confirmationCopy: 'This is where your waitlist confirmation will appear. This preview hasn’t sent or saved your details.',
  },
  stylist: {
    description: 'as a stylist, and ready to make your mark.',
    action: 'Apply to style',
    stepsDescription: 'Your eye. Their next chapter.\nMake a living bringing personal style to life.',
    steps: [
      ['Show us your eye', 'Share your perspective and the work that makes your style unmistakably yours.'],
      ['Get matched with clients', 'Connect with people who are looking for exactly your kind of vision.'],
      ['Grow your practice', 'Build lasting relationships, do meaningful work, and keep creating.'],
    ],
    confirmation: 'Your eye belongs here.',
    confirmationCopy: 'This is where your stylist application confirmation will appear. This preview hasn’t sent or saved your details.',
  },
};

const form = document.querySelector('#signup-form');
const confirmation = document.querySelector('#confirmation');
const email = document.querySelector('#email');
const instagram = document.querySelector('#instagram');
let currentRole = 'client';

function clearError(input) {
  input.removeAttribute('aria-invalid');
  document.querySelector(`#${input.id}-error`).textContent = '';
}

function setRole(role) {
  if (!content[role]) return;
  currentRole = role;
  const copy = content[role];
  document.querySelector(`input[name="role"][value="${role}"]`).checked = true;
  document.querySelector('#role-description').textContent = copy.description;
  document.querySelector('#submit-label').textContent = copy.action;
  document.querySelector('#closing-label').textContent = copy.action;
  document.querySelector('#steps-description').textContent = copy.stepsDescription;
  document.querySelector('#steps-description').style.whiteSpace = 'pre-line';
  document.querySelector('#instagram-field').hidden = role !== 'stylist';
  instagram.required = role === 'stylist';
  instagram.disabled = role !== 'stylist';
  copy.steps.forEach(([title, description], i) => {
    document.querySelector(`#step-${i + 1}-title`).textContent = title;
    document.querySelector(`#step-${i + 1}-copy`).textContent = description;
  });
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
[email, instagram].forEach(input => input.addEventListener('input', () => clearError(input)));

form.addEventListener('submit', event => {
  event.preventDefault();
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
  // Frontend preview only. Connect a signup service here when one is ready.
  document.querySelector('#confirmation-title').textContent = content[currentRole].confirmation;
  document.querySelector('#confirmation-copy').textContent = content[currentRole].confirmationCopy;
  form.hidden = true;
  confirmation.hidden = false;
  form.reset();
  confirmation.focus({ preventScroll: true });
});
document.querySelector('#reset-form').addEventListener('click', () => {
  setRole(currentRole);
  email.focus({ preventScroll: true });
});
document.querySelector('#year').textContent = new Date().getFullYear();
setRole('client');
