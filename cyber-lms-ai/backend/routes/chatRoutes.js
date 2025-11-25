// backend/routes/chatRoutes.js

const express = require('express');
const { auth } = require('../middleware/auth');
const Session = require('../models/Session');
const Question = require('../models/Question');
const { aiClient } = require('../lib/aiClient');
const {
  computeNextDifficulty,
  pickNextQuestion
} = require('../lib/adaptiveEngine');

const router = express.Router();

/**
 * GET /api/chat/categories
 * Returns available question categories/modules
 */
router.get('/categories', auth(['learner', 'admin']), async (req, res) => {
  try {
    const categories = await Question.aggregate([
      {
        $group: {
          _id: '$categoryId',
          name: { $first: '$categoryName' },
          count: { $sum: 1 }
        }
      },
      { $sort: { name: 1 } },
      {
        $project: {
          id: '$_id',
          name: 1,
          count: 1,
          _id: 0
        }
      }
    ]);

    return res.json({ categories });
  } catch (err) {
    console.error('Categories error:', err.message);
    return res.status(500).json({ message: 'Server error fetching categories' });
  }
});

/**
 * POST /api/chat/start
 * Starts or resumes a training session for the current user.
 * Body: { categoryId? } - optional category to focus on
 *
 * Returns:
 * {
 *   sessionId,
 *   message,
 *   question: { id, text, options, difficulty },
 *   stats: { totalAsked, totalCorrect, accuracy, currentDifficulty, correctStreak }
 * }
 */
router.post('/start', auth(['learner', 'admin']), async (req, res) => {
  try {
    const { categoryId } = req.body;

    // Find an active session for this user
    let session = await Session.findOne({
      user: req.user.id,
      active: true
    });

    let isNewSession = false;

    if (!session) {
      // Create new session
      session = await Session.create({
        user: req.user.id,
        active: true,
        currentDifficulty: 1,
        correctStreak: 0,
        totalAsked: 0,
        totalCorrect: 0,
        askedQuestionIds: [],
        answers: [],
        lastQuestion: null,
        preferredCategory: categoryId || null
      });
      isNewSession = true;
    } else if (categoryId && !session.preferredCategory) {
      // Update existing session with category preference if not set
      session.preferredCategory = categoryId;
      await session.save();
    }

    let questionDoc;

    // If there's already a pending question (e.g., user refreshed page),
    // just resend that question.
    if (session.lastQuestion) {
      questionDoc = await Question.findById(session.lastQuestion);
    } else {
      // Pick new question based on current difficulty and category preference
      const next = await pickNextQuestion({
        difficulty: session.currentDifficulty,
        askedQuestionIds: session.askedQuestionIds,
        categoryId: session.preferredCategory || null
      });

      if (!next) {
        return res.status(500).json({ message: 'No questions available.' });
      }

      // next is plain object from aggregation
      session.lastQuestion = next._id;
      session.askedQuestionIds.push(next._id);
      session.totalAsked += 1;
      await session.save();

      questionDoc = next;
    }

    const accuracy = session.totalAsked
      ? Math.round((session.totalCorrect / session.totalAsked) * 100)
      : 0;

    return res.json({
      sessionId: session._id,
      message: isNewSession
        ? "Welcome to Cybersecurity Training! Let's get started."
        : 'Welcome back, continuing your training session.',
      question: {
        id: questionDoc._id,
        text: questionDoc.question,
        options: questionDoc.options,
        difficulty: questionDoc.difficulty
      },
      stats: {
        totalAsked: session.totalAsked,
        totalCorrect: session.totalCorrect,
        accuracy,
        currentDifficulty: session.currentDifficulty,
        correctStreak: session.correctStreak
      }
    });
  } catch (err) {
    console.error('Start session error:', err.message);
    return res.status(500).json({ message: 'Server error starting session' });
  }
});

/**
 * POST /api/chat/answer
 * Body: { sessionId, questionId, selectedIndex, freeText? }
 *
 * - Evaluates the answer
 * - Updates streak, difficulty, stats
 * - Asks Gemini for conversational feedback
 * - Returns next question + updated stats
 *
 * Response:
 * {
 *   done: boolean,
 *   currentQuestionResult: {
 *     correct,
 *     explanation,
 *     aiFeedback
 *   },
 *   nextQuestion: { id, text, options, difficulty } | null,
 *   stats: { totalAsked, totalCorrect, accuracy, currentDifficulty, correctStreak }
 * }
 */
router.post('/answer', auth(['learner', 'admin']), async (req, res) => {
  try {
    const { sessionId, questionId, selectedIndex, freeText } = req.body;

    if (!sessionId || !questionId || selectedIndex === undefined) {
      return res.status(400).json({
        message: 'sessionId, questionId and selectedIndex are required'
      });
    }

    const session = await Session.findById(sessionId);
    if (!session || !session.active) {
      return res.status(400).json({ message: 'Session is not active' });
    }

    // Optional: ensure the session belongs to the current user
    if (String(session.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Session does not belong to user' });
    }

    // Ensure the answered question is the last one asked
    if (!session.lastQuestion || String(session.lastQuestion) !== String(questionId)) {
      return res.status(400).json({ message: 'Answer does not match current question' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const wasCorrect = Number(selectedIndex) === question.correctIndex;

    // Evaluate free-text reasoning if provided
    let freeTextEvaluation = null;
    let freeTextScore = 0; // 0-1 scale, affects overall correctness
    if (freeText && freeText.trim().length > 0) {
      try {
        const evaluationPrompt = `
You are a cybersecurity tutor evaluating a student's reasoning.

Question: "${question.question}"
Correct Answer: Option ${question.correctIndex + 1} - "${question.options[question.correctIndex]}"
Student's Selected Answer: Option ${selectedIndex + 1} - "${question.options[selectedIndex]}"
Student's Reasoning: "${freeText}"

Evaluate the student's reasoning:
1. Is the reasoning logically sound?
2. Does it demonstrate understanding of cybersecurity concepts?
3. Is it relevant to the question?

Return a JSON object with this structure:
{
  "isCorrect": true/false,
  "score": 0.0-1.0,
  "feedback": "Brief feedback on the reasoning quality"
}

Score guidelines:
- 0.9-1.0: Excellent reasoning, demonstrates deep understanding
- 0.7-0.8: Good reasoning with minor gaps
- 0.5-0.6: Basic understanding but some misconceptions
- 0.3-0.4: Weak reasoning, significant gaps
- 0.0-0.2: Poor reasoning, major misconceptions

Return ONLY the JSON object, no markdown.
        `.trim();

        freeTextEvaluation = await aiClient.generateJson(evaluationPrompt);
        freeTextScore = freeTextEvaluation.score || 0;

        // If free-text reasoning is excellent (score > 0.8) but multiple-choice was wrong,
        // give partial credit (but don't mark as fully correct)
        if (!wasCorrect && freeTextScore > 0.8) {
          // Partial credit: don't break streak, but don't count as full correct
          // This encourages good reasoning even when answer is wrong
        }
      } catch (err) {
        console.error('Free-text evaluation error:', err.message);
        // Continue without free-text evaluation
      }
    }

    // Update stats
    // If free-text shows good understanding, we might adjust scoring
    const finalCorrect = wasCorrect; // Multiple-choice correctness is primary
    if (finalCorrect) {
      session.totalCorrect += 1;
      session.correctStreak += 1;
    } else {
      session.correctStreak = 0;
    }

    // Log answer in session
    session.answers.push({
      question: question._id,
      selectedIndex,
      wasCorrect,
      difficulty: question.difficulty
    });

    // Compute next difficulty
    const nextDifficulty = computeNextDifficulty(
      session.currentDifficulty,
      wasCorrect,
      session.correctStreak
    );
    session.currentDifficulty = nextDifficulty;

    // Pick next question (with category preference if set)
    const nextQuestion = await pickNextQuestion({
      difficulty: nextDifficulty,
      askedQuestionIds: session.askedQuestionIds,
      categoryId: session.preferredCategory || null
    });

    // Gemini feedback prompt (enhanced with free-text evaluation)
    const feedbackPrompt = `
You are a friendly cybersecurity tutor.

The user just answered a multiple-choice question.

Question:
"${question.question}"

Options:
${question.options.map((opt, i) => `${i}: ${opt}`).join('\n')}

Correct option index: ${question.correctIndex}
User selected index: ${selectedIndex}
User's free-text reasoning: "${freeText || 'No reasoning provided'}"

Was the user's multiple-choice answer correct? ${wasCorrect ? 'Yes' : 'No'}.
${freeTextEvaluation ? `Free-text reasoning quality score: ${freeTextScore.toFixed(1)}/1.0\nFree-text feedback: ${freeTextEvaluation.feedback || 'N/A'}` : ''}

Task:
1. Explain in 2–3 sentences why the chosen answer is correct or incorrect.
2. ${freeText && freeTextEvaluation ? 'Comment on the quality of their reasoning. ' : ''}Use simple, non-technical language.
3. ${freeTextScore > 0.7 && !wasCorrect ? 'Acknowledge that their reasoning shows good understanding even though the answer was incorrect. ' : ''}End with one short encouraging sentence.

Return plain text only, no JSON, no markdown.
    `.trim();

    let aiFeedback = '';
    try {
      // Ensure we have a valid API key before attempting
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      
      aiFeedback = await aiClient.generateText(feedbackPrompt);
      
      // Validate we got actual feedback
      if (!aiFeedback || aiFeedback.trim().length === 0) {
        throw new Error('AI returned empty feedback');
      }
      
      console.log('✅ AI feedback generated successfully');
    } catch (err) {
      console.error('❌ AI feedback error:', err.message);
      console.error('Full error:', err);
      
      // Provide a more helpful fallback that still gives value
      if (wasCorrect) {
        aiFeedback = `Great job! You selected the correct answer. ${question.explanation} Keep up the excellent work!`;
      } else {
        aiFeedback = `Not quite right, but that's okay! ${question.explanation} Remember: learning from mistakes is part of the process. Try again on the next question!`;
      }
      
      // Log that we're using fallback
      console.warn('⚠️ Using fallback feedback due to AI error');
    }

    // If no more questions at that difficulty / dataset exhausted
    if (!nextQuestion) {
      session.active = false;
      session.lastQuestion = null;
      await session.save();

      const accuracy = session.totalAsked
        ? Math.round((session.totalCorrect / session.totalAsked) * 100)
        : 0;

      return res.json({
        done: true,
        currentQuestionResult: {
          correct: wasCorrect,
          explanation: question.explanation,
          aiFeedback,
          freeTextEvaluation: freeTextEvaluation ? {
            score: freeTextScore,
            feedback: freeTextEvaluation.feedback
          } : null
        },
        nextQuestion: null,
        stats: {
          totalAsked: session.totalAsked,
          totalCorrect: session.totalCorrect,
          accuracy,
          currentDifficulty: session.currentDifficulty,
          correctStreak: session.correctStreak
        },
        feedback: 'Training complete! No more questions available at this time.'
      });
    }

    // We have a next question: update session's lastQuestion and asked list
    session.lastQuestion = nextQuestion._id;
    session.askedQuestionIds.push(nextQuestion._id);
    session.totalAsked += 1;
    await session.save();

    const accuracy = session.totalAsked
      ? Math.round((session.totalCorrect / session.totalAsked) * 100)
      : 0;

    return res.json({
      done: false,
      currentQuestionResult: {
        correct: wasCorrect,
        explanation: question.explanation,
        aiFeedback,
        freeTextEvaluation: freeTextEvaluation ? {
          score: freeTextScore,
          feedback: freeTextEvaluation.feedback
        } : null
      },
      nextQuestion: {
        id: nextQuestion._id,
        text: nextQuestion.question,
        options: nextQuestion.options,
        difficulty: nextQuestion.difficulty
      },
      stats: {
        totalAsked: session.totalAsked,
        totalCorrect: session.totalCorrect,
        accuracy,
        currentDifficulty: session.currentDifficulty,
        correctStreak: session.correctStreak
      }
    });
  } catch (err) {
    console.error('Answer handling error:', err.message);
    return res.status(500).json({ message: 'Server error while processing answer' });
  }
});

module.exports = router;
