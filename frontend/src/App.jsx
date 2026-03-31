import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotifProvider } from './context/NotifContext'
import TrackPage from './pages/TrackPage';


// Public pages
import SubmitPage from './pages/SubmitPage'
import SuccessPage from './pages/SuccessPage'

// Dashboard pages
import LoginPage from './pages/dashboard/LoginPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import OverviewPage from './pages/dashboard/OverviewPage'
import FeedbackListPage from './pages/dashboard/FeedbackListPage'
import FeedbackDetailPage from './pages/dashboard/FeedbackDetailPage'
import TeamMembersPage from './pages/dashboard/TeamMembersPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-void-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald/30 border-t-emerald rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/dashboard/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <NotifProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<SubmitPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/track" element={<TrackPage />} />
            

            {/* Dashboard */}
            <Route path="/dashboard/login" element={<LoginPage />} />
            <Route path="/dashboard" element={
              <PrivateRoute><DashboardLayout /></PrivateRoute>
            }>
              <Route index element={<OverviewPage />} />
              <Route path="feedback" element={<FeedbackListPage />} />
              <Route path="feedback/:id" element={<FeedbackDetailPage />} />
              <Route path="members" element={<TeamMembersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotifProvider>
    </AuthProvider>
  )
}
