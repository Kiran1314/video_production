const express = require('express');
const Category = require('../models/Category');
const router = express.Router();

// 1. GET ALL Categories (Formatted for the frontend state)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    
    // Transforms MongoDB array into the exact object your frontend uses:
    // { "Video": ["Event", "Testimonial"], "Audio": ["Music", "Dubbing"] }
    const formattedCategories = categories.reduce((acc, cat) => {
      acc[cat.name] = cat.subCategories;
      return acc;
    }, {});

    res.json(formattedCategories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREATE a New Main Category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });

    const newCategory = new Category({ name, subCategories: [] });
    await newCategory.save();
    
    res.json(newCategory);
  } catch (err) {
    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ error: "Main category already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// 3. ADD a Subcategory to an existing Main Category
router.post('/:name/subcategories', async (req, res) => {
  try {
    const { name } = req.params;
    const { subCategory } = req.body;

    if (!subCategory) return res.status(400).json({ error: "Subcategory is required" });

    // Find the main category and use $addToSet to prevent duplicate subcategories
    const updatedCategory = await Category.findOneAndUpdate(
      { name: name },
      { $addToSet: { subCategories: subCategory } },
      { new: true }
    );

    if (!updatedCategory) return res.status(404).json({ error: "Main category not found" });

    res.json(updatedCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. REMOVE a Subcategory from a Main Category
router.delete('/:name/subcategories/:subCatName', async (req, res) => {
  try {
    const { name, subCatName } = req.params;

    // Use $pull to remove the specific subcategory string from the array
    const updatedCategory = await Category.findOneAndUpdate(
      { name: name },
      { $pull: { subCategories: subCatName } },
      { new: true }
    );

    if (!updatedCategory) return res.status(404).json({ error: "Main category not found" });

    res.json(updatedCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE a Main Category entirely (Optional but good to have)
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await Category.findOneAndDelete({ name: name });
    res.json({ msg: "Main category deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;