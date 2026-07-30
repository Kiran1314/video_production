const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const mediaRoutes = require('./routes/media'); 
const categoryRoutes = require('./routes/categories'); 
const languageRoutes = require('./routes/languages');

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/videos', mediaRoutes); // <--- CHANGED FROM /api/media
app.use('/api/categories', categoryRoutes); 
app.use('/api/languages', languageRoutes);

// Connect DB & Start Server...
mongoose.connect('mongodb://localhost:27017/video-portal')
  .then(() => app.listen(5000, () => console.log('Backend running on port 5000')))
  .catch(err => console.log(err));