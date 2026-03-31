import { useLocation, Link } from 'react-router-dom'
import { CheckCircle2, Bell, ArrowLeft, Copy, Check } from 'lucide-react'
import { useState } from 'react'


export default function SuccessPage() {
  const { state } = useLocation()
  const [copied, setCopied] = useState(false)

  const sessionId = localStorage.getItem('ab_session')

  const copy = () => {
    navigator.clipboard.writeText(state?.id || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-void-900 bg-grid-pattern flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center animate-fade-up">
        {/* Icon */}
        <div className="relative inline-flex mb-8">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald rounded-full animate-pulse-slow" />
        </div>

        <h1 className="font-display font-bold text-2xl text-ink-100 mb-2">
          Feedback Received
        </h1>
        <p className="text-ink-300 text-sm mb-8 leading-relaxed">
          Your feedback has been submitted and assigned to the relevant team.
          Our AI is processing it now.
        </p>

        {state?.id && (
          <div className="card mb-6 text-left">
            <p className="text-ink-400 text-xs font-mono uppercase tracking-widest mb-2">Submission ID</p>
            <div className="flex items-center justify-between gap-3 bg-void-700 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-emerald truncate">{state.id}</span>
              <button onClick={copy} className="shrink-0 text-ink-400 hover:text-emerald transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {state.title && (
              <p className="text-ink-300 text-sm mt-3 font-body">
                <span className="text-ink-500 text-xs font-mono">Title: </span>
                {state.title}
              </p>
            )}
          </div>
        )}

        {/* Track info */}
<div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-void-800/60 border border-emerald-800/30 border-l-2 border-l-emerald-500/40 backdrop-blur-md mb-8 text-left">
  <Bell className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
  <div>
    <p className="text-emerald-400 text-xs font-semibold font-mono mb-1">
      Track Your Feedback
    </p>
    <p className="text-ink-400 text-xs font-body leading-relaxed">
      Use your submission ID to check the status of your feedback anytime.
    </p>
  </div>
</div>

    

        

                {/* Buttons */}
        <div className="flex items-center gap-4 justify-center mt-6">
          {state?.id && (
            <Link
              to={`/track?id=${state.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 hover:border-emerald-300/50 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm transition-all duration-200 active:scale-95"
            >
              🔍 Track Feedback
            </Link>
          )}

          <Link to="/" className="flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-800/40 text-ink-300 hover:bg-emerald-800/20 hover:text-white transition-all duration-200">
            <ArrowLeft className="w-4 h-4" />
            Submit Another
          </Link>
        </div>

      </div>
    </div>
  )
}