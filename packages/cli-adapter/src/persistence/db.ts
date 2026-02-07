import knex from 'knex'
import knexConfig from '../../knexfile.js'

export const createDb = (env = process.env.NODE_ENV || 'development') => {
  return knex(knexConfig[env])
}
