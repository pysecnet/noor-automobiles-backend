require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check (available before DB init)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Noor Automobiles API is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database (async for sql.js)
    await initializeDatabase();
    
    // Load routes after database is ready
    const authRoutes = require('./routes/auth');
    const carsRoutes = require('./routes/cars');
    const inquiriesRoutes = require('./routes/inquiries');

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/cars', carsRoutes);
    app.use('/api/inquiries', inquiriesRoutes);

    // Serve static files from React app in production
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../frontend/dist')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
      });
    }

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Something went wrong!' });
    });

    // Start server

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
