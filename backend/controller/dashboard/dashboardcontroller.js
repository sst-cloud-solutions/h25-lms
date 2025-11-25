const { mainDb } = require('../../config/dbConfig');

// Get dashboard data
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user data
    const user = await mainDb('users')
      .where({ id: userId })
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate rank (simplified - in production you'd want a more sophisticated ranking system)
    const userCount = await mainDb('users').count('* as count').first();
    const rank = Math.floor(Math.random() * (userCount.count - 1)) + 1;

    // Mock recent activity data
    const recent_activity = [
      {
        action: 'Completed Basic Phishing Test',
        time: '2 hours ago',
        score: 85
      },
      {
        action: 'Completed Email Security Quiz',
        time: '1 day ago',
        score: 92
      },
      {
        action: 'Chat with AI Tutor',
        time: '2 days ago',
        score: null
      }
    ];

    // Return dashboard data
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        level: user.level,
        total_score: user.total_score,
        accuracy: user.accuracy,
        streak: user.streak,
        tests_completed: user.tests_completed,
        rank: rank
      },
      recent_activity
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getDashboardData
};
