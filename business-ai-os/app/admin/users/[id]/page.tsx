'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type UserDetail = {
  id: string
  email: string
  name: string
  businessName: string | null
  sector: string | null
  plan: string
  isAdmin: boolean
  isSuspended: boolean
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
  stripeCustomerId: string | null
  linkedinUrl: string | null
  legalName: string | null
  city: string | null
  country: string | null
  activityType: string | null
  _count: {
    transactions: number
    prospects: number
    tasks: number
    invoices: number
    quotes: number
    posts: number
    knowledgeDocs: number
    aiUsages: number
    chatMessages: number
  }
}

type AIFeatureStat = {
  feature: string
  _sum: { totalTokens: number | null; estimatedCostUsd: number | null }
  _count: number
}

type DetailData = {
  user: UserDetail
  aiUsage: {
    byFeature: AIFeatureStat[]
    last30Days: { tokens: number; costUsd: number }
  }
  storage: {
    documentsBytes: number
    documentsCount: number
    wikiDiskBytes: number
  }
}

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users/${id}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function patchUser(payload: Record<string, unknown>, msg: string) {
    setActionLoading(true)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { showToast(msg); await fetchData() }
    setActionLoading(false)
  }

  async function deleteUser() {
    if (!data) return
    if (!confirm(`Supprimer définitivement ${data.user.email} et toutes ses données ?`)) return
    setActionLoading(true)
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    router.push('/admin/users')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/30">
        Chargement...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <p className="text-red-400">Utilisateur introuvable.</p>
        <Link href="/admin/users" className="text-indigo-400 text-sm mt-4 inline-block">← Retour</Link>
      </div>
    )
  }

  const { user, aiUsage, storage } = data
  const totalAiTokens = aiUsage.byFeature.reduce((s, f) => s + (f._sum.totalTokens ?? 0), 0)
  const totalAiCost = aiUsage.byFeature.reduce((s, f) => s + (f._sum.estimatedCostUsd ?? 0), 0)

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/users" className="text-xs text-white/40 hover:text-white/70 transition-colors">← Utilisateurs</Link>
          <h1 className="text-2xl font-bold text-white mt-2">{user.name}</h1>
          <p className="text-sm text-white/50">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              user.plan === 'PRO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'
            }`}>{user.plan}</span>
            {user.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">🛡️ Admin</span>}
            {user.isSuspended && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">⛔ Suspendu</span>}
          </div>
        </div>

        {/* Action buttons */}
        {!user.isAdmin && (
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              disabled={actionLoading}
              onClick={() => patchUser(
                { plan: user.plan === 'PRO' ? 'FREE' : 'PRO' },
                `Plan changé en ${user.plan === 'PRO' ? 'FREE' : 'PRO'}`
              )}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-40"
            >
              {user.plan === 'PRO' ? '↓ Rétrograder FREE' : '↑ Upgrader PRO'}
            </button>
            <button
              disabled={actionLoading}
              onClick={() => patchUser(
                { isSuspended: !user.isSuspended },
                user.isSuspended ? 'Compte réactivé' : 'Compte suspendu'
              )}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                user.isSuspended
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
              }`}
            >
              {user.isSuspended ? '✓ Réactiver' : '⊘ Suspendre'}
            </button>
            <button
              disabled={actionLoading}
              onClick={deleteUser}
              className="text-sm px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40"
            >
              🗑 Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h2 className="text-white/50 font-medium text-xs uppercase tracking-wider">Informations</h2>
          <Row label="Entreprise" value={user.businessName} />
          <Row label="Secteur" value={user.sector} />
          <Row label="Ville" value={user.city} />
          <Row label="Pays" value={user.country} />
          <Row label="Type activité" value={user.activityType} />
          <Row label="Stripe ID" value={user.stripeCustomerId} mono />
          <Row label="Inscrit le" value={new Date(user.createdAt).toLocaleDateString('fr-FR')} />
          <Row label="Dernière MAJ" value={new Date(user.updatedAt).toLocaleDateString('fr-FR')} />
          {user.lastActiveAt && <Row label="Dernière activité" value={new Date(user.lastActiveAt).toLocaleDateString('fr-FR')} />}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h2 className="text-white/50 font-medium text-xs uppercase tracking-wider">Activité</h2>
          <Row label="Prospects" value={user._count.prospects} />
          <Row label="Transactions" value={user._count.transactions} />
          <Row label="Tâches" value={user._count.tasks} />
          <Row label="Devis" value={user._count.quotes} />
          <Row label="Factures" value={user._count.invoices} />
          <Row label="Posts LinkedIn" value={user._count.posts} />
          <Row label="Messages chat" value={user._count.chatMessages} />
          <Row label="Docs KB" value={user._count.knowledgeDocs} />
        </div>
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tokens IA (total)" value={totalAiTokens.toLocaleString('fr-FR')} sub={`${aiUsage.byFeature.length} features`} />
        <StatCard label="Coût IA (total)" value={`$${totalAiCost.toFixed(4)}`} sub="OpenRouter" />
        <StatCard label="Tokens (30 jours)" value={aiUsage.last30Days.tokens.toLocaleString('fr-FR')} sub={`$${aiUsage.last30Days.costUsd.toFixed(4)}`} />
        <StatCard label="Stockage total" value={fmt(storage.documentsBytes + storage.wikiDiskBytes)} sub={`${storage.documentsCount} doc(s) + wiki`} />
      </div>

      {/* AI usage breakdown */}
      {aiUsage.byFeature.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-sm font-semibold text-white/70 mb-4">🤖 Usage IA par fonctionnalité</h2>
          <div className="space-y-2">
            {aiUsage.byFeature.map((f) => {
              const tokens = f._sum.totalTokens ?? 0
              const pct = totalAiTokens > 0 ? Math.round((tokens / totalAiTokens) * 100) : 0
              return (
                <div key={f.feature} className="flex items-center gap-4">
                  <span className="text-xs text-white/50 w-32 shrink-0">{f.feature}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-white/40 w-24 text-right">{tokens.toLocaleString('fr-FR')} tok</span>
                  <span className="text-xs text-white/30 w-16 text-right">{f._count} req</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Storage */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-semibold text-white/70 mb-4">💾 Stockage</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-white/40">Documents KB</p>
            <p className="text-white font-medium mt-1">{fmt(storage.documentsBytes)}</p>
            <p className="text-xs text-white/30">{storage.documentsCount} fichier(s)</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Wiki (disque)</p>
            <p className="text-white font-medium mt-1">{fmt(storage.wikiDiskBytes)}</p>
            <p className="text-xs text-white/30">wiki-data/{id}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Total combiné</p>
            <p className="text-white font-medium mt-1">{fmt(storage.documentsBytes + storage.wikiDiskBytes)}</p>
            <p className="text-xs text-white/30">docs + wiki</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string | number | null | undefined
  mono?: boolean
}) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className={`text-white text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}