const bcrypt = require('bcryptjs');

const answer = process.argv[2];

if (!answer) {
  console.log('Usage: node hash-generator.js "your answer"');
  process.exit(1);
}

const normalized = answer.trim().toLowerCase();
const hash = bcrypt.hashSync(normalized, 10);

console.log('Hash:', hash);