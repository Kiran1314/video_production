const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true // e.g., 'English', 'Arabic'
  },
  code: { 
    type: String, 
    required: true, 
    unique: true // e.g., 'en', 'ar'
  },
  flagIcon: { 
    type: String, 
    default: '' // URL or SVG link for the flag icon
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Language', languageSchema);