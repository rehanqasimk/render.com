const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3001;

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
    message: "API is working!"
  });
});

// Sample API endpoints
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.get("/api/users", (req, res) => {
  // Example user data
  res.json([
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" }
  ]);
});

app.post("/api/users", (req, res) => {
  // Echo back the received data with an ID
  const newUser = {
    id: Date.now(),
    ...req.body
  };
  
  res.status(201).json({
    message: "User created",
    user: newUser
  });
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
