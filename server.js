require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@libsql/client');

const app = express();
// Render sets the PORT automatically. Default to 5000 for local dev.
const PORT = process.env.PORT || 5000;

// 1. TURSO DATABASE CONNECTION
// On Render, add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to Environment Variables
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// 2. MIDDLEWARE
app.use(cors()); // Allows your Vercel frontend to talk to this API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the uploads folder (for car images)
// Note: Files uploaded here will be deleted when Render restarts 
// unless you use a persistent disk or Cloudinary.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. API HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Noor Automobiles API is live',
    database: 'Turso Cloud' 
  });
});

// 4. LOAD ROUTES
// IMPORTANT: Ensure these files don't try to serve index.html inside them
const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const partsRoutes = require('./routes/parts');
const inquiriesRoutes = require('./routes/inquiries');

app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/inquiries', inquiriesRoutes);

// 5. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// 6. START SERVER
// We bind to 0.0.0.0 so Render can detect the service
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
