import { DatabaseConfig } from './src/persistence/db.js'
import knexStringcase from 'knex-stringcase'

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const config = {
  development: DatabaseConfig.getKnexConfig(),
  production: DatabaseConfig.getKnexConfig(),
  test: {
    ...DatabaseConfig.getKnexConfig(),
    connection: {
      filename: ':memory:',
    },
    pool: {
      min: 1,
      max: 1,
    },
    ...knexStringcase(),
  },
}

export default config
