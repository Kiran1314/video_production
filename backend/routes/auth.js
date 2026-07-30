const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Optional: Test route so visiting /api/auth in browser doesn't show "Cannot GET"
router.get('/', (req, res) => {
  res.json({ message: "Auth API endpoint is active. Use POST /api/auth/login to authenticate." });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate request body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Success response
    res.json({ token: 'mock-jwt-token-or-real-token', message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;