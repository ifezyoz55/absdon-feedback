import { useState, useId, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import {
  MessageSquare, User, Building2, Ghost, ChevronDown,
  Plus, X, Loader2, AlertTriangle, Zap
} from 'lucide-react'
import { feedbackAPI } from '../services/api'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
// ── Ensure session ID exists ──────────────────────────────
function ensureSession() {
  let s = localStorage.getItem('ab_session')
  if (!s) { s = uuidv4(); localStorage.setItem('ab_session', s) }
  return s
}

// ── Select component ──────────────────────────────────────
function Select({ label, id, options, value, onChange, required }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}{required && ' *'}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="select-field pr-10"
          required={required}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
      </div>
    </div>
  )
}

// ── User type selector card ───────────────────────────────
function UserTypeCard({ icon: Icon, label, description, selected, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'relative flex flex-col items-start gap-2 p-4 rounded-xl border transition-all duration-200 text-left w-full',
        selected
          ? color === 'emerald'
            ? 'border-emerald/60 bg-emerald/5 shadow-[0_0_20px_rgba(0,212,255,0.1)]'
            : color === 'violet'
            ? 'border-violet/60 bg-violet/5 shadow-[0_0_20px_rgba(123,97,255,0.1)]'
            : 'border-border-bright bg-void-700'
          : 'border-border bg-void-700 hover:border-border-bright'
      )}
    >
      {selected && (
        <span className={clsx(
          'absolute top-3 right-3 w-2 h-2 rounded-full',
          color === 'emerald' ? 'bg-emerald' : color === 'violet' ? 'bg-violet' : 'bg-ink-300'
        )} />
      )}
      <Icon className={clsx(
        'w-5 h-5',
        selected
          ? color === 'emerald' ? 'text-emerald' : color === 'violet' ? 'text-violet' : 'text-ink-200'
          : 'text-ink-400'
      )} />
      <div>
        <p className={clsx('text-sm font-display font-semibold',
          selected ? 'text-ink-100' : 'text-ink-300'
        )}>{label}</p>
        <p className="text-xs text-ink-400 mt-0.5 font-body">{description}</p>
      </div>
    </button>
  )
}

const INITIAL = {
  submitterType: 'regular',
  username: '', walletAddress: '', projectLink: '', additionalMetrics: '',
  title: '', description: '',
  category: '', type: '', severity: '',
  tags: [],
}

export default function SubmitPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { ensureSession() }, [])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !form.tags.includes(t) && form.tags.length < 8) {
      set('tags', [...form.tags, t])
      setTagInput('')
    }
  }

  const removeTag = (t) => set('tags', form.tags.filter((x) => x !== t))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.category || !form.type || !form.severity) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const { data } = await feedbackAPI.submit(form)
      navigate('/success', { state: { id: data.id, title: form.title } })
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.errors?.[0]?.msg
        || 'Submission failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const typeConfig = {
    regular:   { icon: User,      label: 'Regular User',   description: 'Username & wallet',   color: 'emerald' },
    builder:   { icon: Building2, label: 'Builder',        description: 'Project details',      color: 'violet' },
    anonymous: { icon: Ghost,     label: 'Anonymous',      description: 'No identity required', color: 'gray' },
  }

  return (
    <div className="min-h-screen bg-void-900 bg-grid-pattern flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-void-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
  to="/"
  className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
>
  <img
  src={logo}
  alt="Absdon Logo"
  className="w-10 h-10 object-contain mix-blend-lighten"
/>

  <div>
    <span className="font-display font-bold text-ink-100 text-sm tracking-wide">
  Absdon
</span>
<span className="text-ink-500 text-xs ml-2 font-mono">
  Feedback System
</span>
  </div>
</Link>
          <div className="flex items-center gap-4">
  

  <div className="flex items-center gap-4">
  <a
    href="/track"
    className="text-xs text-ink-400 hover:text-emerald font-mono"
  >
    Track Feedback →
  </a>
</div>
</div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {/* Hero */}
        <div className="mb-10 animate-fade-up">
          <p className="text-emerald text-xs font-mono uppercase tracking-[0.2em] mb-3">
            Community Feedback
          </p>
          <h1 className="font-display font-bold text-3xl text-ink-100 leading-tight mb-3">
            Shape the Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald to-violet">
              Absdon 
            </span>
          </h1>
          <p className="text-ink-300 text-sm max-w-md leading-relaxed">
            Your feedback goes directly to the teams building the ecosystem.
            Report bugs, share ideas, or let us know what's working well.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: User Type */}
          <section className="card animate-fade-up" style={{ animationDelay: '60ms' }}>
            <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest mb-4">
              01 — Who are you?
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <UserTypeCard
                  key={key}
                  {...cfg}
                  selected={form.submitterType === key}
                  onClick={() => set('submitterType', key)}
                />
              ))}
            </div>

            {/* Conditional identity fields */}
            {form.submitterType === 'regular' && (
              <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-border">
                <div>
                  <label className="label">Username</label>
                  <input className="input-field" placeholder="your_handle"
                    value={form.username} onChange={(e) => set('username', e.target.value)} />
                </div>
                <div>
                  <label className="label">Wallet Address</label>
                  <input className="input-field font-mono text-xs" placeholder="0x..."
                    value={form.walletAddress} onChange={(e) => set('walletAddress', e.target.value)} />
                </div>
              </div>
            )}

            {form.submitterType === 'builder' && (
              <div className="space-y-4 mt-5 pt-5 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Your Name</label>
                    <input className="input-field" placeholder="Builder name"
                      value={form.username} onChange={(e) => set('username', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">AGW Wallet Address</label>
                    <input className="input-field font-mono text-xs" placeholder="0x..."
                      value={form.walletAddress} onChange={(e) => set('walletAddress', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Project Link</label>
                  <input className="input-field" placeholder="https://yourproject.xyz"
                    value={form.projectLink} onChange={(e) => set('projectLink', e.target.value)} />
                </div>
                <div>
                  <label className="label">Additional Metrics <span className="normal-case text-ink-500 ml-1">(optional)</span></label>
                  <textarea className="input-field resize-none" rows={3}
                    placeholder="TVL, MAU, GitHub stars, or other relevant metrics..."
                    value={form.additionalMetrics} onChange={(e) => set('additionalMetrics', e.target.value)} />
                </div>
              </div>
            )}

            {form.submitterType === 'anonymous' && (
              <div className="mt-5 pt-5 border-t border-border flex items-center gap-3 text-ink-400 text-xs font-mono">
                <Ghost className="w-4 h-4" />
                <span>Your identity is hidden. Session tracked for spam prevention only.</span>
              </div>
            )}
          </section>

          {/* Step 2: Feedback Content */}
          <section className="card animate-fade-up" style={{ animationDelay: '120ms' }}>
            <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest mb-4">
              02 — Your Feedback
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  className="input-field"
                  placeholder="Brief summary of your feedback..."
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                  maxLength={300}
                />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea
                  className="input-field resize-none"
                  rows={5}
                  placeholder="Describe your feedback in detail. Be specific — include steps to reproduce, expected behaviour, or your suggestion..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  required
                />
                <p className="text-ink-500 text-xs mt-1 font-mono text-right">{form.description.length} chars</p>
              </div>
            </div>
          </section>

          {/* Step 3: Classification */}
          <section className="card animate-fade-up" style={{ animationDelay: '180ms' }}>
            <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest mb-4">
              03 — Classification
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Category"
                id="category"
                options={['Community', 'Builders', 'Developers', 'Suggestions', 'Advice']}
                value={form.category}
                onChange={(v) => set('category', v)}
                required
              />
              <Select
                label="Type"
                id="type"
                options={['Bug', 'Idea', 'Complaint', 'Praise']}
                value={form.type}
                onChange={(v) => set('type', v)}
                required
              />
              <Select
                label="Severity"
                id="severity"
                options={['Low', 'Medium', 'Critical']}
                value={form.severity}
                onChange={(v) => set('severity', v)}
                required
              />
            </div>

            {/* Tags */}
            <div className="mt-5 pt-5 border-t border-border">
              <label className="label">Tags <span className="normal-case text-ink-500 ml-1">(optional)</span></label>
              <div className="flex gap-2">
                <input
                  className="input-field"
                  placeholder="Add a tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  maxLength={30}
                />
                <button type="button" onClick={addTag}
                  className="btn-ghost shrink-0 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-void-600 border border-border text-ink-300 text-xs font-mono">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* AI notice */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-violet/5 border border-violet/20 animate-fade-up" style={{ animationDelay: '240ms' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-violet mt-1.5 shrink-0 animate-pulse-slow" />
            <p className="text-xs text-ink-300 font-mono leading-relaxed">
              <span className="text-violet font-semibold">AI-powered</span> — Your submission will be automatically summarised and tagged by our AI engine. Teams receive enriched feedback.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pb-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><MessageSquare className="w-4 h-4" /> Submit Feedback</>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
