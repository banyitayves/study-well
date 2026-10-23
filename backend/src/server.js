import bcrypt from 'bcryptjs'
import express from 'express'
import helmet from 'helmet'
import { pool } from './db.js'
import { authenticate, createToken, requireAdmin } from './auth.js'
import { config, getConfigurationIssues, isValidAdminSetupToken, requireConfiguration } from './config.js'

const app = express()
app.use(helmet())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_req, res) => {
  const issues = getConfigurationIssues()
  if (issues.length) return res.status(503).json({ status: 'not_ready', error: issues.join(' ') })
  await pool.query('SELECT 1')
  await pool.query('SELECT id FROM users LIMIT 0')
  await pool.query('SELECT id FROM quiz_questions LIMIT 0')
  res.json({ status: 'ok', database: 'connected' })
})

app.post('/api/auth/register', async (req, res) => {
  requireConfiguration()
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const requestedRole = req.body.role || 'student'
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) return res.status(400).json({ error: 'Enter a valid email address.' })
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' })
  if (!['student', 'teacher'].includes(requestedRole)) return res.status(400).json({ error: 'Choose student or teacher for your account.' })
  const isConfiguredAdmin = email === config.adminEmail && Boolean(config.adminEmail)
  const validAdminToken = isValidAdminSetupToken(req.body.adminSetupToken)
  if (requestedRole === 'teacher' && !isConfiguredAdmin) {
    return res.status(403).json({ error: 'Teacher registration is limited to the configured teacher account. Check the email address or contact your administrator.' })
  }
  if (requestedRole === 'teacher' && !validAdminToken) {
    return res.status(403).json({ error: 'The teacher setup code is incorrect.' })
  }
  if (isConfiguredAdmin && req.body.adminSetupToken && !validAdminToken) {
    return res.status(403).json({ error: 'The teacher setup code is incorrect.' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const role = requestedRole === 'teacher' ? 'admin' : 'student'
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role],
    )
    const user = { id: result.insertId, name, email, role }
    res.status(201).json({ token: createToken(user), user })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists.' })
    throw error
  }
})

app.post('/api/auth/login', async (req, res) => {
  requireConfiguration()
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const isConfiguredAdmin = email === config.adminEmail && Boolean(config.adminEmail)
  const validAdminToken = isValidAdminSetupToken(req.body.adminSetupToken)
  if (isConfiguredAdmin && req.body.adminSetupToken && !validAdminToken) {
    return res.status(403).json({ error: 'The teacher setup code is incorrect.' })
  }
  const [rows] = await pool.execute('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', [email])
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' })
  }
  const role = isConfiguredAdmin && validAdminToken ? 'admin' : rows[0].role
  if (role !== rows[0].role) {
    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, rows[0].id])
  }
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email, role }
  res.json({ token: createToken(user), user })
})

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role || 'student' } })
})

app.get('/api/subjects', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT s.id, s.name, s.category, s.description, s.color, s.icon,
      (SELECT COUNT(*) FROM notes n WHERE n.subject_id = s.id) AS note_count,
      (SELECT COUNT(*) FROM quizzes q WHERE q.subject_id = s.id
        AND EXISTS (SELECT 1 FROM quiz_questions ready WHERE ready.quiz_id = q.id)) AS quiz_count,
      (SELECT COUNT(*) FROM note_progress np JOIN notes n ON n.id = np.note_id WHERE n.subject_id = s.id AND np.user_id = ?) AS completed_notes
     FROM subjects s ORDER BY s.sort_order, s.name`,
    [req.user.id],
  )
  res.json({ subjects: rows })
})

app.get('/api/notes', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT n.id, n.subject_id, n.title, n.summary, n.read_minutes, s.name AS subject_name,
      s.color AS subject_color, (np.note_id IS NOT NULL) AS completed
     FROM notes n JOIN subjects s ON s.id = n.subject_id
     LEFT JOIN note_progress np ON np.note_id = n.id AND np.user_id = ?
     ORDER BY s.sort_order, n.sort_order`,
    [req.user.id],
  )
  res.json({ notes: rows })
})

app.get('/api/notes/:id', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT n.id, n.subject_id, n.title, n.summary, n.content, n.read_minutes, s.name AS subject_name,
      s.color AS subject_color, (np.note_id IS NOT NULL) AS completed
     FROM notes n JOIN subjects s ON s.id = n.subject_id
     LEFT JOIN note_progress np ON np.note_id = n.id AND np.user_id = ?
     WHERE n.id = ?`,
    [req.user.id, req.params.id],
  )
  if (!rows.length) return res.status(404).json({ error: 'Note not found.' })
  res.json({ note: rows[0] })
})

app.post('/api/notes/:id/complete', authenticate, async (req, res) => {
  const [result] = await pool.execute(
    `INSERT IGNORE INTO note_progress (user_id, note_id)
     SELECT ?, id FROM notes WHERE id = ?`,
    [req.user.id, req.params.id],
  )
  if (result.affectedRows === 0) {
    const [rows] = await pool.execute('SELECT id FROM notes WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Note not found.' })
  }
  res.json({ completed: true })
})

app.get('/api/quizzes', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT q.id, q.subject_id, q.title, q.description, q.duration_minutes, s.name AS subject_name,
      s.color AS subject_color,
      (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
      (SELECT MAX(ROUND(100 * qa.score / qa.total_questions)) FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.user_id = ?) AS best_score
     FROM quizzes q JOIN subjects s ON s.id = q.subject_id
     WHERE EXISTS (SELECT 1 FROM quiz_questions ready WHERE ready.quiz_id = q.id)
     ORDER BY s.sort_order, q.sort_order`,
    [req.user.id],
  )
  res.json({ quizzes: rows })
})

app.get('/api/admin/quizzes', authenticate, requireAdmin, async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT q.id, q.subject_id, q.title, q.description, q.duration_minutes,
      s.name AS subject_name,
      (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count
     FROM quizzes q JOIN subjects s ON s.id = q.subject_id
     ORDER BY s.sort_order, q.sort_order, q.id DESC`,
  )
  res.json({ quizzes: rows })
})

app.post('/api/admin/quizzes', authenticate, requireAdmin, async (req, res) => {
  const subjectId = Number(req.body.subjectId)
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
  const durationMinutes = Number(req.body.durationMinutes)
  if (!Number.isSafeInteger(subjectId) || subjectId < 1) return res.status(400).json({ error: 'Choose a valid subject.' })
  if (!title || title.length > 180) return res.status(400).json({ error: 'Quiz title is required and must be at most 180 characters.' })
  if (!description || description.length > 500) return res.status(400).json({ error: 'Quiz description is required and must be at most 500 characters.' })
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 255) {
    return res.status(400).json({ error: 'Duration must be between 1 and 255 minutes.' })
  }
  const [subjects] = await pool.execute('SELECT id FROM subjects WHERE id = ?', [subjectId])
  if (!subjects.length) return res.status(400).json({ error: 'Choose a valid subject.' })
  const [result] = await pool.execute(
    'INSERT INTO quizzes (subject_id, title, description, duration_minutes) VALUES (?, ?, ?, ?)',
    [subjectId, title, description, durationMinutes],
  )
  res.status(201).json({ quiz: { id: result.insertId, subject_id: subjectId, title, description, duration_minutes: durationMinutes, question_count: 0 } })
})

function normalizeQuestions(quizId, questions) {
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 100) {
    return { error: 'Upload between 1 and 100 questions.' }
  }
  const normalized = []
  for (const [index, question] of questions.entries()) {
    const fields = ['prompt', 'choiceA', 'choiceB', 'choiceC', 'choiceD']
    if (!question || fields.some((field) => typeof question[field] !== 'string' || !question[field].trim())) {
      return { error: `Question ${index + 1} is missing its question text or one of its four choices.` }
    }
    if (question.prompt.trim().length > 500
      || [question.choiceA, question.choiceB, question.choiceC, question.choiceD].some((choice) => choice.trim().length > 255)
      || (typeof question.explanation === 'string' && question.explanation.trim().length > 500)) {
      return { error: `Question ${index + 1} exceeds the allowed text length.` }
    }
    const answer = typeof question.correctAnswer === 'string' ? question.correctAnswer.trim().toUpperCase() : ''
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      return { error: `Question ${index + 1} must have correct_answer set to A, B, C, or D.` }
    }
    normalized.push([
      quizId,
      question.prompt.trim(),
      question.choiceA.trim(),
      question.choiceB.trim(),
      question.choiceC.trim(),
      question.choiceD.trim(),
      answer,
      typeof question.explanation === 'string' ? question.explanation.trim() : '',
      index + 1,
    ])
  }
  return { questions: normalized }
}

app.post('/api/admin/quizzes/import', authenticate, requireAdmin, async (req, res) => {
  const subjectId = Number(req.body.subjectId)
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : ''
  const durationMinutes = Number(req.body.durationMinutes)
  if (!Number.isSafeInteger(subjectId) || subjectId < 1) return res.status(400).json({ error: 'Choose a valid subject.' })
  if (!title || title.length > 180) return res.status(400).json({ error: 'Quiz title is required and must be at most 180 characters.' })
  if (!description || description.length > 500) return res.status(400).json({ error: 'Quiz description is required and must be at most 500 characters.' })
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 255) {
    return res.status(400).json({ error: 'Duration must be between 1 and 255 minutes.' })
  }
  const normalized = normalizeQuestions(0, req.body.questions)
  if (normalized.error) return res.status(400).json({ error: normalized.error })

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [subjects] = await connection.execute('SELECT id FROM subjects WHERE id = ?', [subjectId])
    if (!subjects.length) {
      await connection.rollback()
      return res.status(400).json({ error: 'Choose a valid subject.' })
    }
    const [quizResult] = await connection.execute(
      'INSERT INTO quizzes (subject_id, title, description, duration_minutes) VALUES (?, ?, ?, ?)',
      [subjectId, title, description, durationMinutes],
    )
    const quizId = quizResult.insertId
    await connection.query(
      `INSERT INTO quiz_questions
        (quiz_id, prompt, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, sort_order)
       VALUES ?`,
      [normalized.questions.map(([, ...question]) => [quizId, ...question])],
    )
    await connection.commit()
    res.status(201).json({
      quiz: { id: quizId, subject_id: subjectId, title, description, duration_minutes: durationMinutes, question_count: normalized.questions.length },
      imported: normalized.questions.length,
    })
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
})

app.put('/api/admin/quizzes/:id/questions', authenticate, requireAdmin, async (req, res) => {
  const quizId = Number(req.params.id)
  if (!Number.isSafeInteger(quizId) || quizId < 1) return res.status(400).json({ error: 'Choose a valid quiz.' })
  const normalized = normalizeQuestions(quizId, req.body.questions)
  if (normalized.error) return res.status(400).json({ error: normalized.error })

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [quizzes] = await connection.execute('SELECT id FROM quizzes WHERE id = ? FOR UPDATE', [quizId])
    if (!quizzes.length) {
      await connection.rollback()
      return res.status(404).json({ error: 'Quiz not found.' })
    }
    await connection.execute('DELETE FROM quiz_questions WHERE quiz_id = ?', [quizId])
    await connection.query(
      `INSERT INTO quiz_questions
        (quiz_id, prompt, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, sort_order)
       VALUES ?`,
      [normalized.questions],
    )
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
  res.json({ imported: normalized.questions.length })
})

app.get('/api/quizzes/:id', authenticate, async (req, res) => {
  const [quizzes] = await pool.execute(
    `SELECT q.id, q.subject_id, q.title, q.description, q.duration_minutes, s.name AS subject_name, s.color AS subject_color
     FROM quizzes q JOIN subjects s ON s.id = q.subject_id WHERE q.id = ?`,
    [req.params.id],
  )
  if (!quizzes.length) return res.status(404).json({ error: 'Quiz not found.' })
  const [questions] = await pool.execute(
    `SELECT id, prompt, choice_a, choice_b, choice_c, choice_d
     FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order`,
    [req.params.id],
  )
  res.json({ quiz: quizzes[0], questions })
})

app.post('/api/quizzes/:id/attempts', authenticate, async (req, res) => {
  const submitted = req.body.answers
  if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) {
    return res.status(400).json({ error: 'Submit an answer for each question.' })
  }
  const [quizzes] = await pool.execute('SELECT id, title FROM quizzes WHERE id = ?', [req.params.id])
  if (!quizzes.length) return res.status(404).json({ error: 'Quiz not found.' })
  const [questions] = await pool.execute(
    `SELECT id, prompt, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation
     FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order`,
    [req.params.id],
  )
  if (!questions.length) return res.status(400).json({ error: 'This quiz does not have any questions yet.' })
  const validIds = new Set(questions.map((question) => String(question.id)))
  if (Object.keys(submitted).length !== questions.length || Object.keys(submitted).some((id) => !validIds.has(id))) {
    return res.status(400).json({ error: 'Answer every question before submitting.' })
  }
  const review = questions.map((question) => {
    const selected = submitted[String(question.id)]
    if (!['A', 'B', 'C', 'D'].includes(selected)) return null
    return {
      id: question.id,
      prompt: question.prompt,
      selected,
      correctAnswer: question.correct_answer,
      correct: selected === question.correct_answer,
      explanation: question.explanation,
    }
  })
  if (review.some((answer) => answer === null)) return res.status(400).json({ error: 'Answers must be A, B, C, or D.' })
  const score = review.filter((answer) => answer.correct).length
  await pool.execute(
    'INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, answers_json) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, req.params.id, score, questions.length, JSON.stringify(submitted)],
  )
  res.status(201).json({ result: { quizTitle: quizzes[0].title, score, totalQuestions: questions.length, review } })
})

app.get('/api/progress', authenticate, async (req, res) => {
  const [[stats]] = await pool.execute(
    `SELECT
      (SELECT COUNT(*) FROM note_progress WHERE user_id = ?) AS completed_notes,
      (SELECT COALESCE(SUM(n.read_minutes), 0) FROM note_progress np JOIN notes n ON n.id = np.note_id WHERE np.user_id = ?) AS minutes_studied,
      (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ?) AS quizzes_taken,
      (SELECT COALESCE(ROUND(AVG(100 * score / total_questions)), 0) FROM quiz_attempts WHERE user_id = ?) AS average_score`,
    [req.user.id, req.user.id, req.user.id, req.user.id],
  )
  const [recentAttempts] = await pool.execute(
    `SELECT qa.id, qa.score, qa.total_questions, qa.completed_at, q.title AS quiz_title, s.name AS subject_name,
      ROUND(100 * qa.score / qa.total_questions) AS percentage
     FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id JOIN subjects s ON s.id = q.subject_id
     WHERE qa.user_id = ? ORDER BY qa.completed_at DESC LIMIT 8`,
    [req.user.id],
  )
  res.json({ stats, recentAttempts })
})

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.code || error.message)
  if (error.code === 'APP_CONFIG_MISSING') {
    return res.status(503).json({ error: error.message })
  }
  if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(503).json({ error: 'The study database is not initialized or is out of date. Run npm run db:setup against the configured TiDB database.' })
  }
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ER_ACCESS_DENIED_ERROR', 'ETLS_CERT_ALTNAME_INVALID'].includes(error.code)) {
    return res.status(503).json({ error: 'The API cannot connect to the database. Check the DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL settings, and the TiDB IP allowlist in Vercel.' })
  }
  return res.status(500).json({ error: 'The study service encountered an error. Check the Vercel function logs for the API service.' })
})

if (process.env.VERCEL !== '1') {
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`Study Space API listening on port ${config.port}.`)
  })

  async function shutdown() {
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

export default app
