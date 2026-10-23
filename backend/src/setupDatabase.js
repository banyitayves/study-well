import { readFile } from 'node:fs/promises'
import { pool } from './db.js'
import { seedDatabase } from './seed.js'

try {
  const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8')
  const statements = schema.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean)
  const connection = await pool.getConnection()
  try {
    for (const statement of statements) await connection.query(statement)
    await seedDatabase(connection)
  } finally {
    connection.release()
  }
  console.log('Database schema and starter study content are ready.')
} finally {
  await pool.end()
}
