const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Submit inquiry (public)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('phone').optional().trim(),
  body('car_id').optional().isInt()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, phone, car_id, message } = req.body;

  try {
    // Verify car exists if car_id provided
    if (car_id) {
      const car = query.get('SELECT id FROM cars WHERE id = ?', [car_id]);
      if (!car) {
        return res.status(400).json({ message: 'Invalid car reference' });
      }
    }

    const result = query.run(`
      INSERT INTO inquiries (name, email, phone, car_id, message)
      VALUES (?, ?, ?, ?, ?)
    `, [name, email, phone || null, car_id || null, message]);

    res.status(201).json({ 
      message: 'Inquiry submitted successfully. We will contact you soon!',
      inquiry_id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({ message: 'Server error submitting inquiry' });
  }
});

// Get all inquiries (admin only)
router.get('/', authenticateToken, isAdmin, (req, res) => {
  try {
    const { status } = req.query;
    
    let sql = `
      SELECT i.*, c.title as car_title, c.brand as car_brand
      FROM inquiries i
      LEFT JOIN cars c ON i.car_id = c.id
    `;
    const params = [];
    
    if (status) {
      sql += ' WHERE i.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY i.created_at DESC';

    const inquiries = query.all(sql, params);

    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Server error fetching inquiries' });
  }
});

// Update inquiry status (admin only)
router.put('/:id', authenticateToken, isAdmin, [
  body('status').isIn(['pending', 'contacted', 'closed']).withMessage('Invalid status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status } = req.body;
  const inquiryId = req.params.id;

  try {
    const inquiry = query.get('SELECT id FROM inquiries WHERE id = ?', [inquiryId]);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    query.run('UPDATE inquiries SET status = ? WHERE id = ?', [status, inquiryId]);

    res.json({ message: 'Inquiry status updated' });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ message: 'Server error updating inquiry' });
  }
});

// Delete inquiry (admin only)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const inquiry = query.get('SELECT id FROM inquiries WHERE id = ?', [req.params.id]);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    query.run('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ message: 'Server error deleting inquiry' });
  }
});

// Get dashboard stats (admin only)
router.get('/stats/dashboard', authenticateToken, isAdmin, (req, res) => {
  try {
    const totalCars = query.get('SELECT COUNT(*) as count FROM cars')?.count || 0;
    const availableCars = query.get("SELECT COUNT(*) as count FROM cars WHERE status = 'available'")?.count || 0;
    const soldCars = query.get("SELECT COUNT(*) as count FROM cars WHERE status = 'sold'")?.count || 0;
    const reservedCars = query.get("SELECT COUNT(*) as count FROM cars WHERE status = 'reserved'")?.count || 0;
    const totalInquiries = query.get('SELECT COUNT(*) as count FROM inquiries')?.count || 0;
    const pendingInquiries = query.get("SELECT COUNT(*) as count FROM inquiries WHERE status = 'pending'")?.count || 0;
    const totalUsers = query.get('SELECT COUNT(*) as count FROM users')?.count || 0;

    res.json({
      totalCars,
      availableCars,
      soldCars,
      reservedCars,
      totalInquiries,
      pendingInquiries,
      totalUsers
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

module.exports = router;
