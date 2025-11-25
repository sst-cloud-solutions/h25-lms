// backend/scripts/seedQuestions.js
// Seed questions from h25-lms dataset into MongoDB

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Question = require('../models/Question');

// Path to the questions JSON file
const QUESTIONS_FILE = path.join(__dirname, '../../../h25-lms/data/cybersecurity_questions.json');

async function seedQuestions() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Read the JSON file
    console.log('📖 Reading questions file...');
    const rawData = fs.readFileSync(QUESTIONS_FILE, 'utf8');
    const data = JSON.parse(rawData);

    // Clear existing questions
    console.log('🗑️  Clearing existing questions...');
    await Question.deleteMany({});
    console.log('✅ Cleared existing questions');

    // Transform and insert questions
    console.log('📝 Processing questions...');
    const questionsToInsert = [];

    for (const category of data.categories) {
      const { id: categoryId, name: categoryName, questions } = category;

      for (const q of questions) {
        questionsToInsert.push({
          externalId: q.id,
          categoryId: categoryId,
          categoryName: categoryName,
          difficulty: q.difficulty,
          question: q.question,
          options: q.options,
          correctIndex: q.correct_answer,
          explanation: q.explanation
        });
      }
    }

    console.log(`📊 Inserting ${questionsToInsert.length} questions...`);
    await Question.insertMany(questionsToInsert);

    console.log(`✅ Successfully seeded ${questionsToInsert.length} questions!`);
    
    // Show summary by category
    console.log('\n📈 Summary by Category:');
    for (const category of data.categories) {
      const count = category.questions.length;
      console.log(`   - ${category.name}: ${count} questions`);
    }

    // Show summary by difficulty
    console.log('\n📊 Summary by Difficulty:');
    for (let i = 1; i <= 5; i++) {
      const count = await Question.countDocuments({ difficulty: i });
      if (count > 0) {
        console.log(`   - Difficulty ${i}: ${count} questions`);
      }
    }

  } catch (error) {
    console.error('❌ Error seeding questions:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedQuestions();
