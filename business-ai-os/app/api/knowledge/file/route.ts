import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const WIKI_BASE = process.env.WIKI_BASE_PATH || join(process.cwd(), 'wiki-data')

const MIME_TYPES: Record<string, string> = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt:  'text/plain; charset=utf-8',
  md:   'text/markdown; charset=utf-8',
}

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const doc = await prisma.knowledgeDocument.findFirst({
    where: { id, userId: user.userId }
  })
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // 1. Essayer le fichier original sauvegardé
  const origPath = join(WIKI_BASE, user.userId, 'files', `${doc.id}.${doc.fileType}`)
  if (existsSync(origPath)) {
    const buffer = await readFile(origPath)
    const mime = MIME_TYPES[doc.fileType] ?? 'application/octet-stream'
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `inline; filename="${doc.fileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      }
    })
  }

  // 2. Fallback : servir le texte extrait (markdown)
  if (doc.textPath && existsSync(doc.textPath)) {
    const buffer = await readFile(doc.textPath)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `inline; filename="${doc.name}.txt"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      }
    })
  }

  return NextResponse.json({ error: 'Fichier non disponible' }, { status: 404 })
}
