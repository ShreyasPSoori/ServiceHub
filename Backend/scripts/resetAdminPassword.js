const mongoose = require('mongoose');
const readline = require('readline');
const path = require('path');
// Safely resolve the .env path relative to this script's directory so it works regardless of where node is invoked from
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function resetPassword() {
  try {
    let newPassword = process.env.NEW_ADMIN_PASSWORD;
    
    if (!newPassword) {
      newPassword = await askQuestion('Enter new password for admin123@test.com: ');
    }
    
    if (!newPassword) {
      console.log('[FAIL] No password provided. Exiting.');
      process.exit(1);
    }

    if (!process.env.MONGO_URI) {
      console.log('[FAIL] MONGO_URI is undefined. Please ensure .env exists in the Backend directory and contains MONGO_URI.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    
    // Find the admin user
    const user = await User.findOne({ email: 'admin123@test.com' });
    if (!user) {
      console.log('[FAIL] Admin user admin123@test.com not found in the database.');
      process.exit(1);
    }
    
    // Assign the new password (the Mongoose pre-save hook will hash it)
    user.password = newPassword;
    await user.save();
    
    console.log('[PASS] Password successfully updated in MongoDB.');
    
    // Re-fetch the user to verify the save and test login functionality
    const updatedUser = await User.findById(user._id);
    
    // Verify password via the same matchPassword method the login controller uses
    const isMatch = await updatedUser.matchPassword(newPassword);
    
    if (isMatch) {
      console.log('[PASS] Login verification successful (password hash validated).');
      if (updatedUser.role === 'admin') {
        console.log('[PASS] Role is confirmed as "admin".');
      } else {
        console.log(`[FAIL] Login successful, but role is "${updatedUser.role}" instead of admin.`);
      }
    } else {
      console.log('[FAIL] Login verification failed. Password match returned false.');
    }
    
  } catch (error) {
    console.error('[ERROR]', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    rl.close();
  }
}

resetPassword();
