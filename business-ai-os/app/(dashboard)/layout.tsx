import Sidebar from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import UpgradeBanner from '@/components/ui/UpgradeBanner'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  const userEmail = session?.email ?? 'user@example.com'
  const userInitials = session?.name
    ? session.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail[0]?.toUpperCase() ?? 'U'

  // Lire le plan depuis la DB (et non le JWT qui peut être obsolète après un upgrade)
  let plan = 'FREE'
  if (session?.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { plan: true },
      })
      plan = user?.plan ?? 'FREE'
    } catch {
      plan = session?.plan ?? 'FREE'
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0f0f1a]">
      <Sidebar userEmail={userEmail} userInitials={userInitials} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <UpgradeBanner plan={plan} />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
