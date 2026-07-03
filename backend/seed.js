// backend/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('securepassword123', salt);
    
    await User.create({ 
      username: 'admin', 
      password: hashedPassword 
    });
    
    console.log('Admin seeded successfully!');
    process.exit();
  });