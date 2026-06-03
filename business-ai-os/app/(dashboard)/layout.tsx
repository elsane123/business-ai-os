import Sidebar from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import UpgradeBanner from '@/components/ui/UpgradeBanner'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const userEmail = session?.email ?? 'user@example.com'

  // BUG-AUTH-02 fix: read name + plan from DB (JWT doesn't carry 'name')
  let plan = 'FREE'
  let userName: string | null = null
  if (session?.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { plan: true, name: true },
      })
      plan = user?.plan ?? 'FREE'
      userName = user?.name ?? null
    } catch {
      plan = session?.plan ?? 'FREE'
    }
  }

  const userInitials = userName
    ? userName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail[0]?.toUpperCase() ?? 'U'

  return (
    <div className="flex min-h-screen bg-[#0f0f1a]">
      {/* Skip navigation — WCAG 2.4.1 */}
      <a href="#main-content" className="skip-nav">
        Aller au contenu principal
      </a>
      <Sidebar userEmail={userEmail} userInitials={userInitials} plan={plan} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <UpgradeBanner plan={plan} />
        <OnboardingChecklist plan={plan} />
        <main id="main-content" className="flex-1 overflow-auto pb-20 md:pb-0" tabIndex={-1}>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
