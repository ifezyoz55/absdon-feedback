import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { feedbackAPI, notesAPI, teamsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  StatusBadge, SeverityBadge, TypeBadge, Tag, Spinner, Badge
} from '../../components/ui'
import {
  ArrowLeft, Bot, Clock, User, Building2, Ghost,
  Send, Trash2, ChevronDown, AlertCircle, CheckCircle2,
  FileText, Tag as TagIcon, Users
} from 'lucide-react'
import clsx from 'clsx'

const STATUSES = ['New', 'Under Review', 'Accepted', 'Rejected', 'Implemented']

const STATUS_COLORS = {
  New: 'bg-blue-500', 'Under Review': 'bg-amber-500',
  Accepted: 'bg-emerald-500', Rejected: 'bg-red-500', Implemented: 'bg-purple-500',
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-ink-400" />
        <h3 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function FeedbackDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Status update
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusSuccess, setStatusSuccess] = useState(false)

  // Notes
  const [noteContent, setNoteContent] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  // Team members for assignment
  const [teamMembers, setTeamMembers] = useState([])
  const [assignLoading, setAssignLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await feedbackAPI.getById(id)
      setItem(data)
      setNewStatus(data.status)
      // Load team members if we have a team
      if (data.assigned_team) {
        const { data: members } = await teamsAPI.members(data.assigned_team)
        setTeamMembers(members)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load feedback.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const updateStatus = async () => {
    if (newStatus === item.status && !statusNote) return
    setStatusLoading(true)
    try {
      await feedbackAPI.updateStatus(id, newStatus, statusNote)
      setStatusSuccess(true)
      setStatusNote('')
      setTimeout(() => setStatusSuccess(false), 2500)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setStatusLoading(false)
    }
  }

  const addNote = async () => {
    if (!noteContent.trim()) return
    setNoteLoading(true)
    try {
      const { data: note } = await notesAPI.create(id, noteContent.trim())
      setItem((prev) => ({ ...prev, notes: [...(prev.notes || []), note] }))
      setNoteContent('')
    } catch (err) {
      console.error(err)
    } finally {
      setNoteLoading(false)
    }
  }

  const deleteNote = async (noteId) => {
    await notesAPI.delete(id, noteId)
    setItem((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== noteId) }))
  }

  const assignMember = async (memberId) => {
    setAssignLoading(true)
    try {
      await feedbackAPI.assign(id, memberId || null)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setAssignLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
  )
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
      <p className="text-ink-300">{error}</p>
      <Link to="/dashboard/feedback" className="btn-ghost mt-4 text-sm">← Back to list</Link>
    </div>
  )

  const submitterIcon = { regular: User, builder: Building2, anonymous: Ghost }[item.submitter_type] || User
  const SubmitterIcon = submitterIcon
  const allTags = [...new Set([...(item.tags || []), ...(item.ai_tags || [])])]

  return (
    <div className="max-w-6xl space-y-5">
      {/* Back nav */}
      <Link to="/dashboard/feedback" className="inline-flex items-center gap-2 text-ink-400 hover:text-emerald text-sm transition-colors font-mono animate-fade-up">
        <ArrowLeft className="w-4 h-4" /> Back to Feedback
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT COLUMN — main content ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Main card */}
          <div className="card animate-fade-up">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-xl text-ink-100 leading-snug">
                  {item.title}
                </h1>
                <p className="text-ink-500 text-xs font-mono mt-1">
                  {new Date(item.created_at).toLocaleString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <StatusBadge status={item.status} />
                <SeverityBadge severity={item.severity} />
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2 mb-5">
              <TypeBadge type={item.type} />
              <Badge variant="default">{item.category}</Badge>
              {item.team_name && <Badge variant="emerald">{item.team_name}</Badge>}
            </div>

            {/* Description */}
            <div className="bg-void-700 rounded-lg p-4 border border-border">
              <p className="text-ink-200 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {allTags.map((t) => <Tag key={t} label={t} />)}
              </div>
            )}
          </div>

          {/* AI Summary */}
          {item.ai_summary && (
            <div className="card border-violet/20 animate-fade-up" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded bg-violet/20 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-violet" />
                </div>
                <h3 className="font-display font-semibold text-ink-200 text-xs uppercase tracking-widest">AI Summary</h3>
                {item.ai_processed && (
                  <span className="ml-auto text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Processed
                  </span>
                )}
              </div>
              <p className="text-ink-300 text-sm leading-relaxed">{item.ai_summary}</p>
            </div>
          )}

          {/* Submitter info */}
          {item.submitter_type !== 'anonymous' && (
            <Section title="Submitter" icon={SubmitterIcon}>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                {item.username && (
                  <div><p className="text-ink-500 mb-0.5">Name / Handle</p><p className="text-ink-200">{item.username}</p></div>
                )}
                {item.wallet_address && (
                  <div><p className="text-ink-500 mb-0.5">Wallet</p><p className="text-emerald break-all">{item.wallet_address}</p></div>
                )}
                {item.project_link && (
                  <div className="col-span-2">
                    <p className="text-ink-500 mb-0.5">Project Link</p>
                    <a href={item.project_link} target="_blank" rel="noreferrer" className="text-emerald hover:underline truncate block">{item.project_link}</a>
                  </div>
                )}
                {item.additional_metrics && (
                  <div className="col-span-2">
                    <p className="text-ink-500 mb-0.5">Additional Metrics</p>
                    <p className="text-ink-200 whitespace-pre-wrap">{item.additional_metrics}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Internal Notes */}
          <Section title="Internal Notes" icon={FileText}>
            <div className="space-y-3 mb-4">
              {(item.notes || []).length === 0 ? (
                <p className="text-ink-500 text-xs font-mono py-4 text-center">No notes yet. Add context for your team.</p>
              ) : (
                item.notes.map((note) => (
                  <div key={note.id} className="bg-void-700 rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald text-xs font-mono">{note.author_name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-ink-500 text-xs font-mono">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                        {note.author_username === user?.username && (
                          <button onClick={() => deleteNote(note.id)}
                            className="text-ink-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-ink-200 text-sm">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add note */}
            <div className="flex gap-2">
              <textarea
                className="input-field resize-none text-xs flex-1"
                rows={2}
                placeholder="Add an internal note visible only to the team..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
                }}
              />
              <button onClick={addNote} disabled={noteLoading || !noteContent.trim()}
                className="self-end flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-lg bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm transition-all duration-200 active:scale-95">
                <Send className="w-3.5 h-3.5" />
                {noteLoading ? '...' : 'Post'}
              </button>
            </div>
            <p className="text-ink-500 text-xs mt-1 font-mono">⌘ + Enter to post</p>
          </Section>
        </div>

        {/* ── RIGHT COLUMN — controls ── */}
        <div className="space-y-5">
          {/* Status update */}
          <div className="card animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h3 className="font-display font-semibold text-ink-200 text-xs uppercase tracking-widest mb-4">
              Update Status
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="select-field pr-8 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
              </div>
              <textarea
                className="input-field resize-none text-xs"
                rows={2}
                placeholder="Optional note for status change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
              <button
                onClick={updateStatus}
                disabled={statusLoading}
                className={clsx(
                  'w-full px-5 py-2.5 rounded-lg text-xs font-display font-semibold flex items-center justify-center gap-2 bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm transition-all duration-200 active:scale-95',
                  statusSuccess
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'btn-primary'
                )}
              >
                {statusSuccess
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Updated!</>
                  : statusLoading ? 'Saving...' : 'Save Status'
                }
              </button>
            </div>
          </div>

          {/* Assign member */}
          <div className="card animate-fade-up" style={{ animationDelay: '150ms' }}>
            <h3 className="font-display font-semibold text-ink-200 text-xs uppercase tracking-widest mb-4">
              Assign To
            </h3>
            <div className="relative">
              <select
                value={item.assigned_member || ''}
                onChange={(e) => assignMember(e.target.value)}
                disabled={assignLoading}
                className="select-field pr-8 text-xs"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.display_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none" />
            </div>
            {item.assignee_name && (
              <p className="text-emerald-400 text-xs font-mono mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Assigned to {item.assignee_name}
              </p>
            )}
          </div>

          {/* Status history */}
          {(item.statusHistory || []).length > 0 && (
            <div className="card animate-fade-up" style={{ animationDelay: '200ms' }}>
              <h3 className="font-display font-semibold text-ink-200 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-ink-400" /> History
              </h3>
              <div className="space-y-3">
                {item.statusHistory.map((h) => (
                  <div key={h.id} className="relative pl-4">
                    <div className={clsx(
                      'absolute left-0 top-1.5 w-2 h-2 rounded-full',
                      STATUS_COLORS[h.new_status] || 'bg-ink-500'
                    )} />
                    <div className="border-l border-border pl-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.new_status} />
                        <span className="text-ink-500 text-xs font-mono">← {h.old_status}</span>
                      </div>
                      {h.changed_by_name && (
                        <p className="text-ink-400 text-xs font-mono mt-0.5">{h.changed_by_name}</p>
                      )}
                      {h.note && <p className="text-ink-300 text-xs mt-1 italic">"{h.note}"</p>}
                      <p className="text-ink-500 text-xs font-mono mt-0.5">
                        {new Date(h.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
