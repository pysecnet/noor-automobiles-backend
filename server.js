require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://frontend-sable-zeta-68.vercel.app',
    'https://noorautomobiles.com',
    'https://www.noorautomobiles.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Noor Automobiles API running' });
});

// Start server
const start = async () => {
  try {
    // Initialize database FIRST
    const { initializeDatabase } = require('./config/database');
    await initializeDatabase();
    
    // Load routes AFTER database is ready
    const authRoutes = require('./routes/auth');
    const carsRoutes = require('./routes/cars');
    const partsRoutes = require('./routes/parts');
    const inquiriesRoutes = require('./routes/inquiries');

    app.use('/api/auth', authRoutes);
    app.use('/api/cars', carsRoutes);
    app.use('/api/parts', partsRoutes);
    app.use('/api/inquiries', inquiriesRoutes);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
};

start();
