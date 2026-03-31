import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { feedbackAPI } from '../services/api'
import { StatusBadge, SeverityBadge, TypeBadge, Tag, Spinner } from '../components/ui'
import {
  Search, Zap, ArrowLeft, AlertCircle, CheckCircle2,
  Clock, RefreshCw, ChevronRight, Inbox
} from 'lucide-react'
import clsx from 'clsx'
import logo from '../assets/logo.png'

// ── Timeline step component ──────────────────────────────
const ALL_STATUSES = ['New', 'Under Review', 'Accepted', 'Implemented']

const STATUS_META = {
  'New':          { color: 'bg-blue-500',    text: 'text-blue-400',    border: 'border-blue-500/40',    desc: 'Your feedback has been received and is in the queue.' },
  'Under Review': { color: 'bg-amber-500',   text: 'text-amber-400',   border: 'border-amber-500/40',   desc: 'A team member is actively reviewing your submission.' },
  'Accepted':     { color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', desc: 'Your feedback has been accepted and is planned for action.' },
  'Rejected':     { color: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/40',     desc: 'This feedback was reviewed but will not be actioned at this time.' },
  'Implemented':  { color: 'bg-purple-500',  text: 'text-purple-400',  border: 'border-purple-500/40',  desc: 'This has been built and shipped. Thank you for your contribution!' },
}

function StatusTimeline({ currentStatus }) {
  // Rejected gets its own special treatment
  if (currentStatus === 'Rejected') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <p className="text-red-400 font-display font-semibold text-sm">Not Accepted</p>
          <p className="text-red-400/70 text-xs mt-0.5">{STATUS_META['Rejected'].desc}</p>
        </div>
      </div>
    )
  }

  const steps = ALL_STATUSES
  const currentIdx = steps.indexOf(currentStatus)

  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => {
        const isDone    = i < currentIdx
        const isCurrent = i === currentIdx
        const isPending = i > currentIdx
        const meta      = STATUS_META[step]
        const isLast    = i === steps.length - 1

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                isDone    ? 'bg-emerald-500 border-emerald-500' :
                isCurrent ? `${meta.color} border-current` :
                            'bg-void-700 border-border'
              )}>
                {isDone
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : isCurrent
                  ? <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  : <span className="w-2 h-2 rounded-full bg-ink-500" />
                }
              </div>
              {/* Label */}
              <p className={clsx(
                'text-xs font-mono mt-2 text-center whitespace-nowrap',
                isCurrent ? meta.text : isDone ? 'text-emerald-400' : 'text-ink-500'
              )}>
                {step}
              </p>
            </div>
            {/* Connector line */}
            {!isLast && (
              <div className={clsx(
                'flex-1 h-0.5 mb-5 mx-1 rounded transition-all duration-500',
                isDone ? 'bg-emerald-500' : 'bg-border'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────
export default function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [inputId, setInputId]   = useState(searchParams.get('id') || '')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  // Auto-fill from localStorage if no query param
  useEffect(() => {
    const saved = localStorage.getItem('ab_last_submission_id')
    if (saved && !inputId) setInputId(saved)
  }, [])

  // Auto-fetch if ID comes from URL query param
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setInputId(id)
      doFetch(id)
    }
  }, [])

  const doFetch = async (id) => {
    const trimmed = (id || inputId).trim()
    if (!trimmed) return

    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const { data } = await feedbackAPI.trackById(trimmed)
      setResult(data)
      setLastChecked(new Date())
      // Persist so user can return without re-entering
      localStorage.setItem('ab_last_submission_id', trimmed)
      // Sync URL
      setSearchParams({ id: trimmed })
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    doFetch(inputId)
  }

  const refresh = () => doFetch(inputId)

  const currentMeta = result ? STATUS_META[result.status] : null
  const allTags = result ? [...new Set([...(result.tags || [])])] : []

  return (
    <div className="min-h-screen bg-void-900 bg-grid-pattern flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_60%)]" />

  {/* Header */}
  
      {/* Header */}
      <header className="border-b border-border bg-void-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
  src={logo}
  alt="Absdon Logo"
  className="w-8 h-8 object-contain"
/>
            <div>
  <span className="font-display font-semibold text-ink-100 text-sm leading-none">
    Absdon
  </span>
  <span className="text-ink-500 text-xs ml-2 font-mono">
    Feedback System
  </span>
</div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-ink-400 hover:text-emerald transition-colors font-mono">
              Submit Feedback →
            </Link>
            
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">

        {/* Hero */}
        <div className="mb-10 animate-fade-up">
          <p className="text-emerald text-xs font-mono uppercase tracking-[0.2em] mb-3">
            Feedback System
          </p>
          <h1 className="font-display font-bold text-3xl text-ink-100 leading-tight mb-3">
            Track Your Submission
          </h1>
          <p className="text-ink-300 text-sm leading-relaxed max-w-md">
            Paste your submission ID below to see the current status and history of your feedback.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="card mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <label className="label">Submission ID</label>
          <div className="flex items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              <input
                className="input-field pl-10 font-mono text-xs rounded-r-none border-r-0 h-full"
                placeholder="e.g. 7c4e2a91-3f1d-4b8e-a2d0-9e3c1f2b4a7d"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputId.trim()}
              className="shrink-0 flex items-center gap-2 bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 px-5 py-2.5 rounded-xl font-medium border border-emerald-400/30 backdrop-blur-sm transition-all duration-200 active:scale-95"
            >
              {loading
                ? <><Spinner size="sm" /> Checking...</>
                : <><Search className="w-4 h-4" /> Track</>
              }
            </button>
          </div>
          <p className="text-ink-500 text-xs font-mono mt-2">
            Your submission ID was shown on the confirmation page after submitting.
          </p>
        </form>

        {/* Error state */}
        {error && !loading && (
          <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-display font-semibold">Not Found</p>
              <p className="text-red-400/80 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Result card */}
        {result && !loading && (
          <div className="space-y-4 animate-fade-up">

            {/* Status hero */}
            <div className={clsx(
              'card border',
              currentMeta?.border || 'border-border'
            )}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-xl text-ink-100 leading-snug mb-1 truncate">
                    {result.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <TypeBadge type={result.type} />
                    <span className="text-ink-500 text-xs font-mono">{result.category}</span>
                    {result.assignedTeam && (
                      <span className="text-ink-500 text-xs font-mono">→ {result.assignedTeam}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={result.status} />
                  <SeverityBadge severity={result.severity} />
                </div>
              </div>

              {/* Status description */}
              {currentMeta && (
                <div className={clsx(
                  'flex items-start gap-3 px-3 py-3 rounded-lg mb-5',
                  `bg-void-700 border border-border`
                )}>
                  <span className={clsx('w-2 h-2 rounded-full mt-1.5 shrink-0 animate-pulse-slow', currentMeta.color)} />
                  <p className={clsx('text-sm', currentMeta.text)}>{currentMeta.desc}</p>
                </div>
              )}

              {/* Timeline */}
              <StatusTimeline currentStatus={result.status} />
            </div>

            {/* Status history */}
            {result.statusHistory?.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-ink-400" />
                  <h3 className="font-display font-semibold text-ink-200 text-xs uppercase tracking-widest">
                    Status History
                  </h3>
                </div>
                <div className="space-y-3">
                  {result.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-ink-500 whitespace-nowrap">
                        {new Date(h.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      {h.old_status && (
                        <>
                          <StatusBadge status={h.old_status} />
                          <ChevronRight className="w-3 h-3 text-ink-500" />
                        </>
                      )}
                      <StatusBadge status={h.new_status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="card">
                <h3 className="font-display font-semibold text-ink-200 text-xs uppercase tracking-widest mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((t) => <Tag key={t} label={t} />)}
                </div>
              </div>
            )}

            {/* Meta footer */}
            <div className="flex items-center justify-between text-xs font-mono text-ink-500 px-1">
              <span>
                Submitted {new Date(result.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
              <div className="flex items-center gap-2">
                {lastChecked && (
                  <span>Checked {lastChecked.toLocaleTimeString()}</span>
                )}
                <button
                  onClick={refresh}
                  className="flex items-center gap-1.5 text-emerald hover:text-emerald-dim transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty — no search yet */}
        {!result && !error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-void-700 border border-border flex items-center justify-center mb-4">
              <Inbox className="w-7 h-7 text-ink-500" />
            </div>
            <p className="text-ink-300 font-display font-semibold">Enter your submission ID above</p>
            <p className="text-ink-500 text-xs mt-1 max-w-xs">
              You received it on the confirmation page after submitting. It was also saved to your browser.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
