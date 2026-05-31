import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SESSION_COOKIE } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { username } = await req.json()
  if (!username?.trim()) {
    return NextResponse.json({ error: '請輸入帳號' }, { status: 400 })
  }

  const { data: user, error } = await supabase
    .from('app_users')
    .select('id, username, display_name, role, is_active')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (error || !user) {
    return NextResponse.json({ error: '帳號不存在' }, { status: 401 })
  }
  if (!user.is_active) {
    return NextResponse.json({ error: '帳號已停用，請聯絡管理員' }, { status: 403 })
  }

  const sessionPayload = encodeURIComponent(JSON.stringify({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
  }))

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, sessionPayload, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return res
}
