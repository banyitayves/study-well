import mysql from 'mysql2/promise'
import { config } from './config.js'

export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  ssl: config.database.ssl
    ? {
        rejectUnauthorized: true,
        ...(config.database.sslCa ? { ca: config.database.sslCa } : {}),
      }
    : undefined,
  waitForConnections: true,
  connectionLimit: 8,
  queueLimit: 0,
  connectTimeout: 10_000,
  dateStrings: ['DATE'],
})
