exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('email', 255).unique().notNullable();
    table.string('password', 255).notNullable();
    table.string('role', 50).defaultTo('student');
    table.integer('total_score').defaultTo(0);
    table.decimal('accuracy', 5, 2).defaultTo(0);
    table.integer('streak').defaultTo(0);
    table.integer('tests_completed').defaultTo(0);
    table.string('level', 50).defaultTo('Beginner');
    table.integer('rank').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
