'use client'

import { useEffect, useState } from 'react'
import type { SessionUser } from '@/lib/auth'

/**
 * 取得目前登入使用者（client 端）。
 * 未登入時 user 為 null、canEdit 為 false——預設唯讀，
 * 確認登入後才把編輯控制顯示出來，避免訪客看到按鈕閃現。
 */
export function useCurrentUser() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => { if (active) setUser(u) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { user, loading, canEdit: !!user }
}
