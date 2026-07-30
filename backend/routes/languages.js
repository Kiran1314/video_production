const express = require('express');
const Language = require('../models/Language');
const router = express.Router();

// 1. GET ALL Languages
router.get('/', async (req, res) => {
  try {
    const languages = await Language.find().sort({ name: 1 });
    res.json(languages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE a New Language
router.post('/', async (req, res) => {
  try {
    const { name, code, flagIcon } = req.body;
    if (!name || !code) return res.status(400).json({ error: "Name and code are required" });

    const newLang = new Language({ name, code, flagIcon });
    await newLang.save();
    res.json(newLang);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Language or code already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE a Language
router.delete('/:id', async (req, res) => {
  try {
    await Language.findByIdAndDelete(req.params.id);
    res.json({ msg: "Language deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;