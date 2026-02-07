import knex, { Knex } from 'knex'
import { afterAll, beforeAll, beforeEach } from 'vitest'
import knexConfig from '../../knexfile.js'

export const setupTestDb = () => {
  let testDb: Knex

  beforeAll(async () => {
    testDb = knex(knexConfig.test)

    await testDb.migrate.latest()
  })

  beforeEach(async () => {
    const tables = await testDb.raw(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'knex_%'"
    )

    for (const table of tables) {
      await testDb(table.name).truncate()
    }
  })

  afterAll(async () => {
    await testDb.destroy()
  })

  return () => testDb
}
