/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('task', (table) => {
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()

    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable()
  })

  await knex.raw(`
    CREATE TRIGGER update_task_updated_at
    AFTER UPDATE ON task
    FOR EACH ROW
    BEGIN
      UPDATE task SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS update_task_updated_at')

  await knex.schema.alterTable('task', (table) => {
    table.dropColumn('created_at')
    table.dropColumn('updated_at')
  })
}
