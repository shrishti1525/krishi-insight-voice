import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Mic, Leaf, Radio, Settings } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/voice-query', label: 'Voice Query', icon: Mic },
  { to: '/crop-health', label: 'Crop Health', icon: Leaf },
  { to: '/field-monitor', label: 'Field Monitor', icon: Radio },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function MainLayout() {
  return (
    <div className="flex h-screen bg-bg text-text">
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-4">
        <h1 className="text-lg font-bold text-primary mb-8 px-2">Krishi Insight</h1>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
export default MainLayout