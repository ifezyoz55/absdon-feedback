import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { feedbackAPI } from '../../services/api'
import { StatusBadge, SeverityBadge, TypeBadge, Spinner, EmptyState } from '../../components/ui'
import { Search, Filter, ChevronDown, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const STATUSES   = ['New','Under Review','Accepted','Rejected','Implemented']
const CATEGORIES = ['Community','Builders','Developers','Suggestions','Advice']
const TYPES      = ['Bug','Idea','Complaint','Praise']
const SEVERITIES = ['Low','Medium','Critical']

function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-void-700 border border-border text-ink-200 rounded-lg pl-3 pr-8 py-2 text-xs font-mono focus:outline-none focus:border-emerald/50 appearance-none cursor-pointer"
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-400 pointer-events-none" />
    </div>
  )
}

export default function FeedbackListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const page     = parseInt(searchParams.get('page') || '1')
  const status   = searchParams.get('status') || ''
  const category = searchParams.get('category') || ''
  const type     = searchParams.get('type') || ''
  const severity = searchParams.get('severity') || ''
  const search   = searchParams.get('search') || ''
  const limit    = 15

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await feedbackAPI.list({ page, limit, status, category, type, severity, search })
      setItems(data.data)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, status, category, type, severity, search])

  useEffect(() => { fetch() }, [fetch])

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val); else p.delete(key)
    p.set('page', '1')
    setSearchParams(p)
  }

  const clearAll = () => setSearchParams({})

  const hasFilters = status || category || type || severity || search
  const totalPages = Math.ceil(total / limit)

  const typeMeta = { regular: '👤', builder: '🏗️', anonymous: '👻' }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-100">Feedback</h1>
          <p className="text-ink-400 text-sm mt-0.5 font-mono">{total} submissions</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: '60ms' }}>
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400" />
          <input
            className="w-full bg-void-700 border border-border text-ink-200 rounded-lg pl-9 pr-4 py-2 text-xs font-mono focus:outline-none focus:border-emerald/50 placeholder:text-ink-500"
            placeholder="Search title or description..."
            value={search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-ink-400" />
          <FilterSelect label="Status"   options={STATUSES}   value={status}   onChange={(v) => setFilter('status', v)} />
          <FilterSelect label="Category" options={CATEGORIES} value={category} onChange={(v) => setFilter('category', v)} />
          <FilterSelect label="Type"     options={TYPES}      value={type}     onChange={(v) => setFilter('type', v)} />
          <FilterSelect label="Severity" options={SEVERITIES} value={severity} onChange={(v) => setFilter('severity', v)} />
          {hasFilters && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-ink-400 hover:text-red-400 transition-colors font-mono">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-xl overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No feedback found" description="Try adjusting your filters." />
        ) : (
          <table className="w-full">
            <thead className="bg-void-800 border-b border-border">
              <tr>
                {['Feedback', 'Category', 'Type', 'Severity', 'Status', 'Submitted'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-ink-400 text-xs font-mono uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-void-800/50 transition-colors group">
                  <td className="px-4 py-3 max-w-xs">
                    <Link to={`/dashboard/feedback/${item.id}`} className="block">
                      <p className="text-ink-100 text-sm font-body truncate group-hover:text-emerald transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">{typeMeta[item.submitter_type]}</span>
                        <span className="text-ink-500 text-xs font-mono capitalize">{item.submitter_type}</span>
                        {item.username && (
                          <span className="text-ink-400 text-xs truncate max-w-24">{item.username}</span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-ink-300 text-xs font-mono">{item.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={item.type} />
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={item.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-400 text-xs font-mono whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between animate-fade-up">
          <p className="text-ink-500 text-xs font-mono">
            Page {page} of {totalPages} · {total} results
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setFilter('page', String(page - 1))}
              className="btn-ghost flex items-center gap-1 text-xs disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setFilter('page', String(page + 1))}
              className="btn-ghost flex items-center gap-1 text-xs disabled:opacity-30"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
