import { readFile } from 'node:fs/promises'
import { pool } from './db.js'
import { seedDatabase } from './seed.js'

try {
  const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8')
  const statements = schema.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean)
  const connection = await pool.getConnection()
  try {
    for (const statement of statements) await connection.query(statement)
    const [roleColumn] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
    )
    if (!roleColumn.length) {
      await connection.query("ALTER TABLE users ADD COLUMN role ENUM('student', 'admin') NOT NULL DEFAULT 'student' AFTER password_hash")
    }
    const [questionOrderIndex] = await connection.execute(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quiz_questions' AND INDEX_NAME = 'uq_questions_quiz_order'`,
    )
    if (!questionOrderIndex.length) {
      await connection.query('ALTER TABLE quiz_questions ADD UNIQUE INDEX uq_questions_quiz_order (quiz_id, sort_order)')
    }
    await seedDatabase(connection)
  } finally {
    connection.release()
  }
  console.log('Database schema and starter study content are ready.')
} finally {
  await pool.end()
}
