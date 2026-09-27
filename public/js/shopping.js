async function loadBasket() {
  const res = await fetch('/api/items');

  if (res.status === 403) {
    window.location.href = '/';
    return;
  }

  const items = await res.json();
  const shopItems = items.filter(item => item.category === 'shopping');

  const grid = document.getElementById('basketGrid');
  grid.innerHTML = '';

  shopItems.forEach(item => {
    const box = document.createElement('button');
    box.className = 'gift-box' + (item.completed ? ' done' : '');
    box.innerHTML = `
      <svg viewBox="0 0 64 64">
        <rect class="box-body" x="8" y="24" width="48" height="34" rx="3"/>
        <rect class="box-ribbon" x="28" y="24" width="8" height="34"/>
        <rect class="box-body" x="4" y="16" width="56" height="12" rx="3"/>
        <rect class="box-ribbon" x="28" y="16" width="8" height="12"/>
        ${item.type === 'secret'
          ? '<path class="box-mark" d="M26 8 a6 6 0 1 1 8 6 c-2 1.5 -2 3 -2 4 M32 22.5 v0.1"/>'
          : ''}
      </svg>
      <span>${item.type === 'public' ? item.name : 'Secret gift'}</span>
    `;

    box.addEventListener('click', () => handleBoxClick(item, box));
    grid.appendChild(box);
  });
}

function handleBoxClick(item, box) {
  box.classList.add('shaking');
  setTimeout(() => {
    box.classList.remove('shaking');
    if (item.type === 'secret') {
      openPuzzle(item);
    } else {
      openInfo(item);
    }
  }, 400);
}

function openInfo(item) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-backdrop" id="backdrop">
      <div class="modal">
        <h3>${item.name}</h3>
        <p>${item.price}</p>
        <label class="check">
          <input type="checkbox" id="doneCheck" ${item.completed ? 'checked' : ''}>
          <span class="name">Mark as done</span>
        </label>
        <button id="closeBtn">Close</button>
      </div>
    </div>
  `;

  document.getElementById('closeBtn').addEventListener('click', () => closeModal(root.firstElementChild));
  document.getElementById('backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'backdrop') closeModal(root.firstElementChild);
  });
  document.getElementById('doneCheck').addEventListener('change', async () => {
    await fetch(`/api/items/${item.id}/toggle`, { method: 'POST' });
    closeModal(root.firstElementChild);
    loadBasket();
  });
}

function openPuzzle(item) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `
    <div class="modal-backdrop" id="backdrop">
      <div class="modal">
        <h3>Solve to reveal</h3>
        <p>${item.question}</p>
        <input type="text" id="answerInput" placeholder="Your answer...">
        <div id="feedback"></div>
        <button id="checkBtn">Check</button>
        <button id="closeBtn">Close</button>
      </div>
    </div>
  `;

  document.getElementById('closeBtn').addEventListener('click', () => closeModal(root.firstElementChild));
  document.getElementById('backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'backdrop') closeModal(root.firstElementChild);
  });

  document.getElementById('checkBtn').addEventListener('click', async () => {
    const answer = document.getElementById('answerInput').value;
    const feedback = document.getElementById('feedback');

    const res = await fetch(`/api/items/${item.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    const data = await res.json();

    feedback.textContent = data.ok ? `Correct! It's: ${data.name} — ${data.price}` : data.message;
  });
}

function closeModal(backdrop) {
  backdrop.classList.add('closing');
  setTimeout(() => backdrop.remove(), 150);
}

loadBasket();