'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { icon: '🎯', label: 'Diagnostic IA', href: '/assessment' },
  { icon: '⚡', label: 'Focus', href: '/focus' },
  { icon: '📋', label: 'Tâches', href: '/tasks' },
  { icon: '👥', label: 'Pipeline', href: '/pipeline' },
  { icon: '📄', label: 'Devis & Factures', href: '/invoices' },
  { icon: '💰', label: 'Cash', href: '/cash' },
  { icon: '📣', label: 'LinkedIn', href: '/content' },
  { icon: '🧠', label: 'Chat', href: '/chat' },
  { icon: '🤖', label: 'Agents IA', href: '/agents' },
  { icon: '📚', label: 'Base de connaissance', href: '/knowledge-base' },
  { icon: '⚙️', label: 'Paramètres', href: '/settings' },
]

interface SidebarProps {
  userEmail?: string
  userInitials?: string
}

export default function Sidebar({
  userEmail = 'user@example.com',
  userInitials = 'U',
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (_) {}
    router.push('/login')
  }

  return (
    <aside
      className={[
        'hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0',
        'bg-[#0f0f1a] border-r border-[#2a2a42] transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[240px]',
      ].join(' ')}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-[#2a2a42] min-h-[64px]">
        {!collapsed && (
          <span className="text-white font-bold text-sm tracking-wide truncate">
            Business AI OS
          </span>
        )}
        {collapsed && (
          <span className="text-[#818cf8] font-bold text-xs w-full text-center">
            BAI
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 ml-auto p-1.5 rounded-lg text-[#818cf8] hover:bg-[#1e1e30] hover:text-white transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#4f46e5]/20 border-l-2 border-[#4f46e5] text-white'
                  : 'text-[#818cf8] hover:bg-[#1e1e30] hover:text-white border-l-2 border-transparent',
                collapsed ? 'justify-center' : '',
              ].join(' ')}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-2 py-3 border-t border-[#2a2a42] space-y-1">
        <div
          className={[
            'flex items-center gap-3 rounded-lg px-2 py-2',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-white text-xs font-bold">
            {userInitials}
          </div>
          {!collapsed && (
            <span className="text-xs text-[#818cf8] truncate max-w-[140px]">
              {userEmail}
            </span>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={[
            'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            'text-[#f87171] hover:bg-red-900/20 hover:text-red-400 border-l-2 border-transparent',
            collapsed ? 'justify-center' : '',
            loggingOut ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
          title={collapsed ? 'Se déconnecter' : undefined}
          aria-label="Se déconnecter"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && (
            <span>{loggingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
          )}
        </button>
      </div>
    </aside>
  )
}
