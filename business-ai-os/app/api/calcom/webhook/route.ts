import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

// ─── Types Cal.com Webhook ────────────────────────────────────────────────────

interface CalcomAttendee {
  name: string
  email: string
  timeZone?: string
}

interface CalcomBookingPayload {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'BOOKING_RESCHEDULED' | 'BOOKING_CONFIRMED'
  uid: string
  title: string
  startTime: string   // ISO 8601
  endTime: string     // ISO 8601
  attendees?: CalcomAttendee[]
  organizer?: { email: string }
  description?: string
  metadata?: { videoCallUrl?: string }
  videoCallUrl?: string
}

// ─── Helper: trouver l'utilisateur par webhook secret ─────────────────────────

async function findUserByWebhookSecret(secret: string) {
  return prisma.user.findFirst({
    where: { calcomWebhookSecret: secret },
    select: { id: true, calcomWebhookSecret: true },
  })
}

// ─── Helper: vérifier la signature Cal.com ────────────────────────────────────
// Cal.com envoie un header X-Cal-Signature-256 : sha256=<hmac>

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

// ─── Helper: trouver un prospect par email attendee ───────────────────────────

async function findProspectByEmail(userId: string, email: string) {
  if (!email) return null
  return prisma.prospect.findFirst({
    where: { userId, email },
    select: { id: true },
  })
}

// ─── POST — recevoir un événement Cal.com ─────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('X-Cal-Signature-256') || ''

    // Extraire le secret depuis le header ou query param
    // Cal.com passe le secret dans l'URL du webhook configuré: /api/calcom/webhook?secret=xxx
    const url = new URL(request.url)
    const secret = url.searchParams.get('secret') || ''

    if (!secret) {
      return NextResponse.json({ error: 'Secret manquant' }, { status: 400 })
    }

    // Trouver l'utilisateur par son secret webhook
    const user = await findUserByWebhookSecret(secret)
    if (!user) {
      return NextResponse.json({ error: 'Secret invalide' }, { status: 401 })
    }

    // Vérifier la signature HMAC si présente
    if (signature && !verifySignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    const payload: CalcomBookingPayload = JSON.parse(rawBody)
    const { triggerEvent, uid, title, startTime, endTime, attendees, description, metadata, videoCallUrl } = payload

    const attendee = attendees?.[0]
    const meetingUrl = videoCallUrl || metadata?.videoCallUrl || null

    // ── Mapper l'événement Cal.com → statut interne ──────────────────────────
    let status = 'CONFIRMED'
    if (triggerEvent === 'BOOKING_CANCELLED') status = 'CANCELLED'
    if (triggerEvent === 'BOOKING_RESCHEDULED') status = 'RESCHEDULED'

    // ── Chercher un prospect correspondant à l'email attendee ────────────────
    const prospect = attendee?.email
      ? await findProspectByEmail(user.id, attendee.email)
      : null

    // ── Upsert CalendarEvent ─────────────────────────────────────────────────
    await prisma.calendarEvent.upsert({
      where: { calcomEventUid: uid },
      create: {
        userId: user.id,
        calcomEventUid: uid,
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        attendeeName: attendee?.name || null,
        attendeeEmail: attendee?.email || null,
        status,
        meetingUrl,
        notes: description || null,
        prospectId: prospect?.id || null,
      },
      update: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        attendeeName: attendee?.name || null,
        attendeeEmail: attendee?.email || null,
        status,
        meetingUrl,
        notes: description || null,
        prospectId: prospect?.id || null,
      },
    })

    // ── Ingérer dans la LLM Wiki ─────────────────────────────────────────────
    try {
      const eventLabel = triggerEvent === 'BOOKING_CREATED' ? 'RDV confirmé'
        : triggerEvent === 'BOOKING_CANCELLED' ? 'RDV annulé'
        : triggerEvent === 'BOOKING_RESCHEDULED' ? 'RDV reporté'
        : 'RDV'

      await prisma.wikiEvent.create({
        data: {
          userId: user.id,
          eventType: `calcom_${triggerEvent.toLowerCase()}`,
          data: JSON.stringify({
            uid,
            title,
            startTime,
            endTime,
            attendeeName: attendee?.name,
            attendeeEmail: attendee?.email,
            status,
            label: eventLabel,
            prospectId: prospect?.id,
          }),
        },
      })
    } catch (e) {
      console.error('[calcom/webhook] WikiEvent creation failed:', e)
    }

    return NextResponse.json({ ok: true, status }, { status: 200 })
  } catch (error) {
    console.error('[calcom/webhook POST]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
