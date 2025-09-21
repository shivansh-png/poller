exports.up = function (knex) {
  return (
    knex.schema
      // Users table
      .createTable("users", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("email").unique().notNullable();
        table.string("password").notNullable();
        table.string("firstName").notNullable();
        table.integer("age");
        table.enum("role", ["admin", "user"]).defaultTo("user");
        table.timestamp("lastLoginTime");
        table.timestamps(true, true);
      })
      // Poll categories table
      .createTable("poll_categories", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("name").unique().notNullable();
        table.string("description");
        table.timestamps(true, true);
      })
      // Polls table
      .createTable("polls", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("title").notNullable();
        table.text("description");
        table
          .uuid("createdBy")
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table
          .uuid("categoryId")
          .references("id")
          .inTable("poll_categories")
          .onDelete("SET NULL");
        table
          .enum("status", ["draft", "active", "expired"])
          .defaultTo("active");
        table.timestamp("expiresAt");
        table.boolean("allowMultipleVotes").defaultTo(false);
        table.timestamps(true, true);
      })
      // Poll options table
      .createTable("poll_options", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("pollId")
          .references("id")
          .inTable("polls")
          .onDelete("CASCADE");
        table.string("text").notNullable();
        table.integer("voteCount").defaultTo(0);
        table.timestamps(true, true);
      })
      // Votes table
      .createTable("votes", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table
          .uuid("pollId")
          .references("id")
          .inTable("polls")
          .onDelete("CASCADE");
        table
          .uuid("optionId")
          .references("id")
          .inTable("poll_options")
          .onDelete("CASCADE");
        table
          .uuid("userId")
          .references("id")
          .inTable("users")
          .onDelete("CASCADE");
        table.string("ipAddress");
        table.timestamps(true, true);

        // Prevent duplicate voting
        table.unique(["pollId", "userId"]);
        table.index(["pollId", "optionId"]);
      })
  );
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("votes")
    .dropTableIfExists("poll_options")
    .dropTableIfExists("polls")
    .dropTableIfExists("poll_categories")
    .dropTableIfExists("users");
};
