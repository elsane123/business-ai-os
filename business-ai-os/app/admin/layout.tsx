import { requireAdmin } from '@/lib/admin-auth'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const metadata = { title: 'Admin — Brainlo' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  const session = await getSession()

  return (
    <div className="flex min-h-screen bg-[#0a0a14] text-white">
      {/* Sidebar admin */}
      <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-indigo-400">🛡️ Admin</span>
          </div>
          <p className="text-xs text-white/40 mt-1 truncate">{session?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/admin" label="📊 Dashboard" />
          <NavLink href="/admin/users" label="👤 Utilisateurs" />
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            ← Retour app
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
    >
      {label}
    </Link>
  )
}
