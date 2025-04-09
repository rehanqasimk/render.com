const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // Add PostgreSQL dependency
const app = express();
const port = process.env.PORT || 3001;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/mydb",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
  // Only use SSL if we're using an external DATABASE_URL (like on Render)
});

// Add info log about which database we're connecting to
console.log(`Database connection: ${process.env.DATABASE_URL ? 'Using Render PostgreSQL' : 'Using local PostgreSQL'}`);

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

// Middleware - completely open CORS for development
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight request for 1 day
}));

// Add CORS debugging middleware
app.use((req, res, next) => {
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.method);
  
  // Add CORS headers manually as a backup
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// Root endpoint - return basic API info
app.get("/", (req, res) => {
  res.json({
    message: "API is working with PostgreSQL!"
  });
});

// Sample API endpoints
app.get("/api/status", async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW() as time');
    res.json({
      status: "online",
      timestamp: new Date(),
      uptime: process.uptime(),
      database: {
        connected: true,
        time: dbResult.rows[0].time
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "online",
      timestamp: new Date(),
      uptime: process.uptime(),
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// Updated to use database
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    const result = await pool.query(
      'INSERT INTO users(name, email) VALUES($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json({
      message: "User created",
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Initialize database tables
app.get("/api/init-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if table is empty and add sample data
    const count = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(count.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (name, email) VALUES 
        ('John Doe', 'john@example.com'),
        ('Jane Smith', 'jane@example.com')
      `);
    }
    
    res.json({ message: "Database initialized successfully" });
  } catch (error) {
    console.error("Database initialization error:", error);
    res.status(500).json({ error: "Database initialization failed" });
  }
});

// Add a diagnostic endpoint for CORS testing
app.options('/api/cors-test', cors());
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working',
    origin: req.headers.origin || 'No origin header found'
  });
});

const server = app.listen(port, () => console.log(`JSON API listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
