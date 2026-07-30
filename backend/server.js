const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const mediaRoutes = require('./routes/media'); 
const categoryRoutes = require('./routes/categories'); 
const languageRoutes = require('./routes/languages');
const authRoutes = require('./routes/auth'); // <--- 1. IMPORT AUTH ROUTES

const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/videos', mediaRoutes); 
app.use('/api/categories', categoryRoutes); 
app.use('/api/languages', languageRoutes);
app.use('/api/auth', authRoutes); // <--- 2. MOUNT UNDER /api/auth

mongoose.connect('mongodb://localhost:27017/video-portal')
  .then(() => app.listen(5000, () => console.log('Backend running on port 5000')))
  .catch(err => console.log(err));