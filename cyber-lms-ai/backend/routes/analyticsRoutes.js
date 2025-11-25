// backend/routes/analyticsRoutes.js

const express = require('express');
const { auth } = require('../middleware/auth');
const Session = require('../models/Session');
const User = require('../models/User');
const Question = require('../models/Question');
const Course = require('../models/Course');

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Role: admin
 *
 * Returns high-level metrics:
 * - totalUsers
 * - totalLearners
 * - totalSessions
 * - activeSessions
 * - totalQuestions
 * - totalCorrect
 * - accuracy (overall)
 */
router.get('/overview', auth(['admin']), async (req, res) => {
  try {
    const [userCount, learnerCount, sessions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'learner' }),
      Session.find()
    ]);

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.active).length;

    const totalQuestions = sessions.reduce((sum, s) => sum + s.totalAsked, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.totalCorrect, 0);

    const accuracy = totalQuestions
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    return res.json({
      totalUsers: userCount,
      totalLearners: learnerCount,
      totalSessions,
      activeSessions,
      totalQuestions,
      totalCorrect,
      accuracy
    });
  } catch (err) {
    console.error('Analytics overview error:', err.message);
    return res.status(500).json({ message: 'Server error fetching analytics overview' });
  }
});

/**
 * GET /api/analytics/my-stats
 * Role: learner, admin
 *
 * Returns detailed stats for the current logged-in user:
 * - Overall stats (totalSessions, totalQuestions, accuracy, etc.)
 * - Category-wise performance breakdown
 * - Difficulty progression over time
 * - Recent session history
 * - Weak areas identification
 */
router.get('/my-stats', auth(['learner', 'admin']), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all sessions for this user
    const sessions = await Session.find({ user: userId })
      .populate('answers.question')
      .sort({ updatedAt: -1 });

    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.active).length;

    // Overall stats
    const totalQuestions = sessions.reduce((sum, s) => sum + s.totalAsked, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.totalCorrect, 0);
    const accuracy = totalQuestions
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    // Category-wise performance
    const categoryStats = {};
    sessions.forEach((session) => {
      session.answers.forEach((answer) => {
        if (answer.question && answer.question.categoryName) {
          const catName = answer.question.categoryName;
          if (!categoryStats[catName]) {
            categoryStats[catName] = { asked: 0, correct: 0 };
          }
          categoryStats[catName].asked += 1;
          if (answer.wasCorrect) {
            categoryStats[catName].correct += 1;
          }
        }
      });
    });

    // Calculate category accuracies
    const categoryPerformance = Object.entries(categoryStats).map(([name, stats]) => ({
      category: name,
      asked: stats.asked,
      correct: stats.correct,
      accuracy: stats.asked ? Math.round((stats.correct / stats.asked) * 100) : 0
    })).sort((a, b) => a.accuracy - b.accuracy); // Sort by accuracy (weakest first)

    // Difficulty progression (from session history)
    const difficultyProgression = sessions
      .filter((s) => s.answers.length > 0)
      .map((s) => ({
        date: s.updatedAt,
        difficulty: s.currentDifficulty,
        accuracy: s.totalAsked ? Math.round((s.totalCorrect / s.totalAsked) * 100) : 0
      }))
      .slice(0, 20) // Last 20 sessions
      .reverse();

    // Recent sessions (last 10)
    const recentSessions = sessions.slice(0, 10).map((s) => ({
      id: s._id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      active: s.active,
      totalAsked: s.totalAsked,
      totalCorrect: s.totalCorrect,
      accuracy: s.totalAsked ? Math.round((s.totalCorrect / s.totalAsked) * 100) : 0,
      currentDifficulty: s.currentDifficulty,
      correctStreak: s.correctStreak
    }));

    // Identify weak areas (categories with accuracy < 70%)
    const weakAreas = categoryPerformance.filter((cat) => cat.accuracy < 70 && cat.asked >= 3);

    // Current session stats
    const currentSession = sessions.find((s) => s.active);
    const currentSessionStats = currentSession ? {
      sessionId: currentSession._id,
      totalAsked: currentSession.totalAsked,
      totalCorrect: currentSession.totalCorrect,
      accuracy: currentSession.totalAsked
        ? Math.round((currentSession.totalCorrect / currentSession.totalAsked) * 100)
        : 0,
      currentDifficulty: currentSession.currentDifficulty,
      correctStreak: currentSession.correctStreak
    } : null;

    return res.json({
      overall: {
        totalSessions,
        activeSessions,
        totalQuestions,
        totalCorrect,
        accuracy,
        lastSessionAt: totalSessions ? sessions[0].updatedAt : null
      },
      categoryPerformance,
      difficultyProgression,
      recentSessions,
      weakAreas,
      currentSession: currentSessionStats
    });
  } catch (err) {
    console.error('My stats error:', err.message);
    return res.status(500).json({ message: 'Server error fetching user stats' });
  }
});

/**
 * GET /api/analytics/user/:userId
 * Role: admin
 *
 * Returns stats for a specific learner:
 * - user info
 * - totalSessions
 * - totalQuestions
 * - totalCorrect
 * - accuracy
 * - lastSessionAt
 */
router.get('/user/:userId', auth(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sessions = await Session.find({ user: userId }).sort({ updatedAt: -1 });
    const totalSessions = sessions.length;

    const totalQuestions = sessions.reduce((sum, s) => sum + s.totalAsked, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.totalCorrect, 0);

    const accuracy = totalQuestions
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    const lastSessionAt = totalSessions ? sessions[0].updatedAt : null;

    return res.json({
      user,
      totalSessions,
      totalQuestions,
      totalCorrect,
      accuracy,
      lastSessionAt
    });
  } catch (err) {
    console.error('Analytics user error:', err.message);
    return res.status(500).json({ message: 'Server error fetching user analytics' });
  }
});

/**
 * GET /api/analytics/admin-dashboard
 * Role: admin
 *
 * Returns admin dashboard data:
 * - totalCourses
 * - courses list (AI-generated courses)
 */
router.get('/admin-dashboard', auth(['admin']), async (req, res) => {
  try {
    // Get all unique categories from questions (these are the courses)
    const categories = await Question.aggregate([
      {
        $group: {
          _id: '$categoryId',
          name: { $first: '$categoryName' },
          count: { $sum: 1 }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Get or create courses for each category
    const coursesData = [];
    for (const cat of categories) {
      let course = await Course.findOne({ categoryId: cat._id });
      
      // If course doesn't exist, create it (AI-generated course)
      if (!course) {
        course = await Course.create({
          name: cat.name,
          description: `AI-powered cybersecurity training course: ${cat.name}`,
          categoryId: cat._id,
          questionCount: cat.count
        });
      } else {
        // Update question count if needed
        if (course.questionCount !== cat.count) {
          course.questionCount = cat.count;
          await course.save();
        }
      }

      coursesData.push({
        id: course._id,
        name: course.name,
        description: course.description,
        categoryId: course.categoryId,
        questionCount: course.questionCount,
        createdAt: course.createdAt
      });
    }
    
    const totalCourses = coursesData.length;
    
    return res.json({
      totalCourses,
      courses: coursesData
    });
  } catch (err) {
    console.error('Admin dashboard error:', err.message);
    return res.status(500).json({ message: 'Server error fetching admin dashboard' });
  }
});

module.exports = router;
