const boxes = document.querySelectorAll('.code-boxes input');
const button = document.querySelector('button');
const errorBox = document.getElementById('err');
const ring = document.querySelector('.vault-ring');

boxes.forEach((box, index) => {
  box.addEventListener('input', () => {
    box.value = box.value.replace(/[^0-9]/g, '').slice(-1);
    if (box.value && boxes[index + 1]) {
      boxes[index + 1].focus();
    }
  });

  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !box.value && boxes[index - 1]) {
      boxes[index - 1].focus();
    }
  });
});

boxes[0].focus();

button.addEventListener('click', async () => {
  let code = '';
  boxes.forEach(box => code += box.value);

  errorBox.textContent = '';

  const res = await fetch('/api/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data = await res.json();

  if (data.ok) {
    ring.classList.add('opening');
    document.body.classList.add('opening');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 650);
  } else {
    errorBox.textContent = data.message;
    boxes.forEach(box => box.value = '');
    boxes[0].focus();
  }
});