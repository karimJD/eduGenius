const bcrypt = require('bcryptjs');

const password = 'adminpassword123';
const hash = '$2b$10$0YSHhDdR4qsIgNJxuN9/tO58gawM5bJ7cwKs7mwj8np2WaE7OoH62';

async function checkPassword() {
  const isMatch = await bcrypt.compare(password, hash);
  console.log(`Password matches hash: ${isMatch}`);
}

checkPassword();
