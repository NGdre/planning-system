/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('session', (table) => {
    table.uuid('id').primary()
    table.uuid('task_id').nullable().references('id').inTable('task')
    table.uuid('time_block_id').nullable()
    table.foreign('time_block_id').references('id').inTable('time_block')

    table.timestamp('start_time').notNullable()
    table.timestamp('end_time').nullable()
    table.string('status').notNullable().checkIn(['active', 'completed'])

    table.index(['status'])
    table.index(['start_time'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('session')
}
