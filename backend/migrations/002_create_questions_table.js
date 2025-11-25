exports.up = function(knex) {
  return knex.schema.createTable('questions', function(table) {
    table.increments('id').primary();
    table.string('category', 100).notNullable();
    table.integer('difficulty').notNullable();
    table.text('question').notNullable();
    table.json('options').notNullable();
    table.integer('correct_answer').notNullable();
    table.text('explanation').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('questions');
};
