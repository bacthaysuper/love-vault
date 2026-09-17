const loginView = document.getElementById('loginView');
const logsView = document.getElementById('logsView');
const loginErr = document.getElementById('loginErr');

document.getElementById('loginBtn').addEventListener('click', async () => {
  const password = document.getElementById('pw').value;

  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();

  if (data.ok) {
    loginView.style.display = 'none';
    logsView.style.display = 'block';
    loadLogs();
    loadItemsManage();
  } else {
    loginErr.textContent = 'Wrong password';
  }
});

async function loadLogs() {
  const res = await fetch('/api/admin/logs');
  const logs = await res.json();

  const body = document.getElementById('logsBody');
  body.innerHTML = logs.map(log => `
    <tr>
      <td>${log.time}</td>
      <td>${log.itemId}</td>
      <td>${log.result}</td>
    </tr>
  `).join('');
}

async function loadItemsManage() {
  const res = await fetch('/api/admin/items');
  const items = await res.json();
  const el = document.getElementById('itemsList');

  el.innerHTML = items.map(item => `
    <div class="ledger-row">
      <span class="name">[${item.type}] ${item.name || item.secretName || item.question}</span>
      <button data-delete="${item.id}">Delete</button>
    </div>
  `).join('');

  el.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await fetch(`/api/admin/items/${btn.dataset.delete}`, { method: 'DELETE' });
      loadItemsManage();
    });
  });
}

document.getElementById('f-type').addEventListener('change', (e) => {
  const isPublic = e.target.value === 'public';
  document.getElementById('publicFields').style.display = isPublic ? 'block' : 'none';
  document.getElementById('secretFields').style.display = isPublic ? 'none' : 'block';
});

document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    category: document.getElementById('f-category').value,
    type: document.getElementById('f-type').value,
    name: document.getElementById('f-name').value,
    price: document.getElementById('f-price').value,
    question: document.getElementById('f-question').value,
    answer: document.getElementById('f-answer').value,
    secretName: document.getElementById('f-secretName').value,
    secretPrice: document.getElementById('f-secretPrice').value,
  };

  await fetch('/api/admin/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  e.target.reset();
  loadItemsManage();
});