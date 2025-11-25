// backend/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    // Hashed password (using bcrypt in authRoutes)
    passwordHash: {
      type: String,
      required: true
    },
      // Role for RBAC: learner or admin (AI is the instructor)
      role: {
        type: String,
        enum: ['learner', 'admin'],
        default: 'learner'
      }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

module.exports = mongoose.model('User', userSchema);
