import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/tasks/prioritize — déclenche la priorisation IA via le microservice Python
export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = user.userId

    // Récupérer les données utilisateur complètes
    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyGoal: true }
    })

    // Récupérer les tâches actives
    const tasks = await prisma.task.findMany({
      where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
      include: {
        linkedProspect: {
          select: { id: true, name: true, company: true, status: true, value: true, lastContactDate: true }
        }
      }
    })

    if (tasks.length === 0) {
      return NextResponse.json({ message: 'Aucune tâche active à prioriser', tasks: [] })
    }

    // Récupérer contexte business
    const [transactions, prospects, invoices] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30
      }),
      prisma.prospect.findMany({
        where: { userId, status: { notIn: ['WON', 'LOST'] } },
        orderBy: { lastContactDate: 'asc' }
      }),
      prisma.invoice.findMany({
        where: { userId, status: { in: ['SENT', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' }
      })
    ])

    // Calculer solde
    const cashBalance = transactions.reduce((sum, t) => {
      return sum + (t.type === 'INCOME' ? t.amount : -t.amount)
    }, 0)

    // Appel microservice Python
    const pythonUrl = process.env.PYTHON_AGENT_URL || 'http://localhost:8000'
    const response = await fetch(`${pythonUrl}/tasks/prioritize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          status: t.status,
          estimated_minutes: t.estimatedMinutes,
          due_date: t.dueDate?.toISOString() || null,
          linked_prospect: t.linkedProspect ? {
            name: t.linkedProspect.name,
            company: t.linkedProspect.company,
            status: t.linkedProspect.status,
            value: t.linkedProspect.value,
            last_contact_date: t.linkedProspect.lastContactDate?.toISOString() || null
          } : null,
          linked_invoice_id: t.linkedInvoiceId
        })),
        context: {
          cash_balance: cashBalance,
          monthly_goal: fullUser?.monthlyGoal ?? 0,
          hot_prospects: prospects.slice(0, 5).map(p => ({
            name: p.name,
            status: p.status,
            value: p.value,
            days_since_contact: p.lastContactDate
              ? Math.floor((Date.now() - p.lastContactDate.getTime()) / 86400000)
              : null
          })),
          overdue_invoices: invoices.map(i => ({
            number: i.number,
            amount: i.totalTTC,
            due_date: i.dueDate?.toISOString() || null,
            status: i.status
          }))
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Python agent error: ${response.status}`)
    }

    const { results } = await response.json()

    // Mettre à jour les scores en base
    await Promise.all(
      results.map((r: { task_id: string; score: number; priority: string; reason: string }) =>
        prisma.task.update({
          where: { id: r.task_id },
          data: {
            aiPriorityScore: r.score,
            priority: r.priority,
            aiReason: r.reason
          }
        })
      )
    )

    // Relire les tâches mises à jour
    const updatedTasks = await prisma.task.findMany({
      where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
      include: {
        linkedProspect: {
          select: { id: true, name: true, company: true, status: true, value: true }
        }
      },
      orderBy: [{ aiPriorityScore: 'desc' }, { dueDate: 'asc' }]
    })

    return NextResponse.json({ tasks: updatedTasks, prioritized: results.length })
  } catch (error) {
    console.error('POST /api/tasks/prioritize error:', error)
    return NextResponse.json({ error: 'Erreur lors de la priorisation IA' }, { status: 500 })
  }
}
