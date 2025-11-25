// backend/lib/questionGenerator.js
// AI-powered dynamic question generation

const { aiClient } = require('./aiClient');
const Question = require('../models/Question');

/**
 * Generate a tailored cybersecurity question using AI
 * 
 * @param {Object} params
 * @param {Number} params.difficulty - Target difficulty (1-5)
 * @param {String} params.categoryId - Optional category ID (e.g., "basic-phishing")
 * @param {Array} params.userHistory - Optional array of previous question IDs to avoid
 * @param {Object} params.weakAreas - Optional object with category performance data
 * @returns {Object|null} Question object matching Question model schema, or null on error
 */
async function generateQuestion({ difficulty = 2, categoryId = null, userHistory = [], weakAreas = {} }) {
  try {
    // Determine category if not specified
    let targetCategory = categoryId;
    if (!targetCategory && Object.keys(weakAreas).length > 0) {
      // Focus on weakest area
      const sorted = Object.entries(weakAreas)
        .sort((a, b) => a[1].accuracy - b[1].accuracy);
      targetCategory = sorted[0][0];
    }

    // Get category info if specified
    let categoryName = 'Cybersecurity';
    if (targetCategory) {
      const sample = await Question.findOne({ categoryId: targetCategory });
      if (sample) {
        categoryName = sample.categoryName;
      }
    }

    // Build prompt for AI
    const difficultyLabels = {
      1: 'beginner/easy',
      2: 'intermediate',
      3: 'moderate',
      4: 'advanced',
      5: 'expert'
    };

    const prompt = `
You are an expert cybersecurity educator creating training questions.

Generate a multiple-choice cybersecurity question with the following requirements:

Difficulty Level: ${difficulty} (${difficultyLabels[difficulty] || 'intermediate'})
Topic/Category: ${categoryName}
${targetCategory ? `Category ID: ${targetCategory}` : ''}

Requirements:
1. Create a realistic, practical cybersecurity scenario question
2. Provide exactly 4 multiple-choice options (A, B, C, D)
3. Mark the correct answer clearly
4. Include a brief explanation
5. Make it relevant to real-world cybersecurity threats
6. Difficulty should match the level specified

Return your response as a JSON object with this exact structure:
{
  "question": "The question text here?",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctIndex": 0,
  "explanation": "Brief explanation of why the correct answer is right"
}

Important:
- correctIndex must be 0, 1, 2, or 3 (0-indexed)
- All 4 options must be plausible but only one is correct
- Question should be specific to cybersecurity (phishing, malware, passwords, social engineering, network security, etc.)
- Make it practical and applicable to workplace scenarios

Return ONLY the JSON object, no markdown, no code fences, no additional text.
    `.trim();

    // Generate question using AI
    const generated = await aiClient.generateJson(prompt);

    // Validate structure
    if (!generated.question || !Array.isArray(generated.options) || generated.options.length !== 4) {
      console.error('❌ Invalid question structure from AI');
      return null;
    }

    if (generated.correctIndex < 0 || generated.correctIndex > 3) {
      console.error('❌ Invalid correctIndex from AI');
      return null;
    }

    // Create question object matching our model
    const questionData = {
      externalId: `ai-generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      categoryId: targetCategory || 'general',
      categoryName: categoryName,
      difficulty: difficulty,
      question: generated.question,
      options: generated.options,
      correctIndex: generated.correctIndex,
      explanation: generated.explanation || 'AI-generated question'
    };

    // Optionally save to database for reuse (commented out to avoid cluttering DB)
    // const saved = await Question.create(questionData);
    // return saved;

    // Return as plain object (can be saved later if needed)
    return questionData;
  } catch (error) {
    console.error('❌ Error generating AI question:', error.message);
    return null;
  }
}

/**
 * Generate a question and optionally save it to the database
 */
async function generateAndSaveQuestion(params) {
  const question = await generateQuestion(params);
  if (!question) return null;

  try {
    const saved = await Question.create(question);
    return saved;
  } catch (error) {
    console.error('❌ Error saving generated question:', error.message);
    return question; // Return unsaved question as fallback
  }
}

module.exports = {
  generateQuestion,
  generateAndSaveQuestion
};

