const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('User Model Unit Tests', () => {
  
  test('Should verify correct password', async () => {
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      password: hashedPassword
    });

    const isMatch = await user.matchPassword(password);
    expect(isMatch).toBe(true);
  });

  test('Should reject incorrect password', async () => {
    const user = new User({
      password: 'hashed_password_here' 
    });
    
    const isMatch = await user.matchPassword('wrongpassword');
    expect(isMatch).toBe(false);
  });
});
