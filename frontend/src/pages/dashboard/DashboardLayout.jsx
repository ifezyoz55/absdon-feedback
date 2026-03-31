import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotifContext'
import {
  LayoutDashboard, MessageSquare, Users, LogOut,
  Zap, Bell, ChevronRight, Shield
} from 'lucide-react'
import clsx from 'clsx'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

function NavItem({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-150 group',
        isActive
          ? 'bg-emerald/10 text-emerald border border-emerald/20'
          : 'text-ink-300 hover:text-ink-100 hover:bg-void-600 border border-transparent'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="text-xs font-mono bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  )
}

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth()
  const { unread } = useNotifications()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/dashboard/login')
  }

  return (
    <div className="min-h-screen bg-void-900 flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-void-950 flex flex-col sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border">
  <Link
    to="/"
    className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer relative z-50"
  >
    <img
  src={logo}
  alt="Absdon Logo"
  className="w-8 h-8 object-contain"
 />

    <div>
      <p className="font-display font-semibold text-ink-100 text-sm leading-none">Absdon</p>
      <p className="font-mono text-ink-500 text-xs">Feedback System</p>
    </div>
  </Link>
</div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 text-ink-500 text-xs font-mono uppercase tracking-widest mb-3">Navigation</p>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/dashboard/feedback" icon={MessageSquare} label="Feedback" />
          {isAdmin && <NavItem to="/dashboard/members" icon={Users} label="Team Members" />}
        </nav>

        {/* User card */}
        <div className="px-3 pb-4 border-t border-border pt-4">
          <div className="bg-void-700 rounded-lg px-3 py-3 mb-2">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-grad-violet flex items-center justify-center shrink-0 text-white text-xs font-display font-bold">
                {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-ink-100 text-xs font-display font-semibold truncate">
                  {user?.displayName || user?.username}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {user?.role === 'admin' && <Shield className="w-3 h-3 text-emerald" />}
                  <p className="text-ink-500 text-xs font-mono capitalize">{user?.role}</p>
                </div>
                {user?.teamName && (
                  <p className="text-ink-400 text-xs truncate mt-0.5">{user.teamName}</p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-ink-400 text-sm hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-void-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-ink-400 text-xs font-mono">
            <span>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-200">
              {user?.teamName || 'All Teams'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="text-xs text-ink-500 hover:text-emerald transition-colors font-mono"
            >
              View Public Form ↗
            </a>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
