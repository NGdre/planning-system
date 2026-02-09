import fs from 'fs'
import knex from 'knex'
import knexStringcase from 'knex-stringcase'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
// it is needed for esm modules to work with
const __dirname = path.dirname(__filename)

export class DatabaseConfig {
  static getDatabasePath() {
    const env = process.env.NODE_ENV || 'development'
    const userDataDir = path.join(os.homedir(), '.planning-system')

    fs.mkdirSync(userDataDir, { recursive: true })

    return path.join(userDataDir, env === 'production' ? 'db.sqlite' : 'dev.sqlite')
  }

  static getMigrationsPath() {
    return path.join(__dirname, 'migrations')
  }

  static getSeedsPath() {
    return path.join(__dirname, 'seeds')
  }

  /**
   * @returns {import('knex').Knex.Config}
   */
  static getKnexConfig() {
    return {
      client: 'better-sqlite3',
      connection: {
        filename: DatabaseConfig.getDatabasePath(),
      },
      useNullAsDefault: true,
      migrations: {
        directory: DatabaseConfig.getMigrationsPath(),
      },
      seeds: {
        directory: DatabaseConfig.getSeedsPath(),
      },

      ...knexStringcase(),
    }
  }
}

let connection = null

export class DatabaseConnection {
  static async getConnection() {
    if (!connection) {
      connection = knex(DatabaseConfig.getKnexConfig())

      const migrations = await connection.migrate.list()

      if (migrations[0].length === 0) {
        console.log('Running database migrations...')
        await connection.migrate.latest()
        console.log('Database initialized successfully')
      }
    }
    return connection
  }

  static async close() {
    if (connection) {
      await connection.destroy()
      connection = null
    }
  }
}
