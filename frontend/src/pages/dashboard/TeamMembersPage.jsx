import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authAPI, teamsAPI } from '../../services/api'
import { Spinner, Badge } from '../../components/ui'
import {
  UserPlus, Users, ShieldCheck, Shield, ChevronDown,
  CheckCircle2, AlertCircle, X, Loader2
} from 'lucide-react'
import clsx from 'clsx'

const ROLE_COLORS = {
  admin: 'bg-emerald/10 text-emerald border-emerald/30',
  lead:  'bg-violet/10 text-violet border-violet/30',
  member:'bg-void-600 text-ink-300 border-border',
}

export default function TeamMembersPage() {
  const { isAdmin } = useAuth()
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'member', teamId: '' })
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      const [m, t] = await Promise.all([authAPI.getMembers(), teamsAPI.list()])
      setMembers(m.data)
      setTeams(t.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createMember = async (e) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)
    try {
      await authAPI.createMember(form)
      setFormSuccess(true)
      setForm({ username: '', password: '', displayName: '', role: 'member', teamId: '' })
      setTimeout(() => { setFormSuccess(false); setShowForm(false) }, 1500)
      await load()
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to create member.')
    } finally {
      setFormLoading(false)
    }
  }

  if (!isAdmin) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <ShieldCheck className="w-10 h-10 text-ink-500 mx-auto mb-4" />
        <p className="text-ink-300">Admin access required.</p>
      </div>
    </div>
  )

  if (loading) return <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-100">Team Members</h1>
          <p className="text-ink-400 text-sm mt-0.5 font-mono">{members.length} accounts</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm transition-all duration-200 active:scale-95">
          {showForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card border-emerald/20 animate-fade-up">
          <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest mb-5">
            New Team Member
          </h2>
          <form onSubmit={createMember} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Display Name *</label>
              <input className="input-field" placeholder="Jane Doe" required
                value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Username *</label>
              <input className="input-field" placeholder="jane_doe" required minLength={3}
                value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password *</label>
              <input className="input-field" type="password" placeholder="Min 8 characters" required minLength={8}
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role *</label>
              <div className="relative">
                <select className="select-field pr-8 text-sm"
                  value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  <option value="member">Member</option>
                  <option value="lead">Lead</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="label">Team</label>
              <div className="relative">
                <select className="select-field pr-8 text-sm"
                  value={form.teamId} onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}>
                  <option value="">No team</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
              </div>
            </div>

            {formError && (
              <div className="col-span-2 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <div className="col-span-2 flex justify-end">
              <button type="submit" disabled={formLoading}
                className={clsx(
                  'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-display font-semibold bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm transition-all duration-200 active:scale-95',
                  formSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-primary'
                )}>
                {formSuccess ? (
                  <><CheckCircle2 className="w-4 h-4" /> Created!</>
                ) : formLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create Member</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members table */}
      <div className="border border-border rounded-xl overflow-hidden animate-fade-up" style={{ animationDelay: '60ms' }}>
        <table className="w-full">
          <thead className="bg-void-800 border-b border-border">
            <tr>
              {['Member', 'Role', 'Team', 'Last Login', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-ink-400 text-xs font-mono uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-void-800/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-grad-violet flex items-center justify-center shrink-0 text-white text-xs font-display font-bold">
                      {m.display_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-ink-100 text-sm font-body">{m.display_name}</p>
                      <p className="text-ink-500 text-xs font-mono">@{m.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono font-medium',
                    ROLE_COLORS[m.role]
                  )}>
                    {m.role === 'admin' && <Shield className="w-3 h-3" />}
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-ink-300 text-xs font-mono">{m.team_name || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-ink-400 text-xs font-mono">
                    {m.last_login
                      ? new Date(m.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono',
                    m.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Teams overview */}
      <div className="card animate-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-ink-400" />
          <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest">Teams</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {teams.map((t) => (
            <div key={t.id} className="bg-void-700 border border-border rounded-lg px-4 py-3">
              <p className="text-ink-100 text-sm font-display font-semibold">{t.name}</p>
              <p className="text-ink-500 text-xs font-mono mt-0.5">{t.slug}</p>
              {t.description && <p className="text-ink-400 text-xs mt-1">{t.description}</p>}
              <p className="text-emerald-400 text-xs font-mono mt-2">
                {t.feedback_count} feedback items
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
