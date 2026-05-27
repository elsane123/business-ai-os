'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type AdminUser = {
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
  stripeCustomerId: string | null
  aiTokens: number
  aiCostUsd: number
  storageBytes: number
  storageDocCount: number
  _count: {
    transactions: number
    prospects: number
    tasks: number
    knowledgeDocs: number
    aiUsages: number
  }
}

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (plan) params.set('plan', plan)
    params.set('page', String(page))
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
      setTotal(data.total)
      setPages(data.pages)
    }
    setLoading(false)
  }, [search, plan, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function patchUser(id: string, data: Record<string, unknown>) {
    setActionLoading(id)
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await fetchUsers()
    setActionLoading(null)
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Supprimer définitivement ${email} et toutes ses données ?`)) return
    setActionLoading(id)
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    await fetchUsers()
    setActionLoading(null)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">👤 Utilisateurs</h1>
          <p className="text-sm text-white/40 mt-1">{total} compte(s) au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Rechercher par email, nom, entreprise..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={plan}
          onChange={(e) => { setPlan(e.target.value); setPage(1) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Tous les plans</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="text-left px-4 py-3 text-white/50 font-medium">Utilisateur</th>
              <th className="text-left px-4 py-3 text-white/50 font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-white/50 font-medium">Activité</th>
              <th className="text-left px-4 py-3 text-white/50 font-medium">Tokens IA</th>
              <th className="text-left px-4 py-3 text-white/50 font-medium">Stockage</th>
              <th className="text-left px-4 py-3 text-white/50 font-medium">Inscrit le</th>
              <th className="text-right px-4 py-3 text-white/50 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-white/30">Chargement...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-white/30">Aucun utilisateur trouvé</td>
              </tr>
            ) : users.map((u) => (
              <tr
                key={u.id}
                className={`hover:bg-white/5 transition-colors ${
                  u.isSuspended ? 'opacity-50' : ''
                }`}
              >
                {/* User */}
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${u.id}`} className="group">
                    <p className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                      {u.name}
                      {u.isAdmin && <span className="ml-2 text-xs text-indigo-400">🛡️ admin</span>}
                      {u.isSuspended && <span className="ml-2 text-xs text-red-400">⛔ suspendu</span>}
                    </p>
                    <p className="text-white/40 text-xs">{u.email}</p>
                    {u.businessName && <p className="text-white/30 text-xs">{u.businessName}</p>}
                  </Link>
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.plan === 'PRO'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-white/50'
                  }`}>
                    {u.plan}
                  </span>
                </td>

                {/* Activity */}
                <td className="px-4 py-3 text-white/50 text-xs">
                  <div className="space-y-0.5">
                    <div>{u._count.prospects} prospects</div>
                    <div>{u._count.transactions} transactions</div>
                    <div>{u._count.tasks} tâches</div>
                  </div>
                </td>

                {/* AI Tokens */}
                <td className="px-4 py-3 text-white/50 text-xs">
                  <div>{u.aiTokens.toLocaleString('fr-FR')} tokens</div>
                  <div className="text-white/30">${u.aiCostUsd.toFixed(3)}</div>
                </td>

                {/* Storage */}
                <td className="px-4 py-3 text-white/50 text-xs">
                  <div>{fmt(u.storageBytes)}</div>
                  <div className="text-white/30">{u.storageDocCount} doc(s)</div>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-white/40 text-xs">
                  {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {actionLoading === u.id ? (
                      <span className="text-xs text-white/30">...</span>
                    ) : (
                      <>
                        {/* Toggle plan */}
                        <button
                          onClick={() => patchUser(u.id, { plan: u.plan === 'PRO' ? 'FREE' : 'PRO' })}
                          title={u.plan === 'PRO' ? 'Rétrograder FREE' : 'Upgrader PRO'}
                          className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        >
                          {u.plan === 'PRO' ? '↓ FREE' : '↑ PRO'}
                        </button>

                        {/* Toggle suspend */}
                        {!u.isAdmin && (
                          <button
                            onClick={() => patchUser(u.id, { isSuspended: !u.isSuspended })}
                            title={u.isSuspended ? 'Réactiver' : 'Suspendre'}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              u.isSuspended
                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                            }`}
                          >
                            {u.isSuspended ? '✓ Réactiver' : '⊘ Suspendre'}
                          </button>
                        )}

                        {/* Detail */}
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        >
                          Voir →
                        </Link>

                        {/* Delete */}
                        {!u.isAdmin && (
                          <button
                            onClick={() => deleteUser(u.id, u.email)}
                            className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            🗑
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded text-sm bg-white/5 text-white/50 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            ← Préc.
          </button>
          <span className="text-sm text-white/40">Page {page} / {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1 rounded text-sm bg-white/5 text-white/50 hover:bg-white/10 disabled:opacity-30 transition-colors"
          >
            Suiv. →
          </button>
        </div>
      )}
    </div>
  )
}
