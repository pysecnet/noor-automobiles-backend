const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Upload images
router.post('/upload', authenticateToken, isAdmin, upload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileUrls = req.files.map(file => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename,
      originalName: file.originalname
    }));

    res.json({ message: 'Files uploaded successfully', files: fileUrls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
});

// Get all parts (public)
router.get('/', async (req, res) => {
  try {
    const { category, availability, featured, search } = req.query;
    
    let sql = 'SELECT * FROM parts WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (availability) {
      sql += ' AND availability = ?';
      params.push(availability);
    }

    if (featured === 'true') {
      sql += ' AND featured = 1';
    }

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY featured DESC, created_at DESC';

    const parts = await query.all(sql, params);
    
    const parsedParts = parts.map(part => ({
      ...part,
      images: JSON.parse(part.images || '[]')
    }));

    res.json(parsedParts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ message: 'Server error fetching parts' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await query.all('SELECT DISTINCT category FROM parts ORDER BY category');
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
});

// Get single part
router.get('/:id', async (req, res) => {
  try {
    const part = await query.get('SELECT * FROM parts WHERE id = ?', [req.params.id]);
    
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    part.images = JSON.parse(part.images || '[]');
    res.json(part);
  } catch (error) {
    console.error('Error fetching part:', error);
    res.status(500).json({ message: 'Server error fetching part' });
  }
});

// Add part (admin)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { name, category, description, images, availability, featured } = req.body;

  if (!name || !category) {
    return res.status(400).json({ message: 'Name and category are required' });
  }

  try {
    const result = await query.run(`
      INSERT INTO parts (name, category, description, images, availability, featured)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      name, category, description || null,
      JSON.stringify(images || []),
      availability || 'in_stock', featured ? 1 : 0
    ]);

    const newPart = await query.get('SELECT * FROM parts WHERE id = ?', [result.lastInsertRowid]);
    newPart.images = JSON.parse(newPart.images || '[]');

    res.status(201).json({ message: 'Part added successfully', part: newPart });
  } catch (error) {
    console.error('Error adding part:', error);
    res.status(500).json({ message: 'Server error adding part' });
  }
});

// Update part (admin)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  const partId = req.params.id;
  
  const existingPart = await query.get('SELECT id FROM parts WHERE id = ?', [partId]);
  if (!existingPart) {
    return res.status(404).json({ message: 'Part not found' });
  }

  const { name, category, description, images, availability, featured } = req.body;

  try {
    const updates = [];
    const params = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (images !== undefined) { updates.push('images = ?'); params.push(JSON.stringify(images)); }
    if (availability !== undefined) { updates.push('availability = ?'); params.push(availability); }
    if (featured !== undefined) { updates.push('featured = ?'); params.push(featured ? 1 : 0); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(partId);
    
    await query.run(`UPDATE parts SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedPart = await query.get('SELECT * FROM parts WHERE id = ?', [partId]);
    updatedPart.images = JSON.parse(updatedPart.images || '[]');

    res.json({ message: 'Part updated successfully', part: updatedPart });
  } catch (error) {
    console.error('Error updating part:', error);
    res.status(500).json({ message: 'Server error updating part' });
  }
});

// Delete part (admin)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const partId = req.params.id;

  try {
    const part = await query.get('SELECT id FROM parts WHERE id = ?', [partId]);
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }

    await query.run('DELETE FROM parts WHERE id = ?', [partId]);
    res.json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Error deleting part:', error);
    res.status(500).json({ message: 'Server error deleting part' });
  }
});

module.exports = router;
