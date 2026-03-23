'use strict';

const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Kullanım: node scripts/hash-password.js <şifre>');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log('\nBcrypt hash:');
  console.log(hash);
  console.log('\n.env dosyasına ADMIN_PASSWORD= değeri olarak yapıştır.\n');
});
