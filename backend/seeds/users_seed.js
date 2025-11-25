const bcrypt = require("bcrypt");

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("users").del();

  const hashedPasswordAdmin = await bcrypt.hash("admin123", 10);
  const hashedPasswordStudent1 = await bcrypt.hash("student123", 10);
  const hashedPasswordStudent2 = await bcrypt.hash("student123", 10);

  return knex("users").insert([
    {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPasswordAdmin,
      role: "admin",
      total_score: 0,
      accuracy: 0,
      streak: 0,
      tests_completed: 0,
      level: "Beginner",
      rank: null,
    },
    {
      name: "Indhiran",
      email: "indhiran019@gmail.com",
      password: hashedPasswordStudent1,
      role: "student",
      total_score: 10,
      accuracy: 85.5,
      streak: 2,
      tests_completed: 1,
      level: "Beginner",
      rank: 5,
    },
    {
      name: "Shamrytha",
      email: "student2@example.com",
      password: hashedPasswordStudent2,
      role: "student",
      total_score: 25,
      accuracy: 90.0,
      streak: 4,
      tests_completed: 3,
      level: "Intermediate",
      rank: 2,
    },
  ]);
};
