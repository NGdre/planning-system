/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('time_block', (table) => {
    table.uuid('id').primary().notNullable()
    table.uuid('task_id').notNullable().references('id').inTable('task').onDelete('CASCADE')
    table.timestamp('created_at').notNullable()
    table.timestamp('start_time').notNullable()
    table.timestamp('end_time').notNullable()
    table.integer('rescheduled_times').notNullable().defaultTo(0)

    table.index(['task_id'])
    table.index(['start_time'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('time_block')
}
