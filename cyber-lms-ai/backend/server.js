// backend/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

// Init app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static frontend (HTML/CSS/JS in ../public)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', require('./routes/authRoutes'));         // register/login
app.use('/api/chat', require('./routes/chatRoutes'));         // conversational training
app.use('/api/analytics', require('./routes/analyticsRoutes'));// admin metrics (optional)
app.use('/api/admin', require('./routes/adminRoutes'));       // admin management routes

// Root -> send landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Fallback for any unknown API route
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Cyber LMS server running on http://localhost:${PORT}`);
});
