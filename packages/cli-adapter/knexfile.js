import { DatabaseConfig } from './src/persistence/db.js'

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
  },
}

export default config
