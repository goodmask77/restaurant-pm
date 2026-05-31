'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HardHat, LayoutDashboard, FolderOpen, CheckSquare,
  Users, DollarSign, AlertTriangle, FileText, LogOut, ShieldCheck, Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'

interface SidebarProps {
  user: SessionUser | null
}

const navItems = [
  { href: '/dashboard',   label: '總覽',     icon: LayoutDashboard },
  { href: '/projects',    label: '專案管理',  icon: FolderOpen },
  { href: '/tasks',       label: '工程項目',  icon: CheckSquare },
  { href: '/contractors', label: '承包商',    icon: Users },
  { href: '/budget',      label: '預算追蹤',  icon: DollarSign },
  { href: '/issues',      label: '工程問題',  icon: AlertTriangle },
  { href: '/reports',     label: '工地日報',  icon: FileText },
  { href: '/import',      label: '批量匯入',  icon: Upload },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col z-40">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">餐廳工程監工</p>
            <p className="text-xs text-slate-400">管理系統</p>
          </div>
        </div>
        {user && (
          <div className="mt-3 px-2 py-1.5 bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-300 font-medium truncate">{user.display_name ?? user.username}</p>
            <p className="text-xs text-slate-500">{user.username}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Admin only */}
        {user?.role === 'admin' && (
          <Link href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 border border-slate-700',
              pathname === '/admin' ? 'bg-purple-700 text-white border-purple-600' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            帳號管理
          </Link>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          登出
        </button>
      </div>
    </aside>
  )
}
