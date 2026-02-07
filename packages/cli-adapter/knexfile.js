import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const config = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.join(__dirname, 'dev.sqlite'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '/src/persistence/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '/src/persistence/seeds'),
    },
  },
  test: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, '/src/persistence/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '/src/persistence/seeds'),
    },
    pool: {
      min: 1,
      max: 1,
    },
  },
}

export default config
