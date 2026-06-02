import { prisma } from '@/lib/db'
import { getBrainContext } from '@/lib/brain-context'

/**
 * Fetches domain-specific business data for each agent
 * and returns a formatted string to inject into the system prompt.
 * All agents receive the unified Brain context as a header.
 */
export async function getAgentContext(agentId: string, userId: string): Promise<string> {
  try {
    const [brain, agentSpecific] = await Promise.all([
      getBrainContext(userId),
      (async () => {
        switch (agentId) {
          case 'agent-cfo':    return await getCFOContext(userId)
          case 'agent-cro':    return await getCROContext(userId)
          case 'agent-cmo':    return await getCMOContext(userId)
          case 'agent-legal':  return await getLegalContext(userId)
          case 'agent-chro':   return await getCHROContext(userId)
          case 'agent-ops':    return await getOpsContext(userId)
          case 'agent-coach':  return await getCoachContext(userId)
          default:             return ''
        }
      })()
    ])
    return [brain, agentSpecific].filter(Boolean).join('\n\n---\n\n')
  } catch {
    return '' // never block the chat if context fetch fails
  }
}

// ─── CFO : Finance & Trésorerie ────────────────────────────────────────────
async function getCFOContext(userId: string): Promise<string> {
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const [user, transactions, unpaidInvoices] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true, sector: true, monthlyGoal: true, fixedCharges: true,
                urssafRate: true, activityType: true, legalForm: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: since90 } },
      select: { amount: true, type: true, category: true, date: true },
      orderBy: { date: 'desc' },
    }),
    prisma.invoice.findMany({
      where: { userId, status: { in: ['SENT', 'OVERDUE'] } },
      select: { number: true, totalTTC: true, status: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
      take: 20,
    }),
  ])

  const totalIncome  = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  // Group expenses by category
  const byCategory: Record<string, number> = {}
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  })
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `  - ${cat}: ${amt.toFixed(2)}€`)
    .join('\n')

  const unpaidLines = unpaidInvoices
    .map(inv => `  - ${inv.number} : ${inv.totalTTC.toFixed(2)}€ [${inv.status}]${inv.dueDate ? ' échéance ' + inv.dueDate.toISOString().split('T')[0] : ''}`)
    .join('\n') || '  Aucune'

  return `

## Données financières réelles de l'utilisateur (90 derniers jours)
- Entreprise : ${user?.businessName ?? 'Non renseigné'} | Secteur : ${user?.sector ?? 'Non renseigné'}
- Forme juridique : ${user?.legalForm ?? 'Non renseigné'} | Activité : ${user?.activityType ?? 'Non renseigné'}
- Objectif mensuel : ${user?.monthlyGoal ?? 0}€ | Charges fixes : ${user?.fixedCharges ?? 0}€/mois
- Taux URSSAF : ${user?.urssafRate ?? 0}%

### Flux financiers (90j)
- Encaissements (INCOME) : ${totalIncome.toFixed(2)}€
- Décaissements (EXPENSE) : ${totalExpense.toFixed(2)}€
- Solde net : ${(totalIncome - totalExpense).toFixed(2)}€

### Principales charges par catégorie
${topCategories || '  Aucune donnée'}

### Factures impayées
${unpaidLines}`
}

// ─── CRO : Commercial & Pipeline ───────────────────────────────────────────
async function getCROContext(userId: string): Promise<string> {
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const [user, prospects] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true, sector: true },
    }),
    prisma.prospect.findMany({
      where: { userId },
      select: { name: true, company: true, status: true, value: true,
                lastContactDate: true, lostReason: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const active = prospects.filter(p => !['WON', 'LOST'].includes(p.status))
  const won90  = prospects.filter(p => p.status === 'WON' && p.createdAt >= since90)
  const lost90 = prospects.filter(p => p.status === 'LOST' && p.createdAt >= since90)

  const pipelineValue = active.reduce((s, p) => s + p.value, 0)
  const wonValue      = won90.reduce((s, p) => s + p.value, 0)

  const activeLines = active
    .slice(0, 15)
    .map(p => `  - ${p.name}${p.company ? ' (' + p.company + ')' : ''} | ${p.status} | ${p.value}€${p.lastContactDate ? ' | dernier contact: ' + p.lastContactDate.toISOString().split('T')[0] : ''}`)
    .join('\n') || '  Aucun prospect actif'

  return `

## Données commerciales réelles de l'utilisateur
- Entreprise : ${user?.businessName ?? 'Non renseigné'} | Secteur : ${user?.sector ?? 'Non renseigné'}

### Pipeline actif (${active.length} prospects, valeur totale : ${pipelineValue.toFixed(2)}€)
${activeLines}

### Performance 90 derniers jours
- Deals gagnés : ${won90.length} (${wonValue.toFixed(2)}€)
- Deals perdus : ${lost90.length}${lost90[0]?.lostReason ? ' — raison principale : ' + lost90[0].lostReason : ''}`
}

// ─── CMO : Marketing & Contenu LinkedIn ────────────────────────────────────
async function getCMOContext(userId: string): Promise<string> {
  const [user, posts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true, sector: true, linkedinUrl: true },
    }),
    prisma.linkedInPost.findMany({
      where: { userId },
      select: { content: true, postType: true, status: true,
                impressions: true, engagement: true, publishedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const published = posts.filter(p => p.status === 'PUBLISHED')
  const avgImpres = published.length
    ? Math.round(published.reduce((s, p) => s + p.impressions, 0) / published.length)
    : 0
  const avgEngag  = published.length
    ? Math.round(published.reduce((s, p) => s + p.engagement, 0) / published.length)
    : 0

  const postLines = posts
    .map(p => `  - [${p.status}] ${p.postType} | "${p.content.slice(0, 80).replace(/\n/g, ' ')}..."${p.impressions ? ' | ' + p.impressions + ' vues, ' + p.engagement + ' eng.' : ''}`)
    .join('\n') || '  Aucun post'

  return `

## Données marketing réelles de l'utilisateur
- Entreprise : ${user?.businessName ?? 'Non renseigné'} | Secteur : ${user?.sector ?? 'Non renseigné'}
- LinkedIn : ${user?.linkedinUrl ?? 'Non renseigné'}

### Derniers posts LinkedIn (${posts.length} posts)
${postLines}

### Statistiques globales LinkedIn
- Posts publiés : ${published.length}
- Impressions moyennes : ${avgImpres}
- Engagement moyen : ${avgEngag}`
}

// ─── Juridique : Structure légale & Facturation ─────────────────────────────
async function getLegalContext(userId: string): Promise<string> {
  const [user, invoiceStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true, legalForm: true, legalName: true, siret: true,
                vatNumber: true, shareCapital: true, address: true, city: true,
                zipCode: true, country: true, activityType: true, paymentTerms: true,
                tvaThreshold: true },
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    }),
  ])

  const statusCounts = invoiceStats
    .map(s => `  - ${s.status} : ${s._count}`)
    .join('\n') || '  Aucune facture'

  return `

## Données juridiques et légales de l'utilisateur
- Entreprise : ${user?.businessName ?? 'Non renseigné'}
- Raison sociale : ${user?.legalName ?? 'Non renseigné'}
- Forme juridique : ${user?.legalForm ?? 'Non renseigné'}
- Type d'activité : ${user?.activityType ?? 'Non renseigné'}
- SIRET : ${user?.siret ?? 'Non renseigné'}
- N° TVA : ${user?.vatNumber ?? 'Non assujetti'}
- Capital social : ${user?.shareCapital ?? 'N/A'}
- Adresse : ${[user?.address, user?.zipCode, user?.city, user?.country].filter(Boolean).join(', ') || 'Non renseignée'}
- Délai de paiement contractuel : ${user?.paymentTerms ?? 30} jours
- Seuil franchise TVA : ${user?.tvaThreshold ?? 36800}€/an

### Statut des factures
${statusCounts}`
}

// ─── CHRO : RH & Organisation ───────────────────────────────────────────────
async function getCHROContext(userId: string): Promise<string> {
  const now = new Date()

  const [user, tasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true, sector: true, activityType: true, legalForm: true },
    }),
    prisma.task.findMany({
      where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
      select: { title: true, category: true, status: true, priority: true, dueDate: true },
      orderBy: { priority: 'desc' },
    }),
  ])

  const overdue    = tasks.filter(t => t.dueDate && t.dueDate < now)
  const byCategory: Record<string, number> = {}
  tasks.forEach(t => { byCategory[t.category] = (byCategory[t.category] ?? 0) + 1 })

  const categoryLines = Object.entries(byCategory)
    .map(([cat, count]) => `  - ${cat} : ${count} tâche(s)`)
    .join('\n') || '  Aucune'

  return `

## Données RH et organisation de l'utilisateur
- Entreprise : ${user?.businessName ?? 'Non renseigné'} | Secteur : ${user?.sector ?? 'Non renseigné'}
- Forme juridique : ${user?.legalForm ?? 'Non renseigné'} | Activité : ${user?.activityType ?? 'Non renseigné'}

### Charge de travail actuelle
- Tâches ouvertes (TODO + IN_PROGRESS) : ${tasks.length}
- Tâches en retard : ${overdue.length}

### Répartition par catégorie
${categoryLines}`
}

// ─── Ops : Opérations & Tâches ─────────────────────────────────────────────
async function getOpsContext(userId: string): Promise<string> {
  const now     = new Date()
  const since7  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [tasks, recentDone] = await Promise.all([
    prisma.task.findMany({
      where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
      select: { title: true, category: true, status: true, priority: true, dueDate: true, estimatedMinutes: true },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
      take: 20,
    }),
    prisma.task.findMany({
      where: { userId, status: 'DONE', updatedAt: { gte: since7 } },
      select: { title: true, category: true },
      take: 10,
    }),
  ])

  const overdue  = tasks.filter(t => t.dueDate && t.dueDate < now)
  const high     = tasks.filter(t => t.priority === 'HIGH')

  const taskLines = tasks
    .map(t => `  - [${t.priority}] ${t.title} | ${t.category} | ${t.status}${t.dueDate ? ' | échéance: ' + t.dueDate.toISOString().split('T')[0] : ''}${t.estimatedMinutes ? ' | ~' + t.estimatedMinutes + 'min' : ''}`)
    .join('\n') || '  Aucune tâche'

  const doneLines = recentDone
    .map(t => `  - ${t.title} [${t.category}]`)
    .join('\n') || '  Aucune'

  return `

## Données opérationnelles de l'utilisateur

### Tâches en cours (${tasks.length} ouvertes)
- Priorité haute : ${high.length}
- En retard : ${overdue.length}

${taskLines}

### Tâches complétées (7 derniers jours)
${doneLines}`
}

// ─── Coach : Stratégie & Vision globale ─────────────────────────────────────
async function getCoachContext(userId: string): Promise<string> {
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [user, transactions, prospects, tasks] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true, sector: true, legalForm: true, activityType: true,
                monthlyGoal: true, fixedCharges: true, urssafRate: true, city: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: since90 } },
      select: { amount: true, type: true },
    }),
    prisma.prospect.findMany({
      where: { userId },
      select: { status: true, value: true, createdAt: true },
    }),
    prisma.task.findMany({
      where: { userId, updatedAt: { gte: since30 } },
      select: { status: true },
    }),
  ])

  const revenue  = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  const pipelineByStatus: Record<string, { count: number; value: number }> = {}
  prospects.forEach(p => {
    if (!pipelineByStatus[p.status]) pipelineByStatus[p.status] = { count: 0, value: 0 }
    pipelineByStatus[p.status].count++
    pipelineByStatus[p.status].value += p.value
  })
  const pipelineLines = Object.entries(pipelineByStatus)
    .map(([s, d]) => `  - ${s} : ${d.count} (${d.value.toFixed(0)}€)`)
    .join('\n') || '  Aucun'

  const tasksDone  = tasks.filter(t => t.status === 'DONE').length
  const tasksTotal = tasks.length
  const completion = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0

  const monthlyGoal = user?.monthlyGoal ?? 0
  const monthRevenue = revenue / 3 // average over 3 months
  const goalPct = monthlyGoal ? Math.round((monthRevenue / monthlyGoal) * 100) : 0

  return `

## Vue d'ensemble business (données réelles) — contexte coaching
- Entreprise : ${user?.businessName ?? 'Non renseigné'} | Secteur : ${user?.sector ?? 'Non renseigné'}
- Localisation : ${user?.city ?? 'Non renseigné'}
- Forme juridique : ${user?.legalForm ?? 'Non renseigné'} | Activité : ${user?.activityType ?? 'Non renseigné'}
- Objectif mensuel : ${monthlyGoal}€ | Charges fixes : ${user?.fixedCharges ?? 0}€

### Performance financière (90j)
- CA encaissé : ${revenue.toFixed(2)}€ (~${monthRevenue.toFixed(0)}€/mois)
- Charges : ${expenses.toFixed(2)}€
- Marge nette : ${(revenue - expenses).toFixed(2)}€
- Atteinte objectif mensuel : ${goalPct}%

### Pipeline commercial
${pipelineLines}

### Productivité (30 derniers jours)
- Tâches complétées : ${tasksDone}/${tasksTotal} (${completion}%)`
}