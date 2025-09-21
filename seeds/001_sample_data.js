const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  // Clear existing data
  await knex("votes").del();
  await knex("poll_options").del();
  await knex("polls").del();
  await knex("poll_categories").del();
  await knex("users").del();

  // Insert sample users
  const hashedPassword = await bcrypt.hash("password123", 12);

  const [user1, user2] = await knex("users")
    .insert([
      {
        email: "admin@example.com",
        password: hashedPassword,
        firstName: "Admin",
        age: 30,
        role: "admin",
      },
      {
        email: "user@example.com",
        password: hashedPassword,
        firstName: "Regular",
        age: 25,
        role: "user",
      },
    ])
    .returning("*");

  // Insert sample categories
  const [category1, category2] = await knex("poll_categories")
    .insert([
      {
        name: "Technology",
        description: "Polls about technology and software",
      },
      {
        name: "Food & Drink",
        description: "Polls about food preferences and dining",
      },
    ])
    .returning("*");

  // Insert sample polls
  const [poll1] = await knex("polls")
    .insert([
      {
        title: "What is your favorite programming language?",
        description:
          "Vote for your most preferred programming language for web development",
        createdBy: user1.id,
        categoryId: category1.id,
        status: "active",
        allowMultipleVotes: false,
      },
    ])
    .returning("*");

  // Insert poll options
  await knex("poll_options").insert([
    {
      pollId: poll1.id,
      text: "JavaScript",
      voteCount: 0,
    },
    {
      pollId: poll1.id,
      text: "Python",
      voteCount: 0,
    },
    {
      pollId: poll1.id,
      text: "Java",
      voteCount: 0,
    },
    {
      pollId: poll1.id,
      text: "C#",
      voteCount: 0,
    },
  ]);
};
