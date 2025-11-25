// backend/models/Question.js

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    // Match the ID from the JSON dataset (ex: "basic-001")
    externalId: {
      type: String,
      required: true,
      unique: true
    },

    // Category reference (ex: "basic-phishing")
    categoryId: {
      type: String,
      required: true
    },

    // Human readable category name (ex: "Basic Phishing Recognition")
    categoryName: {
      type: String,
      required: true
    },

    // Difficulty scale: 1 = easy, 2 = medium, 3 = hard, 4-6 = advanced
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 10 // scalable for advanced questions
    },

    // The actual question text
    question: {
      type: String,
      required: true,
      trim: true
    },

    // Multiple choice options array
    options: {
      type: [String],
      required: true,
      validate: (arr) => arr.length >= 2 // must have at least 2 options
    },

    // Index of the correct option from options array
    correctIndex: {
      type: Number,
      required: true
    },

    // The explanation shown after answering
    explanation: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true // useful for tracking updates / dataset growth
  }
);

module.exports = mongoose.model('Question', questionSchema);
