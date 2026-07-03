const express = require('express');
const multer = require('multer');
const path = require('path');
const Video = require('../models/Video');
const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `prod_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// 1. Create (Upload MP4 or YouTube Link)
router.post('/', upload.single('video'), async (req, res) => {
  try {
    const { title, description, category, youtubeLink } = req.body;
    
    let videoUrl = '';
    
    // Check if it's a YouTube link first, otherwise look for the uploaded file
    if (youtubeLink) {
      videoUrl = youtubeLink;
    } else if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
    } else {
      return res.status(400).json({ error: "Please provide an MP4 file or a YouTube link." });
    }

    const newVideo = new Video({ title, description, category, videoUrl });
    await newVideo.save();
    res.json(newVideo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read All (with Pagination & Filter)
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    // Start with the public filter
    let query = { isPublic: { $ne: false } };

    if (search) {
      // Search matches title OR category
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    } else if (category) {
      // Fallback if only category is provided separately
      query.category = category;
    }

    const videos = await Video.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Video.countDocuments(query);
    res.json({ videos, totalPages: Math.ceil(count / limit), currentPage: page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete Single
router.delete('/:id', async (req, res) => {
  try {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Bulk Delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    await Video.deleteMany({ _id: { $in: ids } });
    res.json({ msg: 'Videos deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update (Edit Metadata & Visibility)
router.put('/:id', async (req, res) => {
  try {
    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { returnDocument: 'after' } // <--- Warning permanently fixed here
    );
    res.json(updatedVideo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;