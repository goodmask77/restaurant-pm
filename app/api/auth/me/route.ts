import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = getSessionUser()
  if (!user) return NextResponse.json(null, { status: 401 })
  return NextResponse.json(user)
}
