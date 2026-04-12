import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getSession, onAuthStateChange, signOut } from './lib/auth'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Staff from './pages/Staff.jsx'
import ServiceLog from './pages/ServiceLog.jsx'
import Settlement from './pages/Settlement.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    getSession().then(s => setSession(s))
    const { data: { subscription } } = onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    if (!window.confirm('Are you sure you want to logout?')) return
    await signOut()
    setSession(null)
  }

  // Show nothing while checking auth (avoids flash)
  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-300 dark:border-zinc-600 border-t-amber-500 dark:border-t-amber-400" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={
        session ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="*" element={
        <ProtectedRoute session={session}>
          <div className="flex h-screen overflow-hidden bg-stone-50 dark:bg-zinc-950">
            <Sidebar onLogout={handleLogout} />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/"            element={<Dashboard />} />
                <Route path="/staff"       element={<Staff />} />
                <Route path="/service-log" element={<ServiceLog />} />
                <Route path="/settlement"  element={<Settlement />} />
                <Route path="/settings"    element={<Settings onLogout={handleLogout} />} />
                <Route path="*"            element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
