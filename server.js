require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const DOOR_CODE = '030326';
const ADMIN_PASSWORD = 'kRhenshin2k3';

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

app.post('/api/unlock', (req, res) => {
  const { code } = req.body;

  if (code === DOOR_CODE) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, message: 'Wrong code, try again' });
  }
});

app.get('/api/items', (req, res) => {
  const publicItems = loadPublicItems().map(item => ({
    ...item,
    type: 'public',
  }));

  const secretItems = loadSecretItems().map(item => ({
    id: item.id,
    category: item.category,
    type: 'secret',
    question: item.question,
    completed: item.completed,
  }));

  res.json([...publicItems, ...secretItems]);
});


function loadPublicItems() {
  const data = fs.readFileSync('./data/public-items.json', 'utf-8');
  return JSON.parse(data);
}

function savePublicItems(items) {
  fs.writeFileSync('./data/public-items.json', JSON.stringify(items, null, 2));
}

function saveSecretItems(items) {
  fs.writeFileSync('./data/secret-items.json', JSON.stringify(items, null, 2));
}

function loadSecretItems() {
  const data = fs.readFileSync('./data/secret-items.json', 'utf-8');
  return JSON.parse(data);
}

function logAttempt(itemId, isCorrect, submittedAnswer) {
  const logsData = fs.readFileSync('./data/logs.json', 'utf-8');
  const logs = JSON.parse(logsData);

  const entry = {
    time: new Date().toLocaleString('en-US'),
    itemId,
    result: isCorrect ? 'correct' : 'incorrect',
    submittedAnswer,
  };

  logs.unshift(entry);
  fs.writeFileSync('./data/logs.json', JSON.stringify(logs, null, 2));

  mailer.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: isCorrect ? 'Solved correctly!' : 'A wrong attempt',
    text: `Time: ${entry.time}\nItem: ${itemId}\nResult: ${entry.result}\nAnswer entered: ${submittedAnswer}`,
  }).catch(err => console.error('Email failed:', err.message));
}

app.post('/api/items/:id/verify', (req, res) => {
  const { answer } = req.body;
  const itemId = req.params.id;

  const secretItems = loadSecretItems();
  const item = secretItems.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ ok: false, message: 'Item not found' });
  }

  const userAnswer = (answer || '').trim().toLowerCase();
  const correctAnswer = item.answer.trim().toLowerCase();
  const isCorrect = userAnswer === correctAnswer;

  logAttempt(itemId, isCorrect, answer);

  if (isCorrect) {
    res.json({ ok: true, name: item.secretName, price: item.secretPrice });
  } else {
    res.json({ ok: false, message: 'Not quite, try again' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false });
  }

  res.cookie('admin_session', 'granted', { httpOnly: true });
  res.json({ ok: true });
});

app.get('/api/admin/logs', (req, res) => {
  if (req.cookies.admin_session !== 'granted') {
    return res.status(403).json({ ok: false, message: 'Not logged in' });
  }

  const logsData = fs.readFileSync('./data/logs.json', 'utf-8');
  const logs = JSON.parse(logsData);
  res.json(logs);
});

app.post('/api/items/:id/toggle', (req, res) => {
  const itemId = req.params.id;

  let items = loadPublicItems();
  let item = items.find(i => i.id === itemId);
  let isPublic = true;

  if (!item) {
    items = loadSecretItems();
    item = items.find(i => i.id === itemId);
    isPublic = false;
  }

  if (!item) {
    return res.status(404).json({ ok: false, message: 'Item not found' });
  }

  item.completed = !item.completed;

  if (isPublic) {
    savePublicItems(items);
  } else {
    saveSecretItems(items);
  }

  res.json({ ok: true, completed: item.completed });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});