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
  } else {
    loginErr.textContent = 'Wrong password';
  }
});

async function loadLogs() {
  const res = await fetch('/api/admin/logs');
  const logs = await res.json();

  const body = document.getElementById('logsBody');
  body.innerHTML = '';

  logs.forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.time}</td>
      <td>${log.itemId}</td>
      <td>${log.result}</td>
    `;
    body.appendChild(row);
  });
}