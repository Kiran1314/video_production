const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  videoUrl: { type: String, required: true },
  
  // This line must be present!
  isPublic: { type: Boolean, default: true }, 
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);