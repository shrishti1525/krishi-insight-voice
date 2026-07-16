import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Mic, Leaf, Radio, Settings, Menu, X } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/voice-query', label: 'Voice Query', icon: Mic },
  { to: '/crop-health', label: 'Crop Health', icon: Leaf },
  { to: '/field-monitor', label: 'Field Monitor', icon: Radio },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function MainLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-bg text-text">
      {/* Mobile top bar */}
      <div className="sm:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-20">
        <h1 className="text-lg font-bold text-primary">Krishi Insight</h1>
        <button onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          bg-white border-r border-gray-100 flex flex-col p-4 z-10
          fixed sm:static top-14 sm:top-0 left-0 h-[calc(100%-3.5rem)] sm:h-full w-64
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0
        `}
      >
        <h1 className="hidden sm:block text-lg font-bold text-primary mb-8 px-2">Krishi Insight</h1>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
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

      {/* Overlay when mobile menu open */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 bg-black/30 z-[5]"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 mt-14 sm:mt-0">
        <Outlet />
      </main>
    </div>
  )
}
export default MainLayout