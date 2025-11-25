const fs = require('fs');
const path = require('path');
const { mainDb } = require('../../config/dbConfig');

// Load questions from JSON file
const questionsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/cybersecurity_questions.json'), 'utf8')
);

// Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = questionsData.categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      questionCount: category.questions.length
    }));

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get questions by category
const getQuestionsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { difficulty, limit } = req.query;

    const category = questionsData.categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    let questions = category.questions;

    // Filter by difficulty if specified
    if (difficulty) {
      const difficultyNum = parseInt(difficulty);
      questions = questions.filter(q => q.difficulty === difficultyNum);
    }

    // Limit number of questions if specified
    if (limit) {
      const limitNum = parseInt(limit);
      questions = questions.slice(0, limitNum);
    }

    // Remove correct_answer from response to prevent cheating
    const sanitizedQuestions = questions.map(q => ({
      id: q.id,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options
    }));

    res.json({
      success: true,
      category: category.name,
      questions: sanitizedQuestions,
      totalQuestions: sanitizedQuestions.length
    });
  } catch (error) {
    console.error('Questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Submit test answers and get results
const submitTest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { categoryId, answers } = req.body;

    if (!categoryId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and answers array are required'
      });
    }

    const category = questionsData.categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Calculate score
    let correctCount = 0;
    const results = [];

    for (const answer of answers) {
      const question = category.questions.find(q => q.id === answer.questionId);
      
      if (question) {
        const isCorrect = question.correct_answer === answer.selectedOption;
        if (isCorrect) correctCount++;

        results.push({
          questionId: answer.questionId,
          question: question.question,
          selectedOption: answer.selectedOption,
          correctOption: question.correct_answer,
          isCorrect,
          explanation: question.explanation
        });
      }
    }

    const score = Math.round((correctCount / answers.length) * 100);

    // Update user stats
    const user = await mainDb('users').where({ id: userId }).first();
    
    const newTotalScore = user.total_score + score;
    const newTestsCompleted = user.tests_completed + 1;
    
    // Calculate new accuracy (weighted average)
    const newAccuracy = Math.round(
      ((user.accuracy * user.tests_completed) + score) / newTestsCompleted
    );

    // Update user in database
    await mainDb('users')
      .where({ id: userId })
      .update({
        total_score: newTotalScore,
        tests_completed: newTestsCompleted,
        accuracy: newAccuracy,
        updated_at: new Date()
      });

    // Save test result
    const [testResultId] = await mainDb('test_results').insert({
      user_id: userId,
      category: category.name,
      score: score,
      total_questions: answers.length,
      correct_answers: correctCount,
      created_at: new Date()
    });

    res.json({
      success: true,
      score,
      correctCount,
      totalQuestions: answers.length,
      results,
      testResultId,
      userStats: {
        total_score: newTotalScore,
        tests_completed: newTestsCompleted,
        accuracy: newAccuracy
      }
    });

  } catch (error) {
    console.error('Test submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user test history
const getTestHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const testHistory = await mainDb('test_results')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(10);

    res.json({
      success: true,
      testHistory
    });
  } catch (error) {
    console.error('Test history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCategories,
  getQuestionsByCategory,
  submitTest,
  getTestHistory
};
