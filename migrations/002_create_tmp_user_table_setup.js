exports.up = function (knex) {
  return (
    knex.schema
      // Users table
      .createTable("tmp_users", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("email").unique().nullable();
        table.string("firstName").nullable();
        table.integer("age").nullable();
        table.timestamp("registerTime");
        table.timestamps(true, true);
      })
  );
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("tmp_users");
};
