// backend/lib/adaptiveEngine.js

const Question = require('../models/Question');

/**
 * Compute next difficulty level based on:
 * - currentDifficulty: current difficulty level
 * - wasCorrect: whether the last answer was correct
 * - correctStreak: how many correct answers in a row
 *
 * Simple rule:
 * - If correct and streak >= 2 -> go up 1 level (max 5, but you’ll likely use 1–3)
 * - If incorrect -> go down 1 level (min 1)
 * - Otherwise stay at same level
 */
function computeNextDifficulty(currentDifficulty, wasCorrect, correctStreak) {
  let next = currentDifficulty;

  if (wasCorrect && correctStreak >= 2) {
    next = Math.min(currentDifficulty + 1, 5);
  } else if (!wasCorrect) {
    next = Math.max(currentDifficulty - 1, 1);
  }

  return next;
}

/**
 * Pick the next question from the database at the requested difficulty,
 * avoiding questions that were already asked in this session (if possible).
 *
 * params:
 *  - difficulty: target difficulty level (Number)
 *  - askedQuestionIds: array of ObjectIds that were used already
 *  - categoryId: optional category ID to filter by
 *  - preferWeakCategory: optional category ID to prioritize (for weak areas)
 *
 * returns:
 *  - a Question document (plain object via aggregation) or null
 */
async function pickNextQuestion({ difficulty, askedQuestionIds, categoryId = null, preferWeakCategory = null }) {
  // Base filter: matching difficulty
  const baseFilter = { difficulty };
  
  // Add category filter if specified
  if (categoryId) {
    baseFilter.categoryId = categoryId;
  }

  // Primary attempt: avoid already asked questions
  let pipeline = [
    {
      $match: {
        ...baseFilter,
        _id: { $nin: askedQuestionIds || [] }
      }
    },
    { $sample: { size: 1 } } // random one
  ];

  // If preferWeakCategory is set, prioritize that category
  if (preferWeakCategory && !categoryId) {
    pipeline = [
      {
        $match: {
          difficulty,
          categoryId: preferWeakCategory,
          _id: { $nin: askedQuestionIds || [] }
        }
      },
      { $sample: { size: 1 } }
    ];
  }

  let results = await Question.aggregate(pipeline);

  // If none found (we exhausted all questions at this difficulty/category),
  // fall back to any question at this difficulty, even if repeated.
  if (!results || results.length === 0) {
    pipeline = [
      { $match: baseFilter },
      { $sample: { size: 1 } }
    ];
    results = await Question.aggregate(pipeline);
  }

  // If still none, return null
  if (!results || results.length === 0) return null;

  // Aggregate returns plain objects, not full Mongoose docs. That's fine.
  return results[0];
}

module.exports = {
  computeNextDifficulty,
  pickNextQuestion
};
