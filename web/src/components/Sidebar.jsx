import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, List, Landmark, Wallet, Settings, LogOut } from 'lucide-react'

const links = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/staff',       label: 'Staff',       icon: Users },
  { to: '/service-log', label: 'Service Log', icon: List },
  { to: '/bank',        label: 'Bank',        icon: Landmark },
  { to: '/settlement',  label: 'Settlement',  icon: Wallet },
  { to: '/settings',    label: 'Settings',    icon: Settings },
]

export default function Sidebar({ onLogout }) {
  return (
    <aside className="w-52 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="px-5 py-5 border-b border-zinc-800">
        <h1 className="font-serif text-amber-400 text-lg leading-tight">BizReport</h1>
        <p className="text-zinc-500 text-xs mt-0.5">Business Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
              ${isActive
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-zinc-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800/50 transition-colors w-full"
        >
          <LogOut size={15} />
          Logout
        </button>
        <p className="text-zinc-600 text-xs px-3 mt-2">v1.0</p>
      </div>
    </aside>
  )
}
