import clsx from 'clsx'

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-void-600 text-ink-200 border-border',
    emerald: 'bg-emerald/10 text-emerald border-emerald/30',
    violet: 'bg-violet/10 text-violet border-violet/30',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  }
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-mono font-medium',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}

const STATUS_MAP = {
  'New':          { label: 'New',          color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'Under Review': { label: 'Under Review', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'Accepted':     { label: 'Accepted',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  'Rejected':     { label: 'Rejected',     color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  'Implemented':  { label: 'Implemented',  color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP['New']
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-mono font-medium',
      cfg.color
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {cfg.label}
    </span>
  )
}

const SEVERITY_MAP = {
  Low:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Medium:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Critical: 'bg-red-500/10 text-red-400 border-red-500/30',
}

export function SeverityBadge({ severity }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold uppercase tracking-wide',
      SEVERITY_MAP[severity] || SEVERITY_MAP.Low
    )}>
      {severity === 'Critical' && '⚡ '}{severity}
    </span>
  )
}

export function TypeBadge({ type }) {
  const map = {
    Bug:       'bg-red-500/10 text-red-300 border-red-500/30',
    Idea:      'bg-emerald/10 text-emerald border-emerald/30',
    Complaint: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    Praise:    'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  }
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono',
      map[type] || map.Idea
    )}>
      {type}
    </span>
  )
}

export function Tag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-void-600 border border-border text-ink-300 text-xs font-mono">
      #{label}
    </span>
  )
}

export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-4 h-4 border', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-2' }
  return (
    <div className={clsx(
      'rounded-full border-emerald/20 border-t-emerald animate-spin',
      s[size]
    )} />
  )
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && <Icon className="w-10 h-10 text-ink-500 mb-4" />}
      <p className="text-ink-300 font-display font-semibold text-lg">{title}</p>
      {description && <p className="text-ink-400 text-sm mt-1 max-w-xs">{description}</p>}
    </div>
  )
}
