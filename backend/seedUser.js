const mongoose = require('mongoose');
const User = require('./models/User');

async function createInitialUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/video-portal');
    
    const adminUser = new User({
      username: 'admin',
      password: 'securepassword123' // (Note: In production, ensure you hash passwords with bcrypt!)
    });

    await adminUser.save();
    console.log("User collection created and initial user added!");
    process.exit();
  } catch (err) {
    console.error("Error creating user collection:", err);
    process.exit(1);
  }
}

createInitialUser();