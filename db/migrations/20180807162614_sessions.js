exports.up = function(knex, Promise) {
  return knex.schema.createTable('sessions', table => {
    table.increments();
    table.integer('user_id').notNullable();
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.integer('organization_id').notNullable();
    table.foreign('organization_id').references('organizations.id').onDelete('CASCADE');
    table.string('date').notNullable();
    table.string('start_time').notNullable();
    table.text('location').notNullable();
    table.string('duration').notNullable();
    table.string('delay').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('sessions');
};
