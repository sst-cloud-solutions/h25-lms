// backend/models/Course.js

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    // Course name (e.g., "Basic Phishing Recognition")
    name: {
      type: String,
      required: true,
      trim: true
    },
    
    // Description of the course
    description: {
      type: String,
      trim: true
    },
    
    // Category ID this course maps to (from Question model)
    categoryId: {
      type: String,
      required: true
    },
    
    // Number of questions in this course
    questionCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

module.exports = mongoose.model('Course', courseSchema);

