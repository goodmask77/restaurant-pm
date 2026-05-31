import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(SESSION_COOKIE)?.value

  // API auth routes 不攔截
  if (pathname.startsWith('/api/auth')) return NextResponse.next()
  // 靜態資源不攔截
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) return NextResponse.next()

  const isAuthPage = pathname === '/login' || pathname === '/register'

  // 需要登入的「寫入 / 管理」頁面（其餘頁面開放未登入唯讀瀏覽）
  const requiresLogin =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/import') ||
    pathname === '/projects/new'

  // 已登入時不需再進登入頁
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 未登入且想進寫入/管理頁 → 導去登入
  if (!session && requiresLogin) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 其餘（含 dashboard 各唯讀頁）一律放行
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
