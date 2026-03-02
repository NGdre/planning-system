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
    await testDb('interval').delete()
    await testDb('session').delete()
    await testDb('time_block').delete()
    await testDb('task').delete()
  })

  afterAll(async () => {
    await testDb.destroy()
  })

  return () => testDb
}
