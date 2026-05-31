import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  username: string
  display_name: string | null
  role: 'admin' | 'manager' | 'supervisor' | 'viewer'
}

export const SESSION_COOKIE = 'rpm_session'

export function getSessionUser(): SessionUser | null {
  try {
    const val = cookies().get(SESSION_COOKIE)?.value
    if (!val) return null
    return JSON.parse(decodeURIComponent(val)) as SessionUser
  } catch {
    return null
  }
}
