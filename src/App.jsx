import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Staff from './pages/Staff.jsx'
import ServiceLog from './pages/ServiceLog.jsx'
import Bank from './pages/Bank.jsx'
import Import from './pages/Import.jsx'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/staff"       element={<Staff />} />
          <Route path="/service-log" element={<ServiceLog />} />
          <Route path="/bank"        element={<Bank />} />
          <Route path="/import"      element={<Import />} />
          <Route path="*"            element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
