const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

let db = null;

const initializeDatabase = async () => {
  // Create Turso client
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('✅ Connected to Turso database');

  // Create tables
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
  }

  // Check if sample cars exist
  const carsCheck = await db.execute('SELECT COUNT(*) as count FROM cars');
  if (carsCheck.rows[0].count === 0) {
    const sampleCars = [
      {
        title: 'Toyota Supra MK4 Twin Turbo',
        brand: 'Toyota',
        model: 'Supra MK4',
        year: 1998,
        mileage: '45,000 km',
        engine: '2JZ-GTE 3.0L Twin Turbo',
        transmission: '6-Speed Manual',
        fuel_type: 'Petrol',
        color: 'Super White',
        body_type: 'Coupe',
        description: 'Legendary JDM sports car in pristine condition.',
        features: JSON.stringify(['Leather Interior', 'Targa Top', 'Original BBS Wheels']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=800&q=80']),
        videos: JSON.stringify([]),
        status: 'available',
        featured: 1
      },
      {
        title: 'Nissan Skyline GT-R R34 V-Spec',
        brand: 'Nissan',
        model: 'Skyline GT-R R34',
        year: 2002,
        mileage: '38,000 km',
        engine: 'RB26DETT 2.6L Twin Turbo',
        transmission: '6-Speed Manual',
        fuel_type: 'Petrol',
        color: 'Bayside Blue',
        body_type: 'Coupe',
        description: 'The crown jewel of JDM culture.',
        features: JSON.stringify(['ATTESA E-TS Pro AWD', 'Brembo Brakes', 'Recaro Seats']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&q=80']),
        videos: JSON.stringify([]),
        status: 'available',
        featured: 1
      },
      {
        title: 'Honda NSX Type R',
        brand: 'Honda',
        model: 'NSX Type R',
        year: 2004,
        mileage: '28,000 km',
        engine: 'C32B 3.2L V6 VTEC',
        transmission: '6-Speed Manual',
        fuel_type: 'Petrol',
        color: 'Championship White',
        body_type: 'Coupe',
        description: 'The ultimate Honda engineering excellence.',
        features: JSON.stringify(['Carbon Fiber Hood', 'Recaro Bucket Seats']),
        images: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80']),
        videos: JSON.stringify([]),
        status: 'available',
        featured: 1
      }
    ];

    for (const car of sampleCars) {
      await db.execute({
        sql: `INSERT INTO cars (title, brand, model, year, mileage, engine, transmission, fuel_type, color, body_type, description, features, images, videos, status, featured) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [car.title, car.brand, car.model, car.year, car.mileage, car.engine, car.transmission, car.fuel_type, car.color, car.body_type, car.description, car.features, car.images, car.videos, car.status, car.featured]
      });
    }
    console.log('✅ Sample cars inserted');
  }

  // Check if sample parts exist
  const partsCheck = await db.execute('SELECT COUNT(*) as count FROM parts');
  if (partsCheck.rows[0].count === 0) {
    const sampleParts = [
      {
        name: '2JZ-GTE Twin Turbo Engine',
        category: 'Engine Parts',
        description: 'Complete 2JZ-GTE engine from Toyota Supra. Fully rebuilt.',
        images: JSON.stringify(['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80']),
        availability: 'in_stock',
        featured: 1
      },
      {
        name: 'Brembo GT Big Brake Kit',
        category: 'Body Parts',
        description: '6-piston front brake kit with 380mm rotors.',
        images: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80']),
        availability: 'in_stock',
        featured: 1
      },
      {
        name: 'Recaro Bucket Seats (Pair)',
        category: 'Accessories',
        description: 'Genuine Recaro SPG bucket seats with rails.',
        images: JSON.stringify(['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80']),
        availability: 'in_stock',
        featured: 1
      }
    ];

    for (const part of sampleParts) {
      await db.execute({
        sql: 'INSERT INTO parts (name, category, description, images, availability, featured) VALUES (?, ?, ?, ?, ?, ?)',
        args: [part.name, part.category, part.description, part.images, part.availability, part.featured]
      });
    }
    console.log('✅ Sample parts inserted');
  }

  console.log('✅ Database initialized successfully');
  return db;
};

const query = {
  all: async (sql, params = []) => {
    try {
      const result = await db.execute({ sql, args: params });
      return result.rows;
    } catch (err) {
      console.error('Query error:', err);
      return [];
    }
  },
  
  get: async (sql, params = []) => {
    try {
      const result = await db.execute({ sql, args: params });
      return result.rows[0] || null;
    } catch (err) {
      console.error('Query error:', err);
      return null;
    }
  },
  
  run: async (sql, params = []) => {
    try {
      const result = await db.execute({ sql, args: params });
      return {
        lastInsertRowid: result.lastInsertRowid,
        changes: result.rowsAffected
      };
    } catch (err) {
      console.error('Query error:', err);
      throw err;
    }
  }
};

const getDb = () => db;

module.exports = { initializeDatabase, getDb, query };
