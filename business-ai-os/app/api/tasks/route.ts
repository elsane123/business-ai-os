import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/tasks — liste toutes les tâches de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')      // TODO | IN_PROGRESS | DONE | CANCELLED | all
    const category = searchParams.get('category')  // CASH | CLIENTS | VISIBILITY | ADMIN | all
    const priority = searchParams.get('priority')  // HIGH | MEDIUM | LOW | all
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = { userId: user.userId }
    if (status && status !== 'all') where.status = status
    if (category && category !== 'all') where.category = category
    if (priority && priority !== 'all') where.priority = priority

    const tasks = await prisma.task.findMany({
      where,
      include: {
        linkedProspect: {
          select: { id: true, name: true, company: true, status: true, value: true }
        }
      },
      orderBy: [
        { aiPriorityScore: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/tasks — crée une nouvelle tâche
export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      title,
      description,
      category = 'ADMIN',
      estimatedMinutes,
      dueDate,
      linkedProspectId,
      linkedInvoiceId,
      isRecurring = false,
      recurrenceType,
      recurrenceLabel,
      parentTaskId
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }

    const validCategories = ['CASH', 'CLIENTS', 'VISIBILITY', 'ADMIN', 'AUTRE']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        userId: user.userId,
        title: title.trim(),
        description: description?.trim() || null,
        category,
        status: 'TODO',
        priority: 'MEDIUM',
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        linkedProspectId: linkedProspectId || null,
        linkedInvoiceId: linkedInvoiceId || null,
        isRecurring,
        recurrenceType: recurrenceType || null,
        recurrenceLabel: recurrenceLabel || null,
        parentTaskId: parentTaskId || null
      },
      include: {
        linkedProspect: {
          select: { id: true, name: true, company: true, status: true, value: true }
        }
      }
    })

    // Émettre un WikiEvent pour l'ingestion
    await prisma.wikiEvent.create({
      data: {
        userId: user.userId,
        eventType: 'task_created',
        data: JSON.stringify({
          taskId: task.id,
          title: task.title,
          category: task.category,
          linkedProspectId: task.linkedProspectId
        })
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
