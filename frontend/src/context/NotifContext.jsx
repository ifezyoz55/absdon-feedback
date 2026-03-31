import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { feedbackAPI } from '../services/api'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const intervalRef = useRef(null)

  const sessionId = localStorage.getItem('ab_session')

  const fetchNotifs = useCallback(async () => {
    if (!sessionId) return
    try {
      const { data } = await feedbackAPI.getNotifications(sessionId)
      setNotifications(data)
    } catch (_) {}
  }, [sessionId])

  // Poll every 30s if we have a session
  useEffect(() => {
    if (!sessionId) return
    fetchNotifs()
    intervalRef.current = setInterval(fetchNotifs, 30000)
    return () => clearInterval(intervalRef.current)
  }, [fetchNotifs, sessionId])

  const markRead = useCallback(async (id) => {
    await feedbackAPI.markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }, [])

  const unread = notifications.filter((n) => !n.read)

  return (
    <NotifContext.Provider value={{ notifications, unread, markRead, refresh: fetchNotifs }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotifications = () => useContext(NotifContext)
