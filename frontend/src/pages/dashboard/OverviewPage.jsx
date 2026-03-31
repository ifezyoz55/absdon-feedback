import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { teamsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge, SeverityBadge, Spinner } from '../../components/ui'
import {
  MessageSquare, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, XCircle, Zap, ArrowRight
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_ICONS = {
  'New': { icon: MessageSquare, color: 'text-blue-400' },
  'Under Review': { icon: Clock, color: 'text-amber-400' },
  'Accepted': { icon: CheckCircle2, color: 'text-emerald-400' },
  'Rejected': { icon: XCircle, color: 'text-red-400' },
  'Implemented': { icon: Zap, color: 'text-purple-400' },
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-ink-400 text-xs font-mono uppercase tracking-widest mb-1">{label}</p>
        <p className="font-display font-bold text-3xl text-ink-100">{value ?? '—'}</p>
        {sub && <p className="text-ink-400 text-xs mt-1">{sub}</p>}
      </div>
      <div className={clsx('p-2 rounded-lg bg-void-700', color)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    teamsAPI.stats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  )

  const byStatus = Object.fromEntries((stats?.byStatus || []).map((r) => [r.status, r.count]))
  const bySeverity = Object.fromEntries((stats?.bySeverity || []).map((r) => [r.severity, r.count]))
  const total = Object.values(byStatus).reduce((a, b) => a + Number(b), 0)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div className="animate-fade-up">
        <h1 className="font-display font-bold text-2xl text-ink-100">
          Welcome back, <span className="text-emerald">{user?.displayName?.split(' ')[0]}</span>
        </h1>
        <p className="text-ink-400 text-sm mt-1">
          {user?.teamName ? `Viewing feedback for ${user.teamName}` : 'Viewing all teams'}
        </p>
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard label="Total" value={total} icon={MessageSquare} color="text-ink-300" />
        <StatCard label="New" value={byStatus['New'] || 0} icon={MessageSquare} color="text-blue-400" />
        <StatCard label="Under Review" value={byStatus['Under Review'] || 0} icon={Clock} color="text-amber-400" />
        <StatCard label="Implemented" value={byStatus['Implemented'] || 0} icon={Zap} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="card animate-fade-up" style={{ animationDelay: '120ms' }}>
          <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest mb-5">
            Status Breakdown
          </h2>
          <div className="space-y-3">
            {['New', 'Under Review', 'Accepted', 'Rejected', 'Implemented'].map((status) => {
              const count = Number(byStatus[status] || 0)
              const pct = total > 0 ? (count / total) * 100 : 0
              const cfg = STATUS_ICONS[status]
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <cfg.icon className={clsx('w-3.5 h-3.5', cfg.color)} />
                      <span className="text-ink-300 text-xs font-mono">{status}</span>
                    </div>
                    <span className="text-ink-200 text-xs font-mono">{count}</span>
                  </div>
                  <div className="h-1.5 bg-void-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald to-violet rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Severity + category */}
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: '180ms' }}>
          {/* Severity */}
          <div className="card">
            <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest mb-4">
              By Severity
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {['Critical', 'Medium', 'Low'].map((s) => {
                const colors = {
                  Critical: 'bg-red-500/10 border-red-500/30 text-red-400',
                  Medium: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                  Low: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                }
                return (
                  <div key={s} className={clsx('rounded-lg border px-3 py-3 text-center', colors[s])}>
                    <p className="font-display font-bold text-2xl">{bySeverity[s] || 0}</p>
                    <p className="text-xs font-mono mt-0.5 opacity-80">{s}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category */}
          <div className="card">
            <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest mb-4">
              By Category
            </h2>
            <div className="space-y-2">
              {(stats?.byCategory || []).map(({ category, count }) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-ink-300 text-xs font-mono">{category}</span>
                  <span className="font-mono text-xs text-emerald">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card animate-fade-up" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-ink-200 text-sm uppercase tracking-widest">
            Recent Activity
          </h2>
          <Link to="/dashboard/feedback" className="text-xs text-emerald hover:text-emerald-dim transition-colors font-mono flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {(stats?.recentActivity || []).length === 0 ? (
            <p className="text-ink-500 text-sm text-center py-8">No activity yet.</p>
          ) : (
            stats.recentActivity.map((item) => (
              <Link
                key={item.id}
                to={`/dashboard/feedback/${item.id}`}
                className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg hover:bg-void-700 transition-colors group"
              >
                <p className="text-ink-200 text-sm truncate flex-1 group-hover:text-ink-100 transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <SeverityBadge severity={item.severity} />
                  <StatusBadge status={item.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
