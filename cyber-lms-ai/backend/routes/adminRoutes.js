// backend/routes/adminRoutes.js

const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Question = require('../models/Question');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');

const router = express.Router();

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/admin/users
 * Get all users with role filtering
 */
router.get('/users', auth(['admin']), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (err) {
    console.error('Get users error:', err.message);
    return res.status(500).json({ message: 'Server error fetching users' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user (learner or admin)
 */
router.post('/users', auth(['admin']), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['learner', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    return res.json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Create user error:', err.message);
    return res.status(500).json({ message: 'Server error creating user' });
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user details (name, email, role)
 */
router.put('/users/:userId', auth(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ['learner', 'admin'].includes(role)) {
      user.role = role;
    }

    await user.save();

    return res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update user error:', err.message);
    return res.status(500).json({ message: 'Server error updating user' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user and their associated sessions
 */
router.delete('/users/:userId', auth(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's sessions
    await Session.deleteMany({ user: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    return res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Delete user error:', err.message);
    return res.status(500).json({ message: 'Server error deleting user' });
  }
});

// ============================================
// COURSE MANAGEMENT
// ============================================

/**
 * GET /api/admin/courses
 * Get all AI-generated courses
 */
router.get('/courses', auth(['admin']), async (req, res) => {
  try {
    const courses = await Course.find()
      .sort({ createdAt: -1 });

    const coursesData = courses.map(course => ({
      id: course._id,
      name: course.name,
      description: course.description,
      categoryId: course.categoryId,
      questionCount: course.questionCount,
      createdAt: course.createdAt
    }));

    return res.json({ courses: coursesData });
  } catch (err) {
    console.error('Get courses error:', err.message);
    return res.status(500).json({ message: 'Server error fetching courses' });
  }
});

/**
 * POST /api/admin/courses
 * Create a new AI-generated course
 */
router.post('/courses', auth(['admin']), async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ message: 'Name and categoryId are required' });
    }

    // Check if course with this categoryId already exists
    const existing = await Course.findOne({ categoryId });
    if (existing) {
      return res.status(400).json({ message: 'A course with this category ID already exists' });
    }

    // Count existing questions in this category
    const questionCount = await Question.countDocuments({ categoryId });

    // Create the course (AI-generated, no instructor)
    const course = await Course.create({
      name,
      description: description || `AI-powered cybersecurity training course: ${name}`,
      categoryId,
      questionCount
    });

    return res.json({
      message: 'Course created successfully',
      course: {
        id: course._id,
        name: course.name,
        description: course.description,
        categoryId: course.categoryId,
        questionCount: course.questionCount,
        createdAt: course.createdAt
      }
    });
  } catch (err) {
    console.error('Create course error:', err.message);
    return res.status(500).json({ message: 'Server error creating course' });
  }
});

/**
 * PUT /api/admin/courses/:courseId
 * Update course details
 */
router.put('/courses/:courseId', auth(['admin']), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, description, categoryId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Update fields
    if (name) course.name = name;
    if (description !== undefined) course.description = description;
    if (categoryId) course.categoryId = categoryId;

    await course.save();

    return res.json({
      message: 'Course updated successfully',
      course: {
        id: course._id,
        name: course.name,
        description: course.description,
        categoryId: course.categoryId
      }
    });
  } catch (err) {
    console.error('Update course error:', err.message);
    return res.status(500).json({ message: 'Server error updating course' });
  }
});

/**
 * DELETE /api/admin/courses/:courseId
 * Delete a course
 */
router.delete('/courses/:courseId', auth(['admin']), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await Course.findByIdAndDelete(courseId);

    return res.json({
      message: 'Course deleted successfully',
      deletedCourse: {
        id: course._id,
        name: course.name,
        categoryId: course.categoryId
      }
    });
  } catch (err) {
    console.error('Delete course error:', err.message);
    return res.status(500).json({ message: 'Server error deleting course' });
  }
});

// ============================================
// QUESTION MANAGEMENT
// ============================================

/**
 * GET /api/admin/questions
 * Get all questions with filtering by category
 */
router.get('/questions', auth(['admin']), async (req, res) => {
  try {
    const { categoryId, difficulty } = req.query;
    const filter = {};
    
    if (categoryId) filter.categoryId = categoryId;
    if (difficulty) filter.difficulty = parseInt(difficulty);

    const questions = await Question.find(filter)
      .sort({ categoryId: 1, difficulty: 1 });

    return res.json({ 
      questions,
      count: questions.length 
    });
  } catch (err) {
    console.error('Get questions error:', err.message);
    return res.status(500).json({ message: 'Server error fetching questions' });
  }
});

/**
 * DELETE /api/admin/questions/:questionId
 * Delete a question
 */
router.delete('/questions/:questionId', auth(['admin']), async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await Question.findByIdAndDelete(questionId);

    // Update course question count
    await Course.updateMany(
      { categoryId: question.categoryId },
      { $inc: { questionCount: -1 } }
    );

    return res.json({
      message: 'Question deleted successfully',
      deletedQuestion: {
        id: question._id,
        question: question.question
      }
    });
  } catch (err) {
    console.error('Delete question error:', err.message);
    return res.status(500).json({ message: 'Server error deleting question' });
  }
});

/**
 * GET /api/admin/categories
 * Get all unique categories from questions
 */
router.get('/categories', auth(['admin']), async (req, res) => {
  try {
    const categories = await Question.aggregate([
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$categoryName' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          id: '$_id',
          name: '$categoryName',
          questionCount: '$count'
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    return res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err.message);
    return res.status(500).json({ message: 'Server error fetching categories' });
  }
});

/**
 * DELETE /api/admin/sessions/:sessionId
 * Delete a training session
 */
router.delete('/sessions/:sessionId', auth(['admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await Session.findByIdAndDelete(sessionId);

    return res.json({
      message: 'Session deleted successfully',
      deletedSession: {
        id: session._id
      }
    });
  } catch (err) {
    console.error('Delete session error:', err.message);
    return res.status(500).json({ message: 'Server error deleting session' });
  }
});

module.exports = router;
