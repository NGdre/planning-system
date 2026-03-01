/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('interval', (table) => {
    table.uuid('session_id').notNullable().references('id').inTable('session').onDelete('CASCADE')
    table.string('type').notNullable().checkIn(['work', 'break'])
    table.timestamp('start_time').notNullable()
    table.timestamp('end_time').nullable()

    table.index('session_id')
    table.index(['start_time', 'end_time'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable('interval')
}
