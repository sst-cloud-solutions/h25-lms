// backend/models/Session.js

const mongoose = require('mongoose');

// One answer entry inside a session
const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedIndex: {
      type: Number,
      required: true
    },
    wasCorrect: {
      type: Boolean,
      required: true
    },
    difficulty: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false } // we don't need separate _id for each answer
);

// One learning/conversational session for a user
const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Is this session currently active?
    active: {
      type: Boolean,
      default: true
    },

    // Current difficulty level the engine is targeting
    currentDifficulty: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },

    // How many correct answers in a row (used to increase difficulty)
    correctStreak: {
      type: Number,
      default: 0
    },

    // Aggregated stats
    totalAsked: {
      type: Number,
      default: 0
    },
    totalCorrect: {
      type: Number,
      default: 0
    },

    // Questions already asked in this session (to avoid repetition)
    askedQuestionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],

    // Log of all answers in this session
    answers: [answerSchema],

    // The last question that was sent to the user (for answering)
    lastQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null
    },

    // Optional: preferred category/module for this session
    preferredCategory: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

module.exports = mongoose.model('Session', sessionSchema);
