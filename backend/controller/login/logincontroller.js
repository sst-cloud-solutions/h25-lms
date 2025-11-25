const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { mainDb } = require('../../config/dbConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login function
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await mainDb('users')
      .where({ email })
      .first();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        level: user.level,
        total_score: user.total_score,
        accuracy: user.accuracy,
        streak: user.streak,
        tests_completed: user.tests_completed,
        rank: user.rank
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Register function
const Register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await mainDb('users')
      .where({ email })
      .first();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [userId] = await mainDb('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: 'student',
        level: 'Beginner',
        total_score: 0,
        accuracy: 0,
        streak: 0,
        tests_completed: 0,
        rank: null
      });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userId, 
        email: email,
        name: name,
        role: 'student'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      access_token: token,
      user: {
        id: userId,
        name,
        email,
        role: 'student',
        level: 'Beginner',
        total_score: 0,
        accuracy: 0,
        streak: 0,
        tests_completed: 0,
        rank: null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  Register
};
