const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../database.sqlite');

let db = null;

const initializeDatabase = async () => {
  const SQL = await initSqlJs();
  
  db = new SQL.Database();
  console.log('New database created');

  db.run(`
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

  db.run(`
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

  db.run(`
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

  db.run(`
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

  // Create admin user
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  try {
    db.run(`
      INSERT INTO users (name, email, password, phone, role) 
      VALUES (?, ?, ?, ?, ?)
    `, ['Muneeb Noor', 'admin@noor.com', hashedPassword, '0324-1344368', 'admin']);
    console.log('✅ Admin user created: admin@noor.com / admin123');
  } catch (e) {
    console.log('Admin user already exists');
  }

  // Sample cars
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
    },
    {
      title: 'Toyota GR Supra 2024',
      brand: 'Toyota',
      model: 'GR Supra',
      year: 2024,
      mileage: '0 km',
      engine: '3.0L Turbo I6',
      transmission: '8-Speed Automatic',
      fuel_type: 'Petrol',
      color: 'Renaissance Red',
      body_type: 'Coupe',
      description: 'Brand new GR Supra arriving soon!',
      features: JSON.stringify(['Apple CarPlay', 'JBL Sound System', 'Adaptive Suspension']),
      images: JSON.stringify(['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80']),
      videos: JSON.stringify([]),
      status: 'upcoming',
      featured: 0
    }
  ];

  for (const car of sampleCars) {
    try {
      db.run(`
        INSERT INTO cars (title, brand, model, year, mileage, engine, transmission, fuel_type, color, body_type, description, features, images, videos, status, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [car.title, car.brand, car.model, car.year, car.mileage, car.engine, car.transmission, car.fuel_type, car.color, car.body_type, car.description, car.features, car.images, car.videos, car.status, car.featured]);
    } catch (e) {}
  }
  console.log('✅ Sample cars inserted');

  // Sample parts
  const sampleParts = [
    {
      name: '2JZ-GTE Twin Turbo Engine',
      category: 'Engine Parts',
      description: 'Complete 2JZ-GTE engine from Toyota Supra. Fully rebuilt with new gaskets and seals.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80']),
      availability: 'in_stock',
      featured: 1
    },
    {
      name: 'RB26DETT Engine Block',
      category: 'Engine Parts',
      description: 'Original RB26DETT block from Nissan Skyline GT-R. Perfect for rebuild projects.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80']),
      availability: 'in_stock',
      featured: 1
    },
    {
      name: 'Brembo GT Big Brake Kit',
      category: 'Body Parts',
      description: '6-piston front brake kit with 380mm rotors. Fits most JDM sports cars.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80']),
      availability: 'in_stock',
      featured: 1
    },
    {
      name: 'Carbon Fiber Hood - Supra MK4',
      category: 'Body Parts',
      description: 'Lightweight carbon fiber hood for Toyota Supra MK4. OEM fitment.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80']),
      availability: 'coming_soon',
      featured: 0
    },
    {
      name: 'Recaro Bucket Seats (Pair)',
      category: 'Accessories',
      description: 'Genuine Recaro SPG bucket seats. Includes mounting rails.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80']),
      availability: 'in_stock',
      featured: 1
    },
    {
      name: 'HKS Hi-Power Exhaust',
      category: 'Accessories',
      description: 'Full titanium exhaust system. Universal fitment for most JDM cars.',
      images: JSON.stringify(['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80']),
      availability: 'out_of_stock',
      featured: 0
    }
  ];

  for (const part of sampleParts) {
    try {
      db.run(`
        INSERT INTO parts (name, category, description, images, availability, featured)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [part.name, part.category, part.description, part.images, part.availability, part.featured]);
    } catch (e) {}
  }
  console.log('✅ Sample parts inserted');

  saveDatabase();
  console.log('✅ Database initialized successfully');
  
  return db;
};

const saveDatabase = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

const query = {
  all: (sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (err) {
      console.error('Query error:', err);
      return [];
    }
  },
  
  get: (sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      if (params.length > 0) stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return null;
    } catch (err) {
      console.error('Query error:', err);
      return null;
    }
  },
  
  run: (sql, params = []) => {
    try {
      db.run(sql, params);
      saveDatabase();
      return {
        lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0],
        changes: db.getRowsModified()
      };
    } catch (err) {
      console.error('Query error:', err);
      throw err;
    }
  }
};

const getDb = () => db;

module.exports = { initializeDatabase, getDb, query, saveDatabase };
