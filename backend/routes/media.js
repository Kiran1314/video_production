const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const Media = require('../models/Media'); 
const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    // Dynamically keeps the extension (.mp3, .jpg, .mp4)
    cb(null, `media_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// 1. Create (Upload File or External Link)
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, description, mainCategory, subCategory, language, link } = req.body;
    let mediaUrl = '';
    
    // Check for "link" instead of "youtubeLink"
    if (link) {
      mediaUrl = link;
    } else if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
    } else {
      return res.status(400).json({ error: "Provide a file or valid link." });
    }

    // Safely normalize subCategory to an Array 
    // (FormData sends a string if 1 item, or an array if multiple)
    let normalizedSubCategory = [];
    if (subCategory) {
      normalizedSubCategory = Array.isArray(subCategory) ? subCategory : [subCategory];
    }

    const newMedia = new Media({ 
      title, 
      description, 
      mainCategory, 
      subCategory: normalizedSubCategory, 
      mediaUrl, 
      language 
    });
    
    await newMedia.save();
    res.json(newMedia);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Read All (with Pagination, Search & Main Category Filter)
router.get('/', async (req, res) => {
  try {
    const { mainCategory, search, page = 1, limit = 10 } = req.query;
    
    let query = { isPublic: { $ne: false } };

    if (mainCategory && mainCategory !== 'All') {
      query.mainCategory = mainCategory;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subCategory: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Media.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await Media.countDocuments(query);
    res.json({ items, totalPages: Math.ceil(count / limit), currentPage: page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete Single
router.delete('/:id', async (req, res) => {
  try {
    await Media.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Bulk Delete
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    await Media.deleteMany({ _id: { $in: ids } });
    res.json({ msg: 'Bulk delete successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update Metadata & Visibility (CRASH FIX APPLIED HERE)
router.put('/:id', async (req, res) => {
  try {
    const updatedMedia = await Media.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true } // Changed from { returnDocument: 'after' } to safely return updated doc
    );
    
    if (!updatedMedia) {
      return res.status(404).json({ error: "Media item not found." });
    }
    
    res.json(updatedMedia);
  } catch (err) {
    console.error("Backend PUT Error:", err); 
    res.status(500).json({ error: err.message });
  }
});

// 6. Bulk Import
router.post('/bulk-import', upload.single('file'), async (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      // Split comma-separated CSV subcategories into an array
      const subCats = data.SubCategory ? data.SubCategory.split(',').map(s => s.trim()) : [];
      
      results.push({
        title: data.Title,
        mainCategory: data.MainCategory || req.body.defaultMainCategory || 'Video',
        subCategory: subCats,
        description: data.Description,
        mediaUrl: data.Link,
        language: data.Language || '',
        isPublic: true
      });
    })
    .on('end', async () => {
      await Media.insertMany(results);
      fs.unlinkSync(req.file.path); 
      res.json({ msg: 'Import successful', count: results.length });
    });
});

module.exports = router;