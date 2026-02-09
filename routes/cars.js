const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');

// Upload files endpoint
router.post('/upload', authenticateToken, isAdmin, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileUrls = req.files.map(file => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        url: file.path,
        type: isVideo ? 'video' : 'image',
        publicId: file.filename,
        originalName: file.originalname
      };
    });

    res.json({ message: 'Files uploaded successfully', files: fileUrls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
});

// Reorder cars (admin only) - MUST BE BEFORE /:id route
router.put('/reorder', authenticateToken, isAdmin, async (req, res) => {
  const { carIds } = req.body;
  
  if (!carIds || !Array.isArray(carIds)) {
    return res.status(400).json({ message: 'carIds array is required' });
  }

  try {
    for (let i = 0; i < carIds.length; i++) {
      await query.run('UPDATE cars SET display_order = ? WHERE id = ?', [i, carIds[i]]);
    }
    
    res.json({ message: 'Cars reordered successfully' });
  } catch (error) {
    console.error('Error reordering cars:', error);
    res.status(500).json({ message: 'Server error reordering cars' });
  }
});

// Get all cars (public)
router.get('/', async (req, res) => {
  try {
    const { brand, status, featured, search, upcoming } = req.query;
    
    let sql = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (brand) {
      sql += ' AND brand = ?';
      params.push(brand);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (featured === 'true') {
      sql += ' AND featured = 1';
    }

    if (upcoming === 'true') {
      sql += ' AND status = ?';
      params.push('upcoming');
    }

    if (search) {
      sql += ' AND (title LIKE ? OR brand LIKE ? OR model LIKE ? OR description LIKE ?)';
      const searchTerm = '%' + search + '%';
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY featured DESC, display_order ASC, created_at DESC';

    const cars = await query.all(sql, params);
    
    const parsedCars = cars.map(car => ({
      ...car,
      features: JSON.parse(car.features || '[]'),
      images: JSON.parse(car.images || '[]'),
      videos: JSON.parse(car.videos || '[]')
    }));

    res.json(parsedCars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Server error fetching cars' });
  }
});

// Get single car (public)
router.get('/:id', async (req, res) => {
  try {
    const car = await query.get('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.features = JSON.parse(car.features || '[]');
    car.images = JSON.parse(car.images || '[]');
    car.videos = JSON.parse(car.videos || '[]');

    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ message: 'Server error fetching car' });
  }
});

// Get all brands (public)
router.get('/meta/brands', async (req, res) => {
  try {
    const brands = await query.all('SELECT DISTINCT brand FROM cars ORDER BY brand');
    res.json(brands.map(b => b.brand));
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Server error fetching brands' });
  }
});

// Add new car (admin only)
router.post('/', authenticateToken, isAdmin, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1900, max: 2030 }).withMessage('Valid year is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title, brand, model, year, mileage, engine, transmission,
    fuel_type, color, body_type, description, features, images, videos, status, featured
  } = req.body;

  try {
    const result = await query.run(
      'INSERT INTO cars (title, brand, model, year, mileage, engine, transmission, fuel_type, color, body_type, description, features, images, videos, status, featured, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title, brand, model, year, mileage || null, engine || null, transmission || null,
        fuel_type || null, color || null, body_type || null, description || null,
        JSON.stringify(features || []), JSON.stringify(images || []), JSON.stringify(videos || []),
        status || 'available', featured ? 1 : 0, Date.now()
      ]
    );

    const newCar = await query.get('SELECT * FROM cars WHERE id = ?', [result.lastInsertRowid]);
    newCar.features = JSON.parse(newCar.features || '[]');
    newCar.images = JSON.parse(newCar.images || '[]');
    newCar.videos = JSON.parse(newCar.videos || '[]');

    res.status(201).json({ message: 'Car added successfully', car: newCar });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ message: 'Server error adding car' });
  }
});

// Update car (admin only)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  const carId = req.params.id;
  
  const existingCar = await query.get('SELECT id FROM cars WHERE id = ?', [carId]);
  if (!existingCar) {
    return res.status(404).json({ message: 'Car not found' });
  }

  const {
    title, brand, model, year, mileage, engine, transmission,
    fuel_type, color, body_type, description, features, images, videos, status, featured
  } = req.body;

  try {
    const updates = [];
    const params = [];
    
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (brand !== undefined) { updates.push('brand = ?'); params.push(brand); }
    if (model !== undefined) { updates.push('model = ?'); params.push(model); }
    if (year !== undefined) { updates.push('year = ?'); params.push(year); }
    if (mileage !== undefined) { updates.push('mileage = ?'); params.push(mileage); }
    if (engine !== undefined) { updates.push('engine = ?'); params.push(engine); }
    if (transmission !== undefined) { updates.push('transmission = ?'); params.push(transmission); }
    if (fuel_type !== undefined) { updates.push('fuel_type = ?'); params.push(fuel_type); }
    if (color !== undefined) { updates.push('color = ?'); params.push(color); }
    if (body_type !== undefined) { updates.push('body_type = ?'); params.push(body_type); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (features !== undefined) { updates.push('features = ?'); params.push(JSON.stringify(features)); }
    if (images !== undefined) { updates.push('images = ?'); params.push(JSON.stringify(images)); }
    if (videos !== undefined) { updates.push('videos = ?'); params.push(JSON.stringify(videos)); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (featured !== undefined) { updates.push('featured = ?'); params.push(featured ? 1 : 0); }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(carId);
    
    await query.run('UPDATE cars SET ' + updates.join(', ') + ' WHERE id = ?', params);

    const updatedCar = await query.get('SELECT * FROM cars WHERE id = ?', [carId]);
    updatedCar.features = JSON.parse(updatedCar.features || '[]');
    updatedCar.images = JSON.parse(updatedCar.images || '[]');
    updatedCar.videos = JSON.parse(updatedCar.videos || '[]');

    res.json({ message: 'Car updated successfully', car: updatedCar });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ message: 'Server error updating car' });
  }
});

// Delete car (admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const carId = req.params.id;

  try {
    const car = await query.get('SELECT images, videos FROM cars WHERE id = ?', [carId]);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    await query.run('DELETE FROM cars WHERE id = ?', [carId]);
    
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ message: 'Server error deleting car' });
  }
});

module.exports = router;
