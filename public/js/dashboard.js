async function loadItems() {
  const res = await fetch('/api/items');

  if (res.status === 403) {
    window.location.href = '/';
    return;
  }

  const items = await res.json();

  const travelItems = items.filter(item => item.category === 'travel');
  const shopItems = items.filter(item => item.category === 'shopping');

  renderList('travel-list', travelItems);
  renderList('shop-list', shopItems);

  updateTotal('travel-total', travelItems);
  updateTotal('shop-total', shopItems);
}

function renderList(elementId, items) {
  const listElement = document.getElementById(elementId);

  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.dataset.id = item.id;
    row.style.animationDelay = `${index * 60}ms`;

    if (item.type === 'secret') {
      row.className = 'ledger-row secret';
      row.innerHTML = `
        <span class="name">Secret item</span>
        <svg class="seal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
          <rect x="4" y="10" width="16" height="10" rx="1.5"></rect>
          <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
        </svg>
      `;
      row.addEventListener('click', () => openPuzzle(item));
    } else {
      row.className = 'ledger-row';
      row.innerHTML = `
        <label class="check">
          <input type="checkbox" ${item.completed ? 'checked' : ''}>
          <span class="name">${item.name}</span>
        </label>
        <span class="price">${item.price}</span>
      `;
      row.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleItem(item.id));
    }

    listElement.appendChild(row);
  });
}

async function toggleItem(itemId) {
  await fetch(`/api/items/${itemId}/toggle`, { method: 'POST' });
}

function updateTotal(elementId, items) {
  const total = items.reduce((sum, item) => {
    if (item.type === 'secret' && !item.price) return sum;
    const numeric = Number((item.price || '').replace(/[^\d]/g, ''));
    return sum + numeric;
  }, 0);

  document.getElementById(elementId).innerHTML = `Total: <strong>${total.toLocaleString('en-US')}₫</strong>`;
}

function recalculateTotal(category) {
  const totalId = category === 'travel' ? 'travel-total' : 'shop-total';
  const listId = category === 'travel' ? 'travel-list' : 'shop-list';
  const rows = document.querySelectorAll(`#${listId} .price`);
  const total = [...rows].reduce((sum, el) => sum + Number(el.textContent.replace(/[^\d]/g, '')), 0);
  document.getElementById(totalId).innerHTML = `Total: <strong>${total.toLocaleString('en-US')}₫</strong>`;
}

function openPuzzle(item) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>Solve to reveal</h3>
      <p>${item.question}</p>
      <input type="text" id="answerInput" placeholder="Your answer...">
      <div id="feedback"></div>
      <button id="checkBtn">Check</button>
      <button id="closeBtn">Close</button>
    </div>
  `;
  document.body.appendChild(backdrop);

  document.getElementById('closeBtn').addEventListener('click', () => closeModal(backdrop));

  document.getElementById('checkBtn').addEventListener('click', async () => {
    const answer = document.getElementById('answerInput').value;
    const feedback = document.getElementById('feedback');

    const res = await fetch(`/api/items/${item.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    const data = await res.json();

    if (data.ok) {
      feedback.textContent = `Correct! It's: ${data.name} — ${data.price}`;

      const row = document.querySelector(`.ledger-row[data-id="${item.id}"]`);
      row.innerHTML = `
        <label class="check">
          <input type="checkbox" ${item.completed ? 'checked' : ''}>
          <span class="name">${data.name}</span>
        </label>
        <span class="price">${data.price}</span>
      `;
      row.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleItem(item.id));

      recalculateTotal(item.category);
    } else {
      feedback.textContent = data.message;
    }
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal(backdrop);
  });
}

function closeModal(backdrop) {
  backdrop.classList.add('closing');
  setTimeout(() => backdrop.remove(), 150);
}

loadItems();