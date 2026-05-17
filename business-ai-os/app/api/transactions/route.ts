/**
 * BUG-CRUD-01 fix: Alias /api/transactions → /api/cash/transactions
 * The canonical route is /api/cash/transactions
 */
import { NextRequest, NextResponse } from 'next/server'
import { GET as CashGET, POST as CashPOST } from '@/app/api/cash/transactions/route'

export async function GET(request: NextRequest) {
  return CashGET(request)
}

export async function POST(request: NextRequest) {
  return CashPOST(request)
}
