require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@libsql/client');

const app = express();
// Render assigns a port automatically; 5000 is for your local testing
const PORT = process.env.PORT || 5000;

// 1. TURSO DATABASE CONNECTION
// We use process.env to keep your token safe on GitHub
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// 2. MIDDLEWARE
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://frontend-sable-zeta-68.vercel.app',
    'https://noorautomobiles.com',
    'https://www.noorautomobiles.com'
  ],
  credentials: true
}));// Critical: Allows your Vercel site to talk to this API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the uploads folder for car images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. DATABASE INITIALIZATION
// This creates your tables in the Turso Cloud if they don't exist yet
const initializeDatabase = async () => {
  try {
    // Create Cars Table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      price REAL,
      description TEXT,
      image TEXT,
      category TEXT,
      transmission TEXT,
      fuelType TEXT,
      year INTEGER
    )
    `);

    // Create Inquiries Table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carId INTEGER,
      name TEXT,
      email TEXT,
      phone TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

    console.log("🚀 Turso Database Connected & Tables Verified");
  } catch (error) {
    console.error("❌ Database Init Error:", error);
  }
};

// 4. API ROUTES
// Note: You must update these files to use the 'db' client as well
const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const partsRoutes = require('./routes/parts');
const inquiriesRoutes = require('./routes/inquiries');

app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/inquiries', inquiriesRoutes);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Noor Automobiles API is running on Turso' });
});

// 5. START SERVER
const start = async () => {
  await initializeDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
};

start();
