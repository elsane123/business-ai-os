'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function KnowledgeBaseRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/profile?tab=kb')
  }, [router])
  return null
}
