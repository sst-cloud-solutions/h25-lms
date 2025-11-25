// backend/scripts/seedUsers.js
// Script to seed database with sample users

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Seed users into the database
 */
async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB');

    // Hash password for all users (using same password for demo)
    const defaultPassword = 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Create 5 learner users
    const learners = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        passwordHash,
        role: 'learner'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        passwordHash,
        role: 'learner'
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        passwordHash,
        role: 'learner'
      },
      {
        name: 'Sarah Williams',
        email: 'sarah.williams@example.com',
        passwordHash,
        role: 'learner'
      },
      {
        name: 'David Brown',
        email: 'david.brown@example.com',
        passwordHash,
        role: 'learner'
      }
    ];

    // Create 1 admin user
    const admin = {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash,
      role: 'admin'
    };

    // Insert users (skip if they already exist)
    let createdLearners = [];
    let createdAdmin = null;
    let skippedCount = 0;

    // Insert learners
    for (const learner of learners) {
      try {
        const existing = await User.findOne({ email: learner.email });
        if (existing) {
          console.log(`   ⏭️  Skipped: ${learner.email} (already exists)`);
          skippedCount++;
        } else {
          const created = await User.create(learner);
          createdLearners.push(created);
          console.log(`   ✅ Created: ${learner.email}`);
        }
      } catch (err) {
        console.error(`   ❌ Error creating ${learner.email}:`, err.message);
      }
    }

    // Insert admin
    try {
      const existingAdmin = await User.findOne({ email: admin.email });
      if (existingAdmin) {
        console.log(`   ⏭️  Skipped: ${admin.email} (already exists)`);
        skippedCount++;
      } else {
        createdAdmin = await User.create(admin);
        console.log(`   ✅ Created: ${admin.email}`);
      }
    } catch (err) {
      console.error(`   ❌ Error creating admin:`, err.message);
    }


    console.log('\n✅ Seeding complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   Learners created: ${createdLearners.length}`);
    console.log(`   Admin created: ${createdAdmin ? 1 : 0}`);
    console.log(`   Skipped (already exist): ${skippedCount}`);
    console.log(`   Total new users: ${createdLearners.length + (createdAdmin ? 1 : 0)}`);

    console.log(`\n🔑 Login Credentials (all users):`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`\n   Learners:`);
    createdLearners.forEach((user) => {
      console.log(`     - ${user.email} (${user.name})`);
    });
    console.log(`\n   Admin:`);
    console.log(`     - ${createdAdmin.email} (${createdAdmin.name})`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers };

