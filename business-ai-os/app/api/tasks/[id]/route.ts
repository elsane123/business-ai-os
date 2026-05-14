import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// PATCH /api/tasks/[id] — met à jour une tâche
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const task = await prisma.task.findFirst({
      where: { id: params.id, userId: user.userId }
    })
    if (!task) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })

    const body = await req.json()
    const {
      title,
      description,
      category,
      status,
      priority,
      estimatedMinutes,
      dueDate,
      linkedProspectId,
      linkedInvoiceId,
      isRecurring,
      recurrenceType,
      recurrenceLabel
    } = body

    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (category !== undefined) updateData.category = category
    if (priority !== undefined) updateData.priority = priority
    if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes ? parseInt(estimatedMinutes) : null
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (linkedProspectId !== undefined) updateData.linkedProspectId = linkedProspectId || null
    if (linkedInvoiceId !== undefined) updateData.linkedInvoiceId = linkedInvoiceId || null
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring
    if (recurrenceType !== undefined) updateData.recurrenceType = recurrenceType || null
    if (recurrenceLabel !== undefined) updateData.recurrenceLabel = recurrenceLabel || null

    // Gestion du changement de statut
    if (status !== undefined) {
      updateData.status = status
      if (status === 'DONE') {
        updateData.completedAt = new Date()
        // WikiEvent : tâche complétée
        await prisma.wikiEvent.create({
          data: {
            userId: user.userId,
            eventType: 'task_completed',
            data: JSON.stringify({
              taskId: task.id,
              title: task.title,
              category: task.category,
              linkedProspectId: task.linkedProspectId,
              completedAt: new Date().toISOString()
            })
          }
        })
      } else if (task.status === 'DONE' && status !== 'DONE') {
        updateData.completedAt = null
      }
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        linkedProspect: {
          select: { id: true, name: true, company: true, status: true, value: true }
        }
      }
    })

    return NextResponse.json({ task: updated })
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] — supprime une tâche
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const task = await prisma.task.findFirst({
      where: { id: params.id, userId: user.userId }
    })
    if (!task) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })

    await prisma.task.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
