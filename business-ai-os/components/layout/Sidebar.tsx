'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import BrainloLogo from '@/components/ui/BrainloLogo'
import ProBadge from '@/components/ui/ProBadge'

interface NavItem {
  icon: string
  label: string
  href: string
  isPro: boolean
}

interface NavSection {
  id: string
  icon: string
  label: string
  items: NavItem[]
}

const sectionColors: Record<string, { text: string; bg: string; border: string; activeBg: string }> = {
  brain:      { text: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: '#a78bfa', activeBg: 'rgba(167,139,250,0.18)' },
  focus:      { text: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: '#fbbf24', activeBg: 'rgba(251,191,36,0.18)'  },
  carburant:  { text: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: '#34d399', activeBg: 'rgba(52,211,153,0.18)'  },
  croissance: { text: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: '#f472b6', activeBg: 'rgba(244,114,182,0.18)' },
}

const navSections: NavSection[] = [
  {
    id: 'brain',
    icon: '🧠',
    label: 'Brain',
    items: [
      { icon: '🧠', label: 'Business Brain',      href: '/chat',    isPro: true  },
      { icon: '👤', label: 'Mon Profil Business', href: '/profile', isPro: false },
      { icon: '🤖', label: 'Agents IA',           href: '/agents',  isPro: true  },
    ],
  },
  {
    id: 'focus',
    icon: '🎯',
    label: 'Focus',
    items: [
      { icon: '⚡', label: "Aujourd'hui", href: '/focus',    isPro: false },
      { icon: '📋', label: 'Tâches',       href: '/tasks',    isPro: false },
      { icon: '👥', label: 'Pipeline',     href: '/pipeline', isPro: false },
    ],
  },
  {
    id: 'carburant',
    icon: '⛽',
    label: 'Carburant',
    items: [
      { icon: '📄', label: 'Devis & Factures', href: '/invoices', isPro: false },
      { icon: '💰', label: 'Cash',              href: '/cash',     isPro: false },
      { icon: '📊', label: 'Rapports',          href: '/reports',  isPro: false },
    ],
  },
  {
    id: 'croissance',
    icon: '🚀',
    label: 'Croissance',
    items: [
      { icon: '📣', label: 'Contenu LinkedIn',  href: '/content',          isPro: true  },
      { icon: '🤝', label: 'Agent Commercial',   href: '/agent-cro',        isPro: true  },
      { icon: '📣', label: 'Agent Marketing',     href: '/agent-cmo',        isPro: true  },
    ],
  },
]

interface SidebarProps {
  userEmail?: string
  userInitials?: string
  plan?: string
}

export default function Sidebar({
  userEmail = 'user@example.com',
  userInitials = 'U',
  plan = 'FREE',
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  // All sections open by default
  const [openSections, setOpenSections] = useState<string[]>(['brain', 'focus', 'carburant', 'croissance'])
  // E1.3 — Brain active state
  const [brainScore, setBrainScore] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    fetch('/api/user/enrichment')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.score) setBrainScore(d.score) })
      .catch(() => null)
  }, [])

  function toggleSection(id: string) {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

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
        {!collapsed ? (
          <BrainloLogo size={30} showText={true} collapsed={false} textSize="15px" />
        ) : (
          <BrainloLogo size={30} showText={false} />
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

      {/* Navigation — 3 blocs accordéon */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-1.5" aria-label="Navigation principale">
        {navSections.map((section) => {
          const colors = sectionColors[section.id]
          const isOpen = openSections.includes(section.id)
          const sectionIsActive = section.items.some(
            (item) => pathname === item.href || pathname.startsWith(item.href + '/')
          )

          if (collapsed) {
            // Collapsed mode: icon pill per section
            return (
              <div key={section.id} className="flex flex-col items-center gap-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-label={item.label}
                      title={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150"
                      style={{
                        backgroundColor: isActive ? colors.activeBg : 'transparent',
                        borderLeft: isActive ? `2px solid ${colors.border}` : '2px solid transparent',
                      }}
                    >
                      <span className="text-base">{item.icon}</span>
                    </Link>
                  )
                })}
                <div className="w-6 border-b border-[#2a2a42] my-1" />
              </div>
            )
          }

          return (
            <div key={section.id}>
              {/* Section header — accordion toggle */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 transition-all duration-150 group"
                style={{ backgroundColor: sectionIsActive ? colors.bg : 'rgba(255,255,255,0.03)' }}
                aria-expanded={isOpen}
              >
                <span className="text-sm">{section.icon}</span>
                <span
                  className="flex-1 text-left text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: colors.text }}
                >
                  {section.label}
                </span>
                {/* E1.3 — Brain active badge */}
                {section.id === 'brain' && brainScore > 50 && (
                  <span
                    title="Ton Business Brain est actif"
                    className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 shadow-[0_0_4px_rgba(74,222,128,0.8)]"
                  />
                )}
                {/* Chevron */}
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ color: colors.text, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Section items */}
              {isOpen && (
                <div className="space-y-0.5 mb-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ml-2"
                        style={{
                          backgroundColor: isActive ? colors.activeBg : 'transparent',
                          borderLeft: isActive
                            ? `2px solid ${colors.border}`
                            : '2px solid transparent',
                          color: isActive ? colors.text : '#6b7280',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = colors.text
                            e.currentTarget.style.backgroundColor = colors.bg
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = '#6b7280'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <span className="text-base flex-shrink-0">{item.icon}</span>
                        <span className="truncate flex-1">{item.label}</span>
                        {item.isPro && plan === 'FREE' && (
                          <ProBadge collapsed={false} />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Paramètres — séparé en bas */}
        <div className="pt-3 border-t border-[#2a2a42]">
          <Link
            href="/settings"
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            className={[
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
              pathname.startsWith('/settings')
                ? 'bg-[#1e1e30] text-[#818cf8] border-l-2 border-[#818cf8]'
                : 'text-[#4a4a6a] hover:bg-[#1e1e30] hover:text-[#818cf8] border-l-2 border-transparent',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
            title={collapsed ? 'Paramètres' : undefined}
          >
            <span className="text-base flex-shrink-0">⚙️</span>
            {!collapsed && <span className="truncate flex-1">Paramètres</span>}
          </Link>
          <Link
            href="/wiki"
            aria-current={pathname.startsWith('/wiki') ? 'page' : undefined}
            className={[
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
              pathname.startsWith('/wiki')
                ? 'bg-[#1e1e30] text-[#818cf8] border-l-2 border-[#818cf8]'
                : 'text-[#4a4a6a] hover:bg-[#1e1e30] hover:text-[#818cf8] border-l-2 border-transparent',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
            title={collapsed ? 'Aide' : undefined}
          >
            <span className="text-base flex-shrink-0">❓</span>
            {!collapsed && <span className="truncate flex-1">Aide</span>}
          </Link>
        </div>
      </nav>

      {/* User info + Logout */}
      <div className="px-2 py-3 border-t border-[#2a2a42] space-y-1">
        <div
          className={[
            'flex items-center gap-3 rounded-lg px-2 py-2',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
        >
          <div
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
          >
            {userInitials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6b7280] truncate">{userEmail}</p>
              <p className="text-[10px] font-semibold" style={{ color: plan === 'PRO' ? '#fbbf24' : '#4a4a6a' }}>
                {plan}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className={[
            'flex items-center gap-2 rounded-lg text-xs text-[#4a4a6a] hover:text-red-400 hover:bg-[#1e1e30] transition-colors',
            collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2',
          ].join(' ')}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>{loggingOut ? 'Déconnexion…' : 'Se déconnecter'}</span>}
        </button>
      </div>
    </aside>
  )
}