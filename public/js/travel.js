const map = L.map('map').setView([16.0, 106.0], 5.5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 18,
}).addTo(map);

async function loadMap() {
  const res = await fetch('/api/items');

  if (res.status === 403) {
    window.location.href = '/';
    return;
  }

  const items = await res.json();
  const travelItems = items.filter(item => item.category === 'travel');

  travelItems.forEach(item => {
    const marker = L.circleMarker([item.lat, item.lng], {
      radius: 9,
      fillColor: item.completed ? '#97a396' : '#e0335f',
      color: '#fffaf3',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);

    marker.on('click', () => openMarker(item));
  });
}

function openMarker(item) {
  if (item.type === 'secret') {
    openPuzzle(item);
  } else {
    openInfo(item);
  }
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
    map.eachLayer(layer => { if (layer instanceof L.CircleMarker) map.removeLayer(layer); });
    loadMap();
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

loadMap();