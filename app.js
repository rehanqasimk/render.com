const express = require("express");
const cors = require("cors"); // Add cors package
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5500', 'https://rehanqasim_render.surge.sh'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
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

const server = app.listen(port, () => console.log(`JSON API listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
