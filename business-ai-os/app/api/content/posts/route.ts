import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/content/posts — retourne les 20 derniers posts du user
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const posts = await prisma.linkedInPost.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        content: true,
        postType: true,
        status: true,
        topic: true,
        publishedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('[content/posts GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// PATCH /api/content/posts — mettre à jour status ou contenu
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, content } = body

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.linkedInPost.findFirst({
      where: { id, userId: session.userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) {
      updateData.status = status
      if (status === 'PUBLISHED' && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (content !== undefined) updateData.content = content

    const post = await prisma.linkedInPost.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error('[content/posts PATCH]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// DELETE /api/content/posts?id=xxx — supprimer un post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.linkedInPost.findFirst({
      where: { id, userId: session.userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    await prisma.linkedInPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[content/posts DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
