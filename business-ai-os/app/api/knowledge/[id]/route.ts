import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const WIKI_BASE = process.env.WIKI_BASE_PATH || join(process.cwd(), 'wiki-data')

type RouteContext = { params: { id: string } }

// GET /api/knowledge/:id — récupérer un document
export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: params.id, userId: user.userId },
    })

    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    return NextResponse.json({ document: doc })
  } catch (error) {
    console.error('[knowledge/[id] GET]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// DELETE /api/knowledge/:id — supprimer un document
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Vérifier que le document appartient à l'utilisateur
    const doc = await prisma.knowledgeDocument.findFirst({
      where: { id: params.id, userId: user.userId },
    })

    if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

    // Supprimer le fichier physique si présent
    const filePath = join(WIKI_BASE, user.userId, 'files', doc.fileName)
    if (existsSync(filePath)) {
      try {
        await unlink(filePath)
      } catch (e) {
        console.warn('[knowledge/[id] DELETE] Could not delete file:', e)
      }
    }

    // Supprimer le fichier de contenu extrait si présent
    const contentPath = join(WIKI_BASE, user.userId, 'knowledge', `${params.id}.md`)
    if (existsSync(contentPath)) {
      try {
        await unlink(contentPath)
      } catch (e) {
        console.warn('[knowledge/[id] DELETE] Could not delete content file:', e)
      }
    }

    // Supprimer l'entrée en base de données
    await prisma.knowledgeDocument.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, deleted: params.id })
  } catch (error) {
    console.error('[knowledge/[id] DELETE]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
