import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const body = await req.json()
    const content: string = (body.content ?? '').trim()
    if (!content) {
      return NextResponse.json({ error: 'Contenu du post requis' }, { status: 400 })
    }

    // Read LinkedIn access token from user's DB record
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { linkedinAccessToken: true },
    })
    const token = user?.linkedinAccessToken
    if (!token) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 })
    }

    // Get person URN from LinkedIn userinfo endpoint
    const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!userinfoRes.ok) {
      return NextResponse.json({ error: 'token_expired' }, { status: 401 })
    }
    const userinfo = await userinfoRes.json()
    const personUrn = `urn:li:person:${userinfo.sub}`

    // Publish via LinkedIn UGC Posts API
    const publishRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    })

    if (!publishRes.ok) {
      if (publishRes.status === 401 || publishRes.status === 403) {
        return NextResponse.json({ error: 'token_expired' }, { status: 401 })
      }
      const errBody = await publishRes.text()
      console.error('[linkedin-post/publish]', publishRes.status, errBody)
      return NextResponse.json({ error: 'publish_failed' }, { status: 500 })
    }

    const published = await publishRes.json()
    const postId = published.id ?? ''
    const postUrl = postId ? `https://www.linkedin.com/feed/update/${postId}` : 'https://www.linkedin.com/feed/'

    return NextResponse.json({ postUrl })
  } catch (error) {
    console.error('[linkedin-post/publish]', error)
    return NextResponse.json({ error: 'publish_failed' }, { status: 500 })
  }
}
