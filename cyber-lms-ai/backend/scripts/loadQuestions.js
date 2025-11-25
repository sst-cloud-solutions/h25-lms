// backend/scripts/loadQuestions.js
// Script to load questions from JSON file into MongoDB

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Scale difficulty from 1-10 (JSON) to 1-5 (Model)
 * 1-2 → 1, 3-4 → 2, 5-6 → 3, 7-8 → 4, 9-10 → 5
 */
function scaleDifficulty(difficulty) {
  if (difficulty <= 2) return 1;
  if (difficulty <= 4) return 2;
  if (difficulty <= 6) return 3;
  if (difficulty <= 8) return 4;
  return 5;
}

/**
 * Load questions from JSON file and insert into MongoDB
 */
async function loadQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB');

    // Read JSON file
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'h25-lms', 'data', 'cybersecurity_questions.json'),
      path.join(__dirname, '..', 'data', 'questions.cyber.json'),
      path.join(__dirname, '..', '..', '..', 'h25-lms', 'data', 'cybersecurity_questions.json')
    ];

    let jsonPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        jsonPath = p;
        break;
      }
    }

    if (!jsonPath) {
      console.error('❌ Could not find questions JSON file. Tried:', possiblePaths);
      process.exit(1);
    }

    console.log(`📂 Reading questions from: ${jsonPath}`);
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    if (!data.categories || !Array.isArray(data.categories)) {
      console.error('❌ Invalid JSON structure. Expected { categories: [...] }');
      process.exit(1);
    }

    // Clear existing questions (optional - comment out if you want to keep existing)
    const existingCount = await Question.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing questions. Deleting...`);
      await Question.deleteMany({});
    }

    let totalLoaded = 0;
    let totalSkipped = 0;

    // Process each category
    for (const category of data.categories) {
      const categoryId = category.id;
      const categoryName = category.name;

      if (!category.questions || !Array.isArray(category.questions)) {
        console.warn(`⚠️  Category ${categoryId} has no questions, skipping...`);
        continue;
      }

      console.log(`\n📚 Processing category: ${categoryName} (${category.questions.length} questions)`);

      // Process each question
      for (const q of category.questions) {
        try {
          // Map JSON structure to Question model
          const questionData = {
            externalId: q.id,
            categoryId: categoryId,
            categoryName: categoryName,
            difficulty: scaleDifficulty(q.difficulty),
            question: q.question,
            options: q.options,
            correctIndex: q.correct_answer, // JSON uses correct_answer (0-indexed)
            explanation: q.explanation
          };

          // Validate required fields
          if (!questionData.externalId || !questionData.question || !questionData.options || questionData.options.length < 2) {
            console.warn(`⚠️  Skipping invalid question: ${q.id}`);
            totalSkipped++;
            continue;
          }

          // Check if question already exists (by externalId)
          const existing = await Question.findOne({ externalId: questionData.externalId });
          if (existing) {
            // Update existing question
            await Question.findOneAndUpdate(
              { externalId: questionData.externalId },
              questionData,
              { upsert: false }
            );
            console.log(`  ✓ Updated: ${questionData.externalId}`);
          } else {
            // Insert new question
            await Question.create(questionData);
            console.log(`  ✓ Created: ${questionData.externalId}`);
          }

          totalLoaded++;
        } catch (err) {
          console.error(`  ❌ Error processing question ${q.id}:`, err.message);
          totalSkipped++;
        }
      }
    }

    console.log(`\n✅ Load complete!`);
    console.log(`   Loaded: ${totalLoaded} questions`);
    console.log(`   Skipped: ${totalSkipped} questions`);

    // Show summary by category
    const summary = await Question.aggregate([
      {
        $group: {
          _id: '$categoryName',
          count: { $sum: 1 },
          avgDifficulty: { $avg: '$difficulty' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log(`\n📊 Summary by category:`);
    summary.forEach((cat) => {
      console.log(`   ${cat._id}: ${cat.count} questions (avg difficulty: ${cat.avgDifficulty.toFixed(1)})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error loading questions:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  loadQuestions();
}

module.exports = { loadQuestions, scaleDifficulty };

