import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { execSync } from 'child_process'
import path from 'path'

export const dynamic = 'force-dynamic'

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function fmtNum(n: number) {
  return n.toLocaleString('fr-FR')
}

export default async function AdminDashboardPage() {
  await requireAdmin()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalUsers, proUsers, newThisWeek, newThisMonth, suspendedUsers, aiUsageMonth, storageStats, recentUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: 'PRO' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.aIUsage.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { totalTokens: true, estimatedCostUsd: true },
        _count: true,
      }),
      prisma.knowledgeDocument.aggregate({
        _sum: { size: true },
        _count: true,
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, plan: true, createdAt: true },
      }),
    ])

  let wikiDiskBytes = 0
  try {
    const wikiPath = path.join(process.cwd(), 'wiki-data')
    const result = execSync(`du -sb "${wikiPath}" 2>/dev/null || echo 0`).toString().trim()
    wikiDiskBytes = parseInt(result.split('\t')[0] ?? '0', 10)
  } catch { wikiDiskBytes = 0 }

  const freeUsers = totalUsers - proUsers
  const proRate = totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0

  const kpis = [
    { label: 'Utilisateurs total', value: fmtNum(totalUsers), sub: `+${newThisWeek} cette semaine`, color: 'indigo' },
    { label: 'Abonnés PRO', value: fmtNum(proUsers), sub: `${proRate}% de conversion`, color: 'emerald' },
    { label: 'Comptes FREE', value: fmtNum(freeUsers), sub: `${totalUsers - proUsers} non convertis`, color: 'yellow' },
    { label: 'Nouveaux ce mois', value: fmtNum(newThisMonth), sub: `+${newThisWeek} ces 7 jours`, color: 'blue' },
    { label: 'Tokens IA (mois)', value: fmtNum(aiUsageMonth._sum.totalTokens ?? 0), sub: `${aiUsageMonth._count} requêtes`, color: 'purple' },
    { label: 'Coût IA (mois)', value: `$${(aiUsageMonth._sum.estimatedCostUsd ?? 0).toFixed(2)}`, sub: 'OpenRouter', color: 'pink' },
    { label: 'Stockage docs', value: fmt(storageStats._sum.size ?? 0), sub: `${storageStats._count} fichiers`, color: 'cyan' },
    { label: 'Stockage wiki', value: fmt(wikiDiskBytes), sub: 'wiki-data/ sur disque', color: 'teal' },
  ]

  const colorMap: Record<string, string> = {
    indigo: 'border-indigo-500/30 bg-indigo-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    pink: 'border-pink-500/30 bg-pink-500/5',
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
    teal: 'border-teal-500/30 bg-teal-500/5',
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">📊 Dashboard Admin</h1>
        <p className="text-sm text-white/40 mt-1">
          {suspendedUsers > 0 && (
            <span className="text-red-400">{suspendedUsers} compte(s) suspendu(s) · </span>
          )}
          Mis à jour en temps réel
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border p-5 ${colorMap[kpi.color]}`}
          >
            <p className="text-xs text-white/40 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{kpi.value}</p>
            <p className="text-xs text-white/50 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution bar */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold text-white/70 mb-4">Répartition des plans</h2>
        <div className="flex rounded-full overflow-hidden h-4">
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${proRate}%` }}
            title={`PRO: ${proUsers}`}
          />
          <div
            className="bg-white/10 flex-1"
            title={`FREE: ${freeUsers}`}
          />
        </div>
        <div className="flex gap-6 mt-3 text-xs text-white/50">
          <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1" />PRO: {proUsers} ({proRate}%)</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-white/20 mr-1" />FREE: {freeUsers} ({100 - proRate}%)</span>
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold text-white/70 mb-4">Dernières inscriptions</h2>
        <div className="space-y-3">
          {recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">{u.name}</p>
                <p className="text-xs text-white/40">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.plan === 'PRO'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {u.plan}
                </span>
                <span className="text-xs text-white/30">
                  {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
        <a
          href="/admin/users"
          className="mt-4 inline-block text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Voir tous les utilisateurs →
        </a>
      </div>
    </div>
  )
}
