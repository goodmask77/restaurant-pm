import { Sidebar } from '@/components/layout/Sidebar'
import { getSessionUser } from '@/lib/auth'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = getSessionUser()
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
