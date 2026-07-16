import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, unlink, copyFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const PYTHON_URL = process.env.PYTHON_AGENT_URL || 'http://localhost:8000'
const WIKI_BASE = process.env.WIKI_BASE_PATH || join(process.cwd(), 'wiki-data')
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED = ['.pdf', '.docx', '.pptx', '.xlsx', '.txt', '.md']

// GET — liste les documents de l'utilisateur
export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const docs = await prisma.knowledgeDocument.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(docs)
}

// POST — upload et indexation d'un document
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = (formData.get('name') as string) || ''
    const category = (formData.get('category') as string) || 'Général'

    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 })

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED.includes(ext)) return NextResponse.json({ error: `Format non supporté. Acceptés: ${ALLOWED.join(', ')}` }, { status: 400 })

    // Créer l'entrée DB d'abord
    const doc = await prisma.knowledgeDocument.create({
      data: {
        userId: user.userId,
        name: name || file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        fileType: ext.slice(1),
        category,
        size: file.size,
        status: 'PROCESSING',
        textPath: '',
      }
    })

    // Sauvegarder le fichier temporairement
    const tmpDir = join(WIKI_BASE, user.userId, 'tmp')
    if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })

    const tmpPath = join(tmpDir, `${doc.id}${ext}`)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(tmpPath, buffer)

    // Sauvegarder le fichier original de façon permanente
    const filesDir = join(WIKI_BASE, user.userId, 'files')
    if (!existsSync(filesDir)) mkdirSync(filesDir, { recursive: true })
    await copyFile(tmpPath, join(filesDir, `${doc.id}${ext}`))

    // Appeler le microservice Python pour extraction
    let extractRes: Response
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)
      extractRes = await fetch(`${PYTHON_URL}/kb/extract`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          doc_id: doc.id,
          doc_name: doc.name,
          original_filename: file.name,
          file_path: tmpPath,
          category,
          wiki_base_path: WIKI_BASE,
        })
      })
      clearTimeout(timeout)
    } catch {
      await unlink(tmpPath).catch(() => {})
      await prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { status: 'ERROR' }
      })
      return NextResponse.json(
        { error: 'Service d\'extraction indisponible. Veuillez réessayer dans quelques instants.' },
        { status: 503 }
      )
    }

    const extractData = await extractRes.json()

    // Supprimer le fichier temporaire
    await unlink(tmpPath).catch(() => {})

    if (!extractData.success) {
      await prisma.knowledgeDocument.update({
        where: { id: doc.id },
        data: { status: 'ERROR' }
      })
      return NextResponse.json({ error: extractData.error || 'Erreur extraction' }, { status: 500 })
    }

    // Mettre à jour le statut
    const updated = await prisma.knowledgeDocument.update({
      where: { id: doc.id },
      data: {
        status: 'INDEXED',
        textPath: extractData.text_path,
        pageCount: extractData.page_count,
      }
    })

    return NextResponse.json(updated, { status: 201 })
  } catch (error) {
    console.error('[knowledge POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// DELETE — supprimer un document
export async function DELETE(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const doc = await prisma.knowledgeDocument.findFirst({ where: { id, userId: user.userId } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Supprimer le fichier texte indexé
  if (doc.textPath) {
    await unlink(doc.textPath).catch(() => {})
  }

  // Supprimer le fichier original permanent
  const permPath = join(WIKI_BASE, user.userId, 'files', `${doc.id}.${doc.fileType}`)
  await unlink(permPath).catch(() => {})

  await prisma.knowledgeDocument.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
