import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Atom,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileUp,
  FlaskConical,
  GraduationCap,
  Leaf,
  LockKeyhole,
  LogOut,
  Menu,
  Microscope,
  Orbit,
  PenLine,
  Pi,
  Play,
  Plus,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react'

const TOKEN_KEY = 'study-space-token'
const subjectIcons = { Pi, Leaf, Orbit, FlaskConical, PenLine }
const colors = {
  violet: { tile: 'bg-violet-100 text-violet-700', soft: 'bg-violet-50', bar: 'bg-violet-500', ring: 'ring-violet-200' },
  emerald: { tile: 'bg-emerald-100 text-emerald-700', soft: 'bg-emerald-50', bar: 'bg-emerald-500', ring: 'ring-emerald-200' },
  sky: { tile: 'bg-sky-100 text-sky-700', soft: 'bg-sky-50', bar: 'bg-sky-500', ring: 'ring-sky-200' },
  amber: { tile: 'bg-amber-100 text-amber-700', soft: 'bg-amber-50', bar: 'bg-amber-500', ring: 'ring-amber-200' },
  rose: { tile: 'bg-rose-100 text-rose-700', soft: 'bg-rose-50', bar: 'bg-rose-500', ring: 'ring-rose-200' },
}
const navigation = [
  { id: 'overview', label: 'Overview', icon: Sparkles },
  { id: 'subjects', label: 'My subjects', icon: GraduationCap },
  { id: 'notes', label: 'Study notes', icon: BookOpen },
  { id: 'quizzes', label: 'Quizzes', icon: Target },
  { id: 'progress', label: 'My progress', icon: Award },
]
const teacherNavigation = [
  { id: 'overview', label: 'Teacher dashboard', icon: Sparkles },
  { id: 'manage-quizzes', label: 'Manage quizzes', icon: FileUp },
  { id: 'subjects', label: 'Subjects', icon: GraduationCap },
  { id: 'notes', label: 'Study notes', icon: BookOpen },
  { id: 'quizzes', label: 'Student quizzes', icon: Target },
]

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  let response
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Cannot reach the study API. Check the Vercel backend service and its deployment status.')
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `The study API returned an error (${response.status}). Check the Vercel function logs.`)
  return payload
}

function parseQuizCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const source = text.replace(/^\uFEFF/, '')
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted && character === '"' && source[index + 1] === '"') {
      cell += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (!quoted && character === ',') {
      row.push(cell.trim())
      cell = ''
    } else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && source[index + 1] === '\n') index += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }
  if (quoted) throw new Error('The CSV has an unclosed quotation mark.')
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  if (rows.length < 2) throw new Error('The CSV must include a header row and at least one question.')

  const headers = rows[0].map((header) => {
    const normalized = header.trim().toLowerCase()
    return normalized === 'explanation (optional)' ? 'explanation' : normalized
  })
  const requiredHeaders = ['question', 'choice_a', 'choice_b', 'choice_c', 'choice_d', 'correct_answer']
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))
  if (missingHeaders.length) throw new Error(`CSV is missing these columns: ${missingHeaders.join(', ')}.`)
  if (new Set(headers).size !== headers.length) throw new Error('The CSV contains duplicate column names.')

  const column = Object.fromEntries([...requiredHeaders, 'explanation'].map((header) => [header, headers.indexOf(header)]))
  const questions = rows.slice(1).map((values, index) => {
    const question = {
      prompt: values[column.question] || '',
      choiceA: values[column.choice_a] || '',
      choiceB: values[column.choice_b] || '',
      choiceC: values[column.choice_c] || '',
      choiceD: values[column.choice_d] || '',
      correctAnswer: (values[column.correct_answer] || '').toUpperCase(),
      explanation: column.explanation === undefined ? '' : values[column.explanation] || '',
    }
    if ([question.prompt, question.choiceA, question.choiceB, question.choiceC, question.choiceD].some((value) => !value)) {
      throw new Error(`Question row ${index + 2} needs a question and all four choices.`)
    }
    if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
      throw new Error(`Question row ${index + 2} must use A, B, C, or D in correct_answer.`)
    }
    return question
  })
  if (questions.length > 100) throw new Error('A quiz can contain at most 100 questions per upload.')
  return questions
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'S'
}

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
}

function SubjectIcon({ subject, className = 'h-5 w-5' }) {
  const Icon = subjectIcons[subject?.icon] || BookOpen
  return <Icon className={className} strokeWidth={1.8} />
}

function Brand({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="brand-mark"><BookOpen className="h-[19px] w-[19px]" strokeWidth={2.2} /></span>
      <span className={`font-display text-[19px] font-extrabold tracking-[-0.7px] ${light ? 'text-white' : 'text-ink'}`}>
        study<span className={light ? 'text-lime' : 'text-green'}>space</span>
      </span>
    </div>
  )
}

function AuthPage({ onSignedIn }) {
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', adminSetupToken: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) })
      localStorage.setItem(TOKEN_KEY, result.token)
      onSignedIn(result.user)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page min-h-screen">
      <section className="auth-story relative hidden overflow-hidden lg:flex">
        <div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" />
        <div className="relative z-10 flex w-full flex-col p-12 xl:p-[72px]">
          <Brand light />
          <div className="mt-auto max-w-[520px] pb-7 pt-24">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2 text-[12px] font-semibold tracking-wide text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-lime" /> YOUR LITTLE CORNER TO GROW
            </div>
            <h1 className="font-display text-[54px] font-bold leading-[1.08] tracking-[-2.8px] text-white xl:text-[64px]">
              Make room<br />for <span className="text-lime">what’s next.</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[16px] leading-7 text-white/65">
              Clear notes, quick quizzes, and a little progress every day. Your next big idea starts here.
            </p>
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['#d9a27f', '#7eaa96', '#b9a5da', '#e0bf75'].map((color, index) => (
                  <span key={color} className="avatar-dot" style={{ backgroundColor: color, zIndex: 4 - index }}>
                    {['A', 'M', 'J', 'S'][index]}
                  </span>
                ))}
              </div>
              <p className="text-[12px] text-white/60"><span className="font-bold text-white">A space for curious minds</span><br />One step at a time.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-lime" /> YOUR STUDY JOURNEY STARTS HERE</div>
        </div>
        <div className="story-card absolute bottom-[14%] right-[8%] hidden w-[225px] rotate-[5deg] rounded-[24px] border border-white/10 bg-white/[0.10] p-5 shadow-2xl backdrop-blur-md xl:block">
          <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-green"><Atom className="h-5 w-5" /></span>
          <p className="text-[11px] font-semibold uppercase tracking-[1.4px] text-white/55">TODAY’S LITTLE WIN</p>
          <p className="mt-2 text-[16px] font-bold text-white">3 notes explored</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[68%] rounded-full bg-lime" /></div>
          <p className="mt-2 text-right text-[10px] text-white/50">You’re on a roll!</p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-12 lg:hidden"><Brand /></div>
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[2px] text-green">{mode === 'register' ? 'YOUR JOURNEY STARTS HERE' : 'WELCOME BACK'}</p>
            <h2 className="font-display text-[34px] font-bold tracking-[-1.5px] text-ink">{mode === 'register' ? 'Create your account' : 'Good to see you again.'}</h2>
            <p className="mt-2 text-[14px] leading-6 text-muted">{mode === 'register' ? 'A fresh start is just a few details away.' : 'Pick up right where you left off.'}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && <label className="form-label">Your name<input autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Alex Morgan" /></label>}
            {mode === 'register' && <fieldset className="space-y-2"><legend className="form-label">I am registering as a</legend><div className="grid grid-cols-2 gap-3">{[['student', 'Student', 'Study notes and take quizzes'], ['teacher', 'Teacher', 'Upload quizzes and answer keys']].map(([role, title, description]) => <label key={role} className={`account-type-card ${form.role === role ? 'account-type-selected' : ''}`}><input className="sr-only" type="radio" name="accountType" value={role} checked={form.role === role} onChange={() => setForm({ ...form, role })} /><span className="text-[13px] font-bold text-ink">{title}</span><span className="mt-1 block text-[10px] leading-4 text-muted">{description}</span></label>)}</div></fieldset>}
            <label className="form-label">Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
            <label className="form-label">Password<input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 8 : undefined} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} /></label>
            {((mode === 'register' && form.role === 'teacher') || mode === 'login') && <label className="form-label">Teacher setup code {mode === 'login' && <span className="font-normal text-muted">(optional)</span>}<input type="password" autoComplete="off" required={mode === 'register' && form.role === 'teacher'} value={form.adminSetupToken} onChange={(event) => setForm({ ...form, adminSetupToken: event.target.value })} placeholder={mode === 'login' ? 'Only needed to activate teacher access' : 'Enter the code provided by your school'} /></label>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button disabled={busy} className="primary-button mt-2 w-full justify-center py-3.5">{busy ? 'One moment…' : mode === 'register' ? 'Create my account' : 'Sign in'}<ArrowRight className="h-4 w-4" /></button>
          </form>
          <p className="mt-7 text-center text-[13px] text-muted">
            {mode === 'register' ? 'Already have an account?' : 'New to Study Space?'}
            <button className="ml-1.5 font-bold text-green hover:underline" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError('') }}>
              {mode === 'register' ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="mt-12 flex items-center justify-center gap-2 text-[11px] text-muted/80"><LockKeyhole className="h-3.5 w-3.5" /> Your learning space is private and just for you.</p>
        </div>
      </section>
    </main>
  )
}

function EmptyState({ title, text, action, onAction }) {
  return (
    <div className="empty-state">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-pale text-green"><BookOpen className="h-5 w-5" /></span>
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{text}</p>
      {action && <button onClick={onAction} className="secondary-button mt-5">{action}<ArrowRight className="h-4 w-4" /></button>}
    </div>
  )
}

function SubjectCard({ subject, onClick }) {
  const tint = colors[subject.color] || colors.emerald
  const count = Number(subject.note_count ?? subject.noteCount ?? 0)
  const completed = Number(subject.completed_notes ?? subject.completedNotes ?? 0)
  const progress = count ? Math.round((completed / count) * 100) : 0
  return (
    <button onClick={onClick} className="subject-card group text-left">
      <div className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${tint.tile}`}><SubjectIcon subject={subject} /></div>
      <span className="absolute right-5 top-5 text-muted/50 transition group-hover:translate-x-1 group-hover:text-green"><ArrowRight className="h-4 w-4" /></span>
      <p className="mt-5 font-display text-[17px] font-bold tracking-[-.4px] text-ink">{subject.name}</p>
      <p className="mt-1 text-[12px] text-muted">{subject.category}</p>
      <p className="mt-5 text-[11px] text-muted">{count} study notes <span className="mx-1.5 text-border">·</span> {subject.quiz_count ?? subject.quizCount ?? 0} quiz</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#edf0ea]"><div className={`h-full rounded-full transition-all ${tint.bar}`} style={{ width: `${progress}%` }} /></div>
    </button>
  )
}

function NoteCard({ note, onClick }) {
  const tint = colors[note.subject_color ?? note.subjectColor] || colors.emerald
  const done = Boolean(note.completed)
  return (
    <article className="content-card group">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${tint.tile}`}><BookOpen className="h-[18px] w-[18px]" /></span>
        {done && <span className="flex items-center gap-1 rounded-full bg-green-pale px-2.5 py-1 text-[10px] font-bold text-green"><Check className="h-3 w-3" /> DONE</span>}
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[1.35px] text-green">{note.subject_name ?? note.subjectName}</p>
      <h3 className="mt-2 font-display text-[16px] font-bold leading-6 text-ink">{note.title}</h3>
      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-muted">{note.summary}</p>
      <div className="mt-5 flex items-center justify-between border-t border-[#edf0ea] pt-4">
        <span className="flex items-center gap-1.5 text-[11px] text-muted"><Clock3 className="h-3.5 w-3.5" /> {note.read_minutes ?? note.readMinutes} min read</span>
        <button onClick={onClick} className="flex items-center gap-1 text-[11px] font-bold text-green">Read <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></button>
      </div>
    </article>
  )
}

function QuizCard({ quiz, onStart }) {
  const tint = colors[quiz.subject_color ?? quiz.subjectColor] || colors.emerald
  const best = quiz.best_score ?? quiz.bestScore
  return (
    <article className="content-card quiz-card">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${tint.tile}`}><Target className="h-[18px] w-[18px]" /></span>
        {best !== null && best !== undefined && <span className="rounded-full bg-green-pale px-2.5 py-1 text-[10px] font-bold text-green">BEST {best}%</span>}
      </div>
      <p className="mt-5 text-[10px] font-bold uppercase tracking-[1.35px] text-green">{quiz.subject_name ?? quiz.subjectName}</p>
      <h3 className="mt-2 font-display text-[16px] font-bold leading-6 text-ink">{quiz.title}</h3>
      <p className="mt-2 min-h-10 text-[12px] leading-5 text-muted">{quiz.description}</p>
      <div className="mt-5 flex items-center gap-4 border-t border-[#edf0ea] pt-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> {quiz.question_count ?? quiz.questionCount} questions</span>
        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {quiz.duration_minutes ?? quiz.durationMinutes} min</span>
      </div>
      <button onClick={onStart} className="secondary-button mt-4 w-full justify-center">Take this quiz <ArrowRight className="h-4 w-4" /></button>
    </article>
  )
}

function NoteReader({ note, onClose, onComplete }) {
  if (!note) return null
  const paragraphs = note.content.split('\n\n')
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="note-modal" role="dialog" aria-modal="true" aria-labelledby="note-title">
        <div className="flex items-center justify-between border-b border-[#edf0ea] px-6 py-4 sm:px-9">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[1.2px] text-green"><BookOpen className="h-4 w-4" /> {note.subject_name}</div>
          <button aria-label="Close note" onClick={onClose} className="icon-button"><X className="h-4 w-4" /></button>
        </div>
        <div className="note-content">
          <p className="text-[11px] font-bold uppercase tracking-[1.5px] text-muted">{note.read_minutes} MIN READ</p>
          <h2 id="note-title" className="mt-3 font-display text-[30px] font-bold leading-tight tracking-[-1px] text-ink">{note.title}</h2>
          <p className="mt-3 text-[14px] leading-6 text-muted">{note.summary}</p>
          <div className="my-7 h-px bg-[#edf0ea]" />
          <div className="note-prose">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#f5f7f2] p-4 sm:px-5">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-ink"><CheckCircle2 className="h-4 w-4 text-green" /> A little progress adds up.</p>
            <button onClick={() => onComplete(note.id)} className="primary-button">{note.completed ? 'Already completed' : 'Mark as studied'}<Check className="h-4 w-4" /></button>
          </div>
        </div>
      </section>
    </div>
  )
}

function QuizPanel({ quiz, onBack, onSubmitted }) {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api(`/quizzes/${quiz.id}`).then(({ questions: items }) => {
      if (active) setQuestions(items)
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    })
    return () => { active = false }
  }, [quiz.id])

  async function submit() {
    if (Object.keys(answers).length !== questions.length) {
      setError('Choose an answer for every question before checking your work.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { result: submitted } = await api(`/quizzes/${quiz.id}/attempts`, { method: 'POST', body: JSON.stringify({ answers }) })
      setResult(submitted)
      onSubmitted()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="quiz-panel">
      <button onClick={onBack} className="back-link"><ArrowLeft className="h-4 w-4" /> Back to quizzes</button>
      <div className="mt-7 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[1.5px] text-green">{quiz.subject_name ?? quiz.subjectName}</p><h2 className="mt-2 font-display text-[29px] font-bold tracking-[-1px] text-ink">{result ? 'Nicely done!' : quiz.title}</h2><p className="mt-2 text-[13px] text-muted">{result ? 'Here’s how you did. Every attempt helps you learn.' : quiz.description}</p></div>
        <div className="rounded-xl bg-white px-4 py-2.5 text-[12px] font-semibold text-muted shadow-sm"><Clock3 className="mr-1.5 inline h-4 w-4 text-green" /> {quiz.duration_minutes ?? quiz.durationMinutes} min</div>
      </div>
      {error && <p className="form-error mt-5" role="alert">{error}</p>}
      {result && <div className="result-banner mt-7"><span className="result-score">{Math.round(result.score / result.totalQuestions * 100)}%</span><div><p className="font-display text-xl font-bold text-ink">{result.score} of {result.totalQuestions} correct</p><p className="mt-1 text-[12px] text-muted">{result.score === result.totalQuestions ? 'Perfect score — you’ve got this!' : 'Take another look at the explanations below.'}</p></div></div>}
      <div className="mt-7 space-y-4">
        {questions.map((question, index) => {
          const review = result?.review[index]
          const choices = ['A', 'B', 'C', 'D'].map((letter) => [letter, question[`choice_${letter.toLowerCase()}`]])
          return (
            <article key={question.id} className="question-card">
              <p className="text-[10px] font-bold uppercase tracking-[1.3px] text-muted">QUESTION {String(index + 1).padStart(2, '0')}</p>
              <h3 className="mt-2 font-display text-[16px] font-bold leading-6 text-ink">{question.prompt}</h3>
              <div className="mt-4 grid gap-2">
                {choices.map(([letter, label]) => {
                  const selected = result ? review.selected === letter : answers[question.id] === letter
                  const correct = result && review.correctAnswer === letter
                  return <button key={letter} disabled={Boolean(result)} onClick={() => setAnswers({ ...answers, [question.id]: letter })} className={`answer-option ${selected ? 'answer-selected' : ''} ${correct ? 'answer-correct' : ''} ${result && selected && !review.correct ? 'answer-wrong' : ''}`}><span className="answer-letter">{letter}</span><span className="text-left">{label}</span>{correct && <Check className="ml-auto h-4 w-4" />}</button>
                })}
              </div>
              {review && <p className={`mt-3 rounded-xl px-3.5 py-3 text-[12px] leading-5 ${review.correct ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{review.explanation}</p>}
            </article>
          )
        })}
      </div>
      {!result && <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="text-[12px] text-muted">{Object.keys(answers).length} of {questions.length} answered</p><button disabled={busy || !questions.length} onClick={submit} className="primary-button">{busy ? 'Checking…' : 'Check my answers'}<ArrowRight className="h-4 w-4" /></button></div>}
      {result && <button onClick={onBack} className="primary-button mt-6">Back to your quizzes<ArrowRight className="h-4 w-4" /></button>}
    </section>
  )
}

function QuizManager({ subjects, onUpdated }) {
  const [quizzes, setQuizzes] = useState([])
  const [quizForm, setQuizForm] = useState({ subjectId: '', title: '', description: '', durationMinutes: 10 })
  const [selectedQuizId, setSelectedQuizId] = useState('')
  const [file, setFile] = useState(null)
  const uploadInputRef = useRef(null)
  const [newQuizFile, setNewQuizFile] = useState(null)
  const newQuizUploadRef = useRef(null)
  const [documentFile, setDocumentFile] = useState(null)
  const documentUploadRef = useRef(null)
  const [documentQuestionCount, setDocumentQuestionCount] = useState(10)
  const [generatedDraft, setGeneratedDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadQuizzes() {
    const { quizzes: available } = await api('/admin/quizzes')
    setQuizzes(available)
    setSelectedQuizId((current) => available.some((quiz) => String(quiz.id) === current)
      ? current
      : String(available[0]?.id || ''))
  }

  useEffect(() => {
    loadQuizzes().catch((requestError) => setError(requestError.message))
  }, [])

  async function createAndPublishQuiz(event) {
    event.preventDefault()
    if (!newQuizFile) {
      setError('Choose a questions CSV file before publishing the quiz.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const questions = parseQuizCsv(await newQuizFile.text())
      const { quiz, imported } = await api('/admin/quizzes/import', {
        method: 'POST',
        body: JSON.stringify({ ...quizForm, questions }),
      })
      await loadQuizzes()
      setSelectedQuizId(String(quiz.id))
      setQuizForm({ subjectId: quizForm.subjectId, title: '', description: '', durationMinutes: 10 })
      setNewQuizFile(null)
      if (newQuizUploadRef.current) newQuizUploadRef.current.value = ''
      setMessage(`Published "${quiz.title}" with ${imported} questions. Students can take it and receive their marks automatically.`)
      await onUpdated()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function generateFromDocument() {
    if (!documentFile) {
      setError('Choose a PDF or Word (.docx) document first.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    setGeneratedDraft(null)
    try {
      const formData = new FormData()
      formData.append('document', documentFile)
      formData.append('subjectId', quizForm.subjectId)
      formData.append('title', quizForm.title)
      formData.append('description', quizForm.description)
      formData.append('durationMinutes', String(quizForm.durationMinutes))
      formData.append('questionCount', String(documentQuestionCount))
      const { questions } = await api('/admin/quizzes/generate', {
        method: 'POST',
        body: formData,
      })
      setGeneratedDraft({ quiz: { ...quizForm }, questions })
      setMessage(`Generated ${questions.length} questions from "${documentFile.name}". Review the questions and answer keys below before publishing.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function updateGeneratedQuestion(index, field, value) {
    setGeneratedDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => (
        questionIndex === index ? { ...question, [field]: value } : question
      )),
    }))
  }

  async function publishGeneratedQuiz() {
    if (!generatedDraft) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { quiz, imported } = await api('/admin/quizzes/import', {
        method: 'POST',
        body: JSON.stringify({ ...generatedDraft.quiz, questions: generatedDraft.questions }),
      })
      await loadQuizzes()
      setSelectedQuizId(String(quiz.id))
      setQuizForm({ subjectId: generatedDraft.quiz.subjectId, title: '', description: '', durationMinutes: 10 })
      setGeneratedDraft(null)
      setDocumentFile(null)
      if (documentUploadRef.current) documentUploadRef.current.value = ''
      setMessage(`Published "${quiz.title}" with ${imported} questions. Students can take it and receive their marks automatically.`)
      await onUpdated()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function createQuiz(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { quiz } = await api('/admin/quizzes', {
        method: 'POST',
        body: JSON.stringify(quizForm),
      })
      await loadQuizzes()
      setSelectedQuizId(String(quiz.id))
      setQuizForm({ subjectId: quizForm.subjectId, title: '', description: '', durationMinutes: 10 })
      setMessage(`Created “${quiz.title}”. Now choose its CSV file and import the questions and answer key.`)
      await onUpdated()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  async function importQuestions(event) {
    event.preventDefault()
    if (!file || !selectedQuizId) {
      setError('Choose a quiz and a CSV file first.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const questions = parseQuizCsv(await file.text())
      const currentQuiz = quizzes.find((quiz) => String(quiz.id) === selectedQuizId)
      const confirmation = currentQuiz?.question_count
        ? `This replaces all ${currentQuiz.question_count} existing questions in “${currentQuiz.title}”. Continue?`
        : `Import ${questions.length} questions into “${currentQuiz?.title}”?`
      if (!window.confirm(confirmation)) return
      const { imported } = await api(`/admin/quizzes/${selectedQuizId}/questions`, {
        method: 'PUT',
        body: JSON.stringify({ questions }),
      })
      setFile(null)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
      await loadQuizzes()
      await onUpdated()
      setMessage(`Imported ${imported} questions and answer keys. Students can now take this quiz and see their marks.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function downloadTemplate() {
    const template = [
      'question,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation (optional)',
      '"Which fraction equals 1/2?","2/3","3/8","4/8","5/8","C","4/8 simplifies to 1/2."',
      '"What is 3 + 4?","5","6","7","8","C","Adding 3 and 4 gives 7."',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'study-space-quiz-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeading eyebrow="TEACHER TOOLS" title="Manage quizzes" description="Create quizzes from a document or CSV, review the answer key, and publish them for students." />
      {error && <p className="form-error mt-5" role="alert">{error}</p>}
      {message && <p className="success-message mt-5" role="status">{message}</p>}
      <section className="section-block mt-6">
        <SectionTitle title="Create a quiz" subtitle="Upload a CSV or generate questions from a PDF or Word document. Review generated answers before publishing." />
        <form onSubmit={createAndPublishQuiz} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="form-label">Subject<select required value={quizForm.subjectId} onChange={(event) => setQuizForm({ ...quizForm, subjectId: event.target.value })}><option value="">Choose a subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className="form-label">Quiz title<input required maxLength={180} value={quizForm.title} onChange={(event) => setQuizForm({ ...quizForm, title: event.target.value })} placeholder="e.g. Fractions practice" /></label>
          <label className="form-label sm:col-span-2">Description<input required maxLength={500} value={quizForm.description} onChange={(event) => setQuizForm({ ...quizForm, description: event.target.value })} placeholder="What will students practise?" /></label>
          <label className="form-label">Time allowed (minutes)<input required type="number" min="1" max="255" value={quizForm.durationMinutes} onChange={(event) => setQuizForm({ ...quizForm, durationMinutes: Number(event.target.value) })} /></label>
          <div className="rounded-xl bg-[#f5f7f2] p-4 text-[11px] leading-5 text-muted">CSV columns: question, four choices, and correct_answer (A-D). Or generate questions from a text-based PDF or .docx Word document. Scanned PDFs need OCR first.</div>
          <label className="upload-box sm:col-span-2"><FileUp className="h-5 w-5 text-green" /><span className="text-[12px] font-bold text-ink">{newQuizFile?.name || 'Choose a questions CSV file'}</span><span className="text-[10px] text-muted">CSV format - up to 100 questions</span><input ref={newQuizUploadRef} type="file" accept=".csv,text/csv" onChange={(event) => { setNewQuizFile(event.target.files?.[0] || null); setError(''); setMessage('') }} /></label>
          <button type="button" onClick={downloadTemplate} className="text-left text-[11px] font-bold text-green hover:underline">Download CSV template</button>
          <button disabled={busy || !subjects.length || !newQuizFile} className="primary-button sm:col-span-2"><Plus className="h-4 w-4" />{busy ? 'Publishing...' : 'Create quiz and publish'}</button>
          <div className="sm:col-span-2 border-t border-[#edf0ea] pt-5">
            <h3 className="font-display text-[15px] font-bold text-ink">Or generate questions from a document</h3>
            <p className="mt-1 text-[11px] leading-5 text-muted">The document is sent to the configured AI service to create draft questions. You can edit every question and answer before publishing.</p>
          </div>
          <label className="upload-box sm:col-span-2"><FileUp className="h-5 w-5 text-green" /><span className="text-[12px] font-bold text-ink">{documentFile?.name || 'Choose a PDF or Word document'}</span><span className="text-[10px] text-muted">PDF or .docx · up to 10 MB · text-based PDF only</span><input ref={documentUploadRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => { setDocumentFile(event.target.files?.[0] || null); setGeneratedDraft(null); setError(''); setMessage('') }} /></label>
          <label className="form-label">Number of questions<select value={documentQuestionCount} onChange={(event) => setDocumentQuestionCount(Number(event.target.value))}>{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} questions</option>)}</select></label>
          <button type="button" disabled={busy || !subjects.length || !documentFile} onClick={generateFromDocument} className="secondary-button justify-center sm:justify-self-start"><Sparkles className="h-4 w-4" />{busy ? 'Generating...' : 'Generate questions'}</button>
        </form>
        {generatedDraft && <section className="mt-6 border-t border-[#edf0ea] pt-6">
          <SectionTitle title={`Review ${generatedDraft.questions.length} generated questions`} subtitle="Edit any wording, choices, or correct answers. Nothing is published until you confirm." />
          <div className="mt-4 space-y-4">
            {generatedDraft.questions.map((question, index) => (
              <article key={`generated-${index}`} className="rounded-xl border border-[#e6ebe3] bg-[#fbfcfa] p-4">
                <label className="form-label">Question {index + 1}<textarea rows="2" maxLength="500" value={question.prompt} onChange={(event) => updateGeneratedQuestion(index, 'prompt', event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-[#e2e9e1] bg-white px-3 py-2 text-[12px] text-ink outline-none focus:border-[#6e9a79]" /></label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const field = `choice${letter}`
                    return <label key={letter} className="form-label">Choice {letter}<input maxLength="255" value={question[field]} onChange={(event) => updateGeneratedQuestion(index, field, event.target.value)} /></label>
                  })}
                  <label className="form-label">Correct answer<select value={question.correctAnswer} onChange={(event) => updateGeneratedQuestion(index, 'correctAnswer', event.target.value)}>{['A', 'B', 'C', 'D'].map((letter) => <option key={letter} value={letter}>{letter}</option>)}</select></label>
                  <label className="form-label sm:col-span-2">Explanation<textarea rows="2" maxLength="500" value={question.explanation || ''} onChange={(event) => updateGeneratedQuestion(index, 'explanation', event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-[#e2e9e1] bg-white px-3 py-2 text-[12px] text-ink outline-none focus:border-[#6e9a79]" /></label>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={busy} onClick={publishGeneratedQuiz} className="primary-button"><Check className="h-4 w-4" />{busy ? 'Publishing...' : 'Review complete — publish quiz'}</button>
            <button type="button" disabled={busy} onClick={() => setGeneratedDraft(null)} className="secondary-button">Discard generated questions</button>
          </div>
        </section>}
      </section>
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-2">
        <section className="section-block">
          <SectionTitle title="1. Create a quiz" subtitle="Choose the subject students will find it under." />
          <form onSubmit={createQuiz} className="mt-5 space-y-4">
            <label className="form-label">Subject<select required value={quizForm.subjectId} onChange={(event) => setQuizForm({ ...quizForm, subjectId: event.target.value })}><option value="">Choose a subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
            <label className="form-label">Quiz title<input required maxLength={180} value={quizForm.title} onChange={(event) => setQuizForm({ ...quizForm, title: event.target.value })} placeholder="e.g. Fractions practice" /></label>
            <label className="form-label">Description<input required maxLength={500} value={quizForm.description} onChange={(event) => setQuizForm({ ...quizForm, description: event.target.value })} placeholder="What will students practise?" /></label>
            <label className="form-label">Time allowed (minutes)<input required type="number" min="1" max="255" value={quizForm.durationMinutes} onChange={(event) => setQuizForm({ ...quizForm, durationMinutes: Number(event.target.value) })} /></label>
            <button disabled={busy || !subjects.length} className="primary-button"><Plus className="h-4 w-4" />{busy ? 'Saving…' : 'Create quiz'}</button>
          </form>
        </section>

        <section className="section-block">
          <SectionTitle title="2. Upload questions & answers" subtitle="Use a CSV exported from Excel, Google Sheets, or another spreadsheet." />
          <div className="mt-4 rounded-xl bg-[#f5f7f2] p-4 text-[12px] leading-5 text-muted">
            Each row needs a question, four choices, the correct letter (A–D), and an explanation. Uploading replaces the selected quiz’s existing questions.
            <button type="button" onClick={downloadTemplate} className="mt-3 flex items-center gap-2 font-bold text-green hover:underline"><Download className="h-4 w-4" /> Download CSV template</button>
          </div>
          <form onSubmit={importQuestions} className="mt-5 space-y-4">
            <label className="form-label">Quiz<select required value={selectedQuizId} onChange={(event) => setSelectedQuizId(event.target.value)}><option value="">Choose a quiz</option>{quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.subject_name} — {quiz.title} ({quiz.question_count} questions)</option>)}</select></label>
            <label className="upload-box"><FileUp className="h-5 w-5 text-green" /><span className="text-[12px] font-bold text-ink">{file?.name || 'Choose a questions CSV file'}</span><span className="text-[10px] text-muted">CSV format · up to 100 questions</span><input ref={uploadInputRef} type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setError(''); setMessage('') }} /></label>
            <button disabled={busy || !selectedQuizId || !file} className="primary-button"><FileUp className="h-4 w-4" />{busy ? 'Importing…' : 'Upload questions & answer key'}</button>
          </form>
        </section>
      </div>
      <section className="section-block mt-5">
        <SectionTitle title="Your quizzes" subtitle="Draft quizzes stay hidden from students until questions are uploaded." />
        {quizzes.length ? <div className="mt-4 divide-y divide-[#edf0ea]">{quizzes.map((quiz) => <div key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-[13px] font-bold text-ink">{quiz.title}</p><p className="mt-1 text-[11px] text-muted">{quiz.subject_name} · {quiz.question_count} questions</p></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${quiz.question_count ? 'bg-green-pale text-green' : 'bg-amber-50 text-amber-700'}`}>{quiz.question_count ? 'PUBLISHED' : 'DRAFT'}</span></div>)}</div> : <p className="mt-4 text-[12px] text-muted">Create a quiz to get started.</p>}
      </section>
    </div>
  )
}

function ProgressPage({ progress, subjects }) {
  const stats = progress?.stats || {}
  const average = Number(stats.average_score) || 0
  return (
    <div>
      <PageHeading eyebrow="LOOK HOW FAR YOU’VE COME" title="Your progress" description="Every note and every try is another step forward." />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Notes studied" value={stats.completed_notes ?? 0} detail="Keep that curiosity going" tint="green" />
        <StatCard icon={Clock3} label="Study minutes" value={stats.minutes_studied ?? 0} detail="Time spent learning" tint="violet" />
        <StatCard icon={Target} label="Quizzes taken" value={stats.quizzes_taken ?? 0} detail="Practice makes progress" tint="amber" />
        <StatCard icon={Award} label="Average score" value={`${average}%`} detail="Across all your attempts" tint="sky" />
      </div>
      <section className="section-block mt-7">
        <SectionTitle title="Your subjects" subtitle="A little at a time goes a long way." />
        <div className="mt-5 space-y-5">
          {subjects.map((subject) => {
            const total = Number(subject.note_count) || 0
            const done = Number(subject.completed_notes) || 0
            const pct = total ? Math.round(done / total * 100) : 0
            const tint = colors[subject.color] || colors.emerald
            return <div key={subject.id}><div className="mb-2 flex items-center justify-between gap-4"><span className="flex items-center gap-2.5 text-[13px] font-bold text-ink"><span className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${tint.tile}`}><SubjectIcon subject={subject} className="h-4 w-4" /></span>{subject.name}</span><span className="text-[11px] text-muted">{done} of {total} notes <b className="ml-2 text-ink">{pct}%</b></span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf0ea]"><div className={`h-full rounded-full ${tint.bar}`} style={{ width: `${pct}%` }} /></div></div>
          })}
        </div>
      </section>
      <section className="section-block mt-5">
        <SectionTitle title="Recent quiz attempts" subtitle="Your practice is paying off." />
        {progress?.recentAttempts?.length ? <div className="mt-4 divide-y divide-[#edf0ea]">{progress.recentAttempts.map((attempt) => <div key={attempt.id} className="flex items-center justify-between gap-4 py-4"><div><p className="text-[13px] font-bold text-ink">{attempt.quiz_title}</p><p className="mt-1 text-[11px] text-muted">{attempt.subject_name} · {formatDate(attempt.completed_at)}</p></div><span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${attempt.percentage >= 70 ? 'bg-green-pale text-green' : 'bg-amber-50 text-amber-700'}`}>{attempt.score}/{attempt.total_questions} · {attempt.percentage}%</span></div>)}</div> : <p className="py-7 text-center text-[13px] text-muted">Your quiz attempts will appear here after your first quiz.</p>}
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, detail, tint = 'green' }) {
  const palette = { green: 'bg-green-pale text-green', violet: 'bg-violet-100 text-violet-700', amber: 'bg-amber-100 text-amber-700', sky: 'bg-sky-100 text-sky-700' }[tint]
  return <article className="stat-card"><span className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${palette}`}><Icon className="h-[18px] w-[18px]" /></span><p className="mt-5 text-[11px] font-semibold text-muted">{label}</p><p className="mt-1 font-display text-[27px] font-bold tracking-[-1px] text-ink">{value}</p><p className="mt-1 text-[10px] text-muted">{detail}</p></article>
}

function SectionTitle({ title, subtitle, action, onAction }) {
  return <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-[18px] font-bold tracking-[-.5px] text-ink">{title}</h2>{subtitle && <p className="mt-1 text-[11px] text-muted">{subtitle}</p>}</div>{action && <button onClick={onAction} className="text-[11px] font-bold text-green hover:underline">{action}<ChevronRight className="ml-1 inline h-3.5 w-3.5" /></button>}</div>
}

function PageHeading({ eyebrow, title, description }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-[1.5px] text-green">{eyebrow}</p><h1 className="mt-2 font-display text-[30px] font-bold tracking-[-1.1px] text-ink">{title}</h1><p className="mt-1 text-[13px] leading-6 text-muted">{description}</p></div>
}

function TeacherOverview({ userName, subjects, openPage }) {
  const [quizzes, setQuizzes] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    api('/admin/quizzes').then(({ quizzes: available }) => setQuizzes(available)).catch((requestError) => setError(requestError.message))
  }, [])
  const published = quizzes.filter((quiz) => Number(quiz.question_count) > 0).length
  const drafts = quizzes.length - published
  return (
    <div>
      <PageHeading eyebrow="TEACHER WORKSPACE" title={`Welcome, ${userName}`} description="Create quizzes, add answer keys, and help students practise with instantly marked results." />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={GraduationCap} label="Available subjects" value={subjects.length} detail="Organize learning by subject" tint="green" />
        <StatCard icon={CheckCircle2} label="Published quizzes" value={published} detail="Live for students to take" tint="sky" />
        <StatCard icon={FileUp} label="Draft quizzes" value={drafts} detail="Upload questions to publish" tint="amber" />
      </div>
      <section className="section-block mt-6">
        <SectionTitle title="Your teacher tools" subtitle="Upload questions and answer keys in one step. Student scores are calculated automatically." />
        <button onClick={() => openPage('manage-quizzes')} className="primary-button mt-5"><FileUp className="h-4 w-4" />Create or manage quizzes</button>
      </section>
      <section className="section-block mt-5">
        <SectionTitle title="Quiz publishing" subtitle="A quiz appears in the student dashboard as soon as its questions and answer key are saved." />
        {error && <p className="form-error mt-4" role="alert">{error}</p>}
        {quizzes.length ? <div className="mt-4 divide-y divide-[#edf0ea]">{quizzes.slice(0, 5).map((quiz) => <div key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-[13px] font-bold text-ink">{quiz.title}</p><p className="mt-1 text-[11px] text-muted">{quiz.subject_name} - {quiz.question_count} questions</p></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${Number(quiz.question_count) ? 'bg-green-pale text-green' : 'bg-amber-50 text-amber-700'}`}>{Number(quiz.question_count) ? 'PUBLISHED' : 'DRAFT'}</span></div>)}</div> : <p className="mt-4 text-[12px] text-muted">Create your first quiz and upload its answer key to get started.</p>}
      </section>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(Boolean(localStorage.getItem(TOKEN_KEY)))
  const [page, setPage] = useState('overview')
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [notes, setNotes] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [progress, setProgress] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function refreshData() {
    setLoading(true)
    setError('')
    try {
      const [subjectData, noteData, quizData, progressData] = await Promise.all([
        api('/subjects'), api('/notes'), api('/quizzes'), api('/progress'),
      ])
      setSubjects(subjectData.subjects)
      setNotes(noteData.notes)
      setQuizzes(quizData.quizzes)
      setProgress(progressData)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    api('/auth/me').then(({ user: signedIn }) => setUser(signedIn)).catch(() => {
      localStorage.removeItem(TOKEN_KEY)
    }).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (user) refreshData()
  }, [user])

  const filteredNotes = useMemo(() => notes.filter((note) => {
    const matchesSubject = subjectFilter === 'all' || String(note.subject_id) === String(subjectFilter)
    const query = search.trim().toLowerCase()
    return matchesSubject && (!query || `${note.title} ${note.summary} ${note.subject_name}`.toLowerCase().includes(query))
  }), [notes, search, subjectFilter])

  const filteredQuizzes = useMemo(() => quizzes.filter((quiz) => {
    const matchesSubject = subjectFilter === 'all' || String(quiz.subject_id) === String(subjectFilter)
    const query = search.trim().toLowerCase()
    return matchesSubject && (!query || `${quiz.title} ${quiz.description} ${quiz.subject_name}`.toLowerCase().includes(query))
  }), [quizzes, search, subjectFilter])

  const displayName = user?.name?.trim().split(/\s+/)[0] || 'Learner'

  function openPage(nextPage) {
    setPage(nextPage)
    setSearch('')
    setSubjectFilter('all')
    setMobileMenu(false)
    setActiveQuiz(null)
  }

  async function openNote(id) {
    setError('')
    try {
      const { note } = await api(`/notes/${id}`)
      setSelectedNote(note)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function completeNote(id) {
    try {
      await api(`/notes/${id}/complete`, { method: 'POST', body: '{}' })
      setSelectedNote((note) => ({ ...note, completed: true }))
      await refreshData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function chooseSubject(subject) {
    setSubjectFilter(String(subject.id))
    setPage('notes')
    setSearch('')
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    setSubjects([])
    setNotes([])
    setQuizzes([])
    setProgress(null)
    setPage('overview')
    setSelectedNote(null)
    setActiveQuiz(null)
    setMobileMenu(false)
    setError('')
  }

  if (checking) return <div className="checking-screen"><div className="loading-mark"><BookOpen className="h-6 w-6" /></div><p className="mt-4 text-[13px] text-muted">Opening your study space…</p></div>
  if (!user) return <AuthPage onSignedIn={setUser} />

  const selectedSubject = subjects.find((subject) => String(subject.id) === subjectFilter)
  const pageTitle = user.role === 'admin'
    ? { overview: 'Teacher dashboard', subjects: 'Subjects', notes: 'Study notes', quizzes: 'Student quizzes', 'manage-quizzes': 'Manage quizzes' }[page]
    : { overview: 'A fresh day to learn', subjects: 'Your subjects', notes: 'Study notes', quizzes: 'Quick quizzes', progress: 'Your progress' }[page]
  const visibleNavigation = user.role === 'admin' ? teacherNavigation : navigation

  return (
    <div className="app-layout">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand light /><button aria-label="Close menu" onClick={() => setMobileMenu(false)} className="mobile-close"><X className="h-5 w-5" /></button></div>
        <div className="sidebar-caption">{user.role === 'admin' ? 'TEACHER WORKSPACE' : 'YOUR STUDY SPACE'}</div>
        <nav className="sidebar-nav">
          {visibleNavigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => openPage(id)} className={`nav-item ${page === id ? 'nav-active' : ''}`}><Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />{label}{id === 'quizzes' && <span className="nav-count">{quizzes.length}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-nudge"><span className="nudge-spark"><Sparkles className="h-4 w-4" /></span><p className="mt-3 text-[12px] font-bold text-white">Small steps count.</p><p className="mt-1 text-[10px] leading-4 text-white/55">A few minutes of learning today can take you far.</p><button onClick={() => openPage('notes')} className="mt-3 text-[10px] font-bold text-lime">Let’s go <ArrowRight className="ml-1 inline h-3 w-3" /></button></div>
          <div className="profile-row"><span className="profile-avatar">{initials(user.name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-white">{user.name}</span><span className="mt-0.5 block truncate text-[10px] text-white/50">{user.role === 'admin' ? 'Teacher' : 'Student'}</span></span><button aria-label="Sign out" title="Sign out" onClick={signOut} className="signout-button"><LogOut className="h-4 w-4" /><span>Sign out</span></button></div>
        </div>
      </aside>

      {mobileMenu && <button aria-label="Close navigation" className="sidebar-overlay" onClick={() => setMobileMenu(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button aria-label="Open menu" onClick={() => setMobileMenu(true)} className="menu-button"><Menu className="h-5 w-5" /></button>
          <div className="topbar-crumb"><span>{user.role === 'admin' ? 'Teacher tools' : 'My learning'}</span><ChevronRight className="h-3 w-3" /><strong>{pageTitle}</strong></div>
          <div className="topbar-right"><span className="today-label">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span><span className="top-avatar">{initials(user.name)}</span></div>
        </header>

        <main className="content-wrap">
          {error && <div className="notice-error" role="alert"><span>{error}</span><button aria-label="Dismiss" onClick={() => setError('')}><X className="h-4 w-4" /></button></div>}
          {loading && <div className="loading-line"><span />Getting your study space ready…</div>}

          {activeQuiz ? <QuizPanel quiz={activeQuiz} onBack={() => setActiveQuiz(null)} onSubmitted={refreshData} /> : (
            <>
              {page === 'overview' && (user.role === 'admin' ? <TeacherOverview userName={displayName} subjects={subjects} openPage={openPage} /> : <Overview userName={displayName} subjects={subjects} notes={notes} quizzes={quizzes} progress={progress} openPage={openPage} openNote={openNote} chooseSubject={chooseSubject} setActiveQuiz={setActiveQuiz} />)}
              {page === 'subjects' && <div><PageHeading eyebrow="YOUR LEARNING LIBRARY" title="Your subjects" description="Pick a subject and follow your curiosity." /><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} onClick={() => chooseSubject(subject)} />)}</div></div>}
              {page === 'notes' && <div><PageHeading eyebrow="READ, REVISIT, REMEMBER" title={selectedSubject ? `${selectedSubject.name} notes` : 'Study notes'} description={selectedSubject?.description || 'Friendly explainers to help new ideas stick.'} /><div className="library-toolbar"><div className="search-box"><Search className="h-4 w-4" /><input aria-label="Search notes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a note…" /></div><select aria-label="Filter by subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>{filteredNotes.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredNotes.map((note) => <NoteCard key={note.id} note={note} onClick={() => openNote(note.id)} />)}</div> : <EmptyState title="No notes found" text="Try a different search or choose another subject." action="Show all subjects" onAction={() => { setSearch(''); setSubjectFilter('all') }} />}</div>}
              {page === 'quizzes' && <div><PageHeading eyebrow="A LITTLE PRACTICE GOES A LONG WAY" title={selectedSubject ? `${selectedSubject.name} quizzes` : 'Quick quizzes'} description="Try a few questions and see what you already know." /><div className="library-toolbar"><div className="search-box"><Search className="h-4 w-4" /><input aria-label="Search quizzes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a quiz…" /></div><select aria-label="Filter by subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>{filteredQuizzes.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredQuizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} onStart={() => setActiveQuiz(quiz)} />)}</div> : <EmptyState title="No quizzes found" text="Try a different search or choose another subject." action="Show all subjects" onAction={() => { setSearch(''); setSubjectFilter('all') }} />}</div>}
              {page === 'progress' && <ProgressPage progress={progress} subjects={subjects} />}
              {page === 'manage-quizzes' && user.role === 'admin' && <QuizManager subjects={subjects} onUpdated={refreshData} />}
            </>
          )}
          <footer className="page-footer"><span>Made for curious minds.</span><span>Keep showing up <span className="text-green">♥</span></span></footer>
        </main>
      </div>
      <NoteReader note={selectedNote} onClose={() => setSelectedNote(null)} onComplete={completeNote} />
    </div>
  )
}

function Overview({ userName, subjects, notes, quizzes, progress, openPage, openNote, chooseSubject, setActiveQuiz }) {
  const stats = progress?.stats || {}
  const incompleteNote = notes.find((note) => !note.completed) || notes[0]
  const featuredQuiz = quizzes.find((quiz) => quiz.best_score === null || quiz.best_score === undefined) || quizzes[0]
  return (
    <div>
      <div className="welcome-row"><div><p className="text-[10px] font-bold uppercase tracking-[1.5px] text-green">{greeting()}, {userName.toUpperCase()}</p><h1 className="mt-2 font-display text-[30px] font-bold tracking-[-1.2px] text-ink">A fresh day to learn<span className="text-green">.</span></h1><p className="mt-1.5 text-[13px] text-muted">Pick one small thing. You’ve got this.</p></div><div className="focus-pill"><span className="focus-pulse" />YOUR PACE, YOUR SPACE</div></div>
      <section className="hero-card mt-7">
        <div className="hero-copy"><div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[1.3px] text-[#c1dfbb]"><Sparkles className="h-3 w-3" /> YOUR NEXT LITTLE WIN</div><h2 className="mt-4 max-w-[390px] font-display text-[25px] font-bold leading-[1.2] tracking-[-.7px] text-white">Curiosity looks good on you.</h2><p className="mt-2 max-w-[400px] text-[12px] leading-5 text-white/65">A few focused minutes can turn “not sure” into “I’ve got this.” Start wherever feels right.</p><button onClick={() => incompleteNote && openNote(incompleteNote.id)} className="hero-button mt-5">{incompleteNote ? 'Pick up a note' : 'Explore your notes'}<ArrowRight className="h-4 w-4" /></button></div>
        <div className="hero-art"><div className="art-orbit art-orbit-a" /><div className="art-orbit art-orbit-b" /><div className="art-sun"><BookOpen className="h-8 w-8" /></div><div className="art-spark art-spark-a">✦</div><div className="art-spark art-spark-b">✦</div><div className="art-note">one page<br />at a time</div></div>
        <div className="hero-bottom"><span>YOUR LEARNING JOURNEY</span><span><b>{stats.completed_notes ?? 0}</b> notes explored <span className="mx-2 text-white/30">·</span> <b>{stats.quizzes_taken ?? 0}</b> quizzes tried</span></div>
      </section>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Notes studied" value={stats.completed_notes ?? 0} detail="Little wins add up" tint="green" />
        <StatCard icon={Clock3} label="Minutes learning" value={stats.minutes_studied ?? 0} detail="Time well spent" tint="violet" />
        <StatCard icon={Target} label="Quizzes tried" value={stats.quizzes_taken ?? 0} detail="Keep practising" tint="amber" />
      </div>

      <section className="mt-8">
        <SectionTitle title="Find your next subject" subtitle="Five places to start exploring." action="All subjects" onAction={() => openPage('subjects')} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} onClick={() => chooseSubject(subject)} />)}</div>
      </section>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.3fr_.9fr]">
        <section><SectionTitle title="A note to get you going" subtitle="A small idea worth exploring today." action="Browse notes" onAction={() => openPage('notes')} />{incompleteNote ? <button onClick={() => openNote(incompleteNote.id)} className="featured-note mt-4 text-left"><span className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${colors[incompleteNote.subject_color]?.tile || colors.emerald.tile}`}><BookOpen className="h-[18px] w-[18px]" /></span><span className="mt-4 block text-[10px] font-bold uppercase tracking-[1.2px] text-green">{incompleteNote.subject_name}</span><span className="mt-2 block font-display text-[16px] font-bold text-ink">{incompleteNote.title}</span><span className="mt-1 block line-clamp-2 text-[12px] leading-5 text-muted">{incompleteNote.summary}</span><span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-green">Read this note <ArrowRight className="h-3.5 w-3.5" /></span><span className="featured-corner"><ArrowDownRight className="h-5 w-5" /></span></button> : <EmptyState title="You’re all caught up!" text="Choose another subject and find something new to explore." action="Browse notes" onAction={() => openPage('notes')} />}</section>
        <section><SectionTitle title="A quick confidence check" subtitle="No pressure, just practice." action="All quizzes" onAction={() => openPage('quizzes')} />{featuredQuiz ? <article className="featured-quiz mt-4"><div className="flex items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${colors[featuredQuiz.subject_color]?.tile || colors.emerald.tile}`}><Target className="h-[18px] w-[18px]" /></span><span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-muted">{featuredQuiz.question_count} QUICK Qs</span></div><p className="mt-5 text-[10px] font-bold uppercase tracking-[1.25px] text-green">{featuredQuiz.subject_name}</p><h3 className="mt-2 font-display text-[16px] font-bold text-ink">{featuredQuiz.title}</h3><p className="mt-1 text-[12px] leading-5 text-muted">{featuredQuiz.description}</p><button onClick={() => setActiveQuiz(featuredQuiz)} className="secondary-button mt-4">Give it a go <Play className="h-3.5 w-3.5 fill-current" /></button></article> : <EmptyState title="Quizzes are on their way" text="Check back soon for a few questions to try." />}</section>
      </div>
      <div className="mt-8 rounded-[20px] border border-[#e5ebe1] bg-white px-5 py-5 sm:flex sm:items-center sm:justify-between sm:px-7"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-amber-50 text-amber-700"><Microscope className="h-5 w-5" /></span><div><p className="text-[13px] font-bold text-ink">Curiosity is a superpower.</p><p className="mt-1 text-[11px] text-muted">Pick something that makes you wonder today.</p></div></div><button onClick={() => openPage('progress')} className="mt-3 text-[11px] font-bold text-green hover:underline sm:mt-0">See your progress <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button></div>
    </div>
  )
}

export default App
