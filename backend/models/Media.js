const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  mainCategory: { 
    type: String, 
    required: true,
    enum: ['Video', 'Audio', 'Photography', 'AI Production', 'Digital']
  },
  
  // ---> CRITICAL FIX: Must be [String] instead of String <---
  subCategory: { type: [String], required: true }, 
  
  mediaUrl: { type: String, required: true },
  language: { type: String, default: '' },
  isPublic: { type: Boolean, default: true }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Media', mediaSchema);