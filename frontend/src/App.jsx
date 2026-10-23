import { useEffect, useMemo, useState } from 'react'
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

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.')
  return payload
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
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
            <label className="form-label">Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
            <label className="form-label">Password<input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 8 : undefined} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} /></label>
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
    setError('')
  }

  if (checking) return <div className="checking-screen"><div className="loading-mark"><BookOpen className="h-6 w-6" /></div><p className="mt-4 text-[13px] text-muted">Opening your study space…</p></div>
  if (!user) return <AuthPage onSignedIn={setUser} />

  const selectedSubject = subjects.find((subject) => String(subject.id) === subjectFilter)
  const pageTitle = { overview: 'A fresh day to learn', subjects: 'Your subjects', notes: 'Study notes', quizzes: 'Quick quizzes', progress: 'Your progress' }[page]

  return (
    <div className="app-layout">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand"><Brand light /><button aria-label="Close menu" onClick={() => setMobileMenu(false)} className="mobile-close"><X className="h-5 w-5" /></button></div>
        <div className="sidebar-caption">YOUR STUDY SPACE</div>
        <nav className="sidebar-nav">
          {navigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => openPage(id)} className={`nav-item ${page === id ? 'nav-active' : ''}`}><Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />{label}{id === 'quizzes' && <span className="nav-count">{quizzes.length}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-nudge"><span className="nudge-spark"><Sparkles className="h-4 w-4" /></span><p className="mt-3 text-[12px] font-bold text-white">Small steps count.</p><p className="mt-1 text-[10px] leading-4 text-white/55">A few minutes of learning today can take you far.</p><button onClick={() => openPage('notes')} className="mt-3 text-[10px] font-bold text-lime">Let’s go <ArrowRight className="ml-1 inline h-3 w-3" /></button></div>
          <div className="profile-row"><span className="profile-avatar">{initials(user.name)}</span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold text-white">{user.name}</span><span className="mt-0.5 block truncate text-[10px] text-white/50">Student</span></span><button aria-label="Sign out" title="Sign out" onClick={signOut} className="signout-button"><LogOut className="h-4 w-4" /></button></div>
        </div>
      </aside>

      {mobileMenu && <button aria-label="Close navigation" className="sidebar-overlay" onClick={() => setMobileMenu(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button aria-label="Open menu" onClick={() => setMobileMenu(true)} className="menu-button"><Menu className="h-5 w-5" /></button>
          <div className="topbar-crumb"><span>My learning</span><ChevronRight className="h-3 w-3" /><strong>{pageTitle}</strong></div>
          <div className="topbar-right"><span className="today-label">{new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span><span className="top-avatar">{initials(user.name)}</span></div>
        </header>

        <main className="content-wrap">
          {error && <div className="notice-error" role="alert"><span>{error}</span><button aria-label="Dismiss" onClick={() => setError('')}><X className="h-4 w-4" /></button></div>}
          {loading && <div className="loading-line"><span />Getting your study space ready…</div>}

          {activeQuiz ? <QuizPanel quiz={activeQuiz} onBack={() => setActiveQuiz(null)} onSubmitted={refreshData} /> : (
            <>
              {page === 'overview' && <Overview userName={displayName} subjects={subjects} notes={notes} quizzes={quizzes} progress={progress} openPage={openPage} openNote={openNote} chooseSubject={chooseSubject} setActiveQuiz={setActiveQuiz} />}
              {page === 'subjects' && <div><PageHeading eyebrow="YOUR LEARNING LIBRARY" title="Your subjects" description="Pick a subject and follow your curiosity." /><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} onClick={() => chooseSubject(subject)} />)}</div></div>}
              {page === 'notes' && <div><PageHeading eyebrow="READ, REVISIT, REMEMBER" title={selectedSubject ? `${selectedSubject.name} notes` : 'Study notes'} description={selectedSubject?.description || 'Friendly explainers to help new ideas stick.'} /><div className="library-toolbar"><div className="search-box"><Search className="h-4 w-4" /><input aria-label="Search notes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a note…" /></div><select aria-label="Filter by subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>{filteredNotes.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredNotes.map((note) => <NoteCard key={note.id} note={note} onClick={() => openNote(note.id)} />)}</div> : <EmptyState title="No notes found" text="Try a different search or choose another subject." action="Show all subjects" onAction={() => { setSearch(''); setSubjectFilter('all') }} />}</div>}
              {page === 'quizzes' && <div><PageHeading eyebrow="A LITTLE PRACTICE GOES A LONG WAY" title={selectedSubject ? `${selectedSubject.name} quizzes` : 'Quick quizzes'} description="Try a few questions and see what you already know." /><div className="library-toolbar"><div className="search-box"><Search className="h-4 w-4" /><input aria-label="Search quizzes" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a quiz…" /></div><select aria-label="Filter by subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></div>{filteredQuizzes.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredQuizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} onStart={() => setActiveQuiz(quiz)} />)}</div> : <EmptyState title="No quizzes found" text="Try a different search or choose another subject." action="Show all subjects" onAction={() => { setSearch(''); setSubjectFilter('all') }} />}</div>}
              {page === 'progress' && <ProgressPage progress={progress} subjects={subjects} />}
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
