const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');

let db = null;

const initializeDatabase = async () => {
  // Create Turso client
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Test connection
  try {
    await db.execute('SELECT 1');
    console.log('✅ Connected to Turso database');
  } catch (err) {
    console.error('❌ Failed to connect to Turso:', err);
    throw err;
  }

  // Create tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'user',
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
      status TEXT DEFAULT 'available',
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
      availability TEXT DEFAULT 'in_stock',
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
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tables verified');

  // Check/create admin user
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
    console.log('✅ Admin user exists');
  }

  // Check/create sample cars
  const carsCheck = await db.execute('SELECT COUNT(*) as count FROM cars');
  const carCount = Number(carsCheck.rows[0].count);
  
  if (carCount === 0) {
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
  } else {
    console.log(`✅ ${carCount} cars exist`);
  }

  console.log('✅ Database ready');
  return db;
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

const query = {
  all: async (sql, params = []) => {
    const database = getDb();
    try {
      const result = await database.execute({ sql, args: params });
      return result.rows;
    } catch (err) {
      console.error('Query all error:', sql, err.message);
      return [];
    }
  },
  
  get: async (sql, params = []) => {
    const database = getDb();
    try {
      const result = await database.execute({ sql, args: params });
      return result.rows[0] || null;
    } catch (err) {
      console.error('Query get error:', sql, err.message);
      return null;
    }
  },
  
  run: async (sql, params = []) => {
    const database = getDb();
    try {
      const result = await database.execute({ sql, args: params });
      return {
        lastInsertRowid: Number(result.lastInsertRowid),
        changes: result.rowsAffected
      };
    } catch (err) {
      console.error('Query run error:', sql, err.message);
      throw err;
    }
  }
};

module.exports = { initializeDatabase, getDb, query };
