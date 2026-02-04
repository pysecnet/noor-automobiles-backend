require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. TURSO DATABASE CONNECTION
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Make db accessible to routes
app.set('db', db);

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
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. DATABASE INITIALIZATION
const initializeDatabase = async () => {
  try {
    // Create Users Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Cars Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        mileage TEXT,
        engine TEXT,
        transmission TEXT,
        fuel_type TEXT,
        color TEXT,
        body_type TEXT,
        description TEXT,
        features TEXT,
        images TEXT,
        videos TEXT,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'sold', 'reserved', 'upcoming')),
        featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Parts Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        images TEXT,
        availability TEXT DEFAULT 'in_stock' CHECK(availability IN ('in_stock', 'out_of_stock', 'coming_soon')),
        featured INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Inquiries Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        car_id INTEGER,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'closed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Tables created');

    // Check if admin exists
    const adminCheck = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: ['admin@noor.com']
    });

    if (adminCheck.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await db.execute({
        sql: 'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
        args: ['Muneeb Noor', 'admin@noor.com', hashedPassword, '0324-1344368', 'admin']
      });
      console.log('✅ Admin user created: admin@noor.com / admin123');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Add sample car if none exist
    const carsCheck = await db.execute('SELECT COUNT(*) as count FROM cars');
    if (carsCheck.rows[0].count === 0) {
      await db.execute({
        sql: `INSERT INTO cars (title, brand, model, year, mileage, engine, transmission, fuel_type, color, body_type, description, features, images, videos, status, featured) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'Toyota Supra MK4 Twin Turbo', 'Toyota', 'Supra MK4', 1998, '45,000 km',
          '2JZ-GTE 3.0L Twin Turbo', '6-Speed Manual', 'Petrol', 'Super White', 'Coupe',
          'Legendary JDM sports car in pristine condition.',
          JSON.stringify(['Leather Interior', 'Targa Top']),
          JSON.stringify(['https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=800&q=80']),
          JSON.stringify([]), 'available', 1
        ]
      });
      console.log('✅ Sample car added');
    }

    console.log('🚀 Database initialized successfully');
  } catch (error) {
    console.error('❌ Database Init Error:', error);
  }
};

// 4. API ROUTES
const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const partsRoutes = require('./routes/parts');
const inquiriesRoutes = require('./routes/inquiries');

app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/inquiries', inquiriesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Noor Automobiles API is running' });
});

// 5. START SERVER
const start = async () => {
  await initializeDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
};

start();
