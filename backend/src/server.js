import bcrypt from 'bcryptjs'
import express from 'express'
import helmet from 'helmet'
import { pool } from './db.js'
import { authenticate, createToken } from './auth.js'
import { config } from './config.js'

const app = express()
app.use(helmet())
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok', database: 'connected' })
})

app.post('/api/auth/register', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) return res.status(400).json({ error: 'Enter a valid email address.' })
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Password must be between 8 and 72 characters.' })

  const passwordHash = await bcrypt.hash(password, 12)
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash],
    )
    const user = { id: result.insertId, name, email }
    res.status(201).json({ token: createToken(user), user })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists.' })
    throw error
  }
})

app.post('/api/auth/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  const [rows] = await pool.execute('SELECT id, name, email, password_hash FROM users WHERE email = ?', [email])
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' })
  }
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email }
  res.json({ token: createToken(user), user })
})

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email } })
})

app.get('/api/subjects', authenticate, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT s.id, s.name, s.category, s.description, s.color, s.icon,
      (SELECT COUNT(*) FROM notes n WHERE n.subject_id = s.id) AS note_count,
      (SELECT COUNT(*) FROM quizzes q WHERE q.subject_id = s.id) AS quiz_count,
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
     ORDER BY s.sort_order, q.sort_order`,
    [req.user.id],
  )
  res.json({ quizzes: rows })
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
  console.error(error)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

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
