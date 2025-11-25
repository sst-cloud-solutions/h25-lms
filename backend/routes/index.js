const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// Import controllers
const { login, Register } = require('../controller/login/logincontroller');
const { getDashboardData } = require('../controller/dashboard/dashboardcontroller');

// Auth routes
router.post('/login', login);
router.post('/register', Register);

// Protected routes
router.get('/dashboard', authenticateToken, getDashboardData);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;
