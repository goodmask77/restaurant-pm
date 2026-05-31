import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Link from 'next/link'
import { FolderOpen, CheckSquare, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate, PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, ISSUE_SEVERITY_COLOR, ISSUE_SEVERITY_LABEL } from '@/lib/utils'
import type { Project, Issue } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = getSessionUser()

  const supabase = createClient()

  const [
    { data: projects },
    { data: tasks },
    { data: issues },
    { data: budgetItems },
  ] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('tasks').select('id, status, project_id'),
    supabase.from('issues').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('budget_items').select('budgeted_amount, actual_amount'),
  ])

  const projectList = (projects ?? []) as Project[]
  const taskList = tasks ?? []
  const issueList = (issues ?? []) as Issue[]

  const activeProjects = projectList.filter(p => p.status === 'in_progress').length
  const completedTasks = taskList.filter(t => t.status === 'completed').length
  const openIssues = issueList.filter((i: any) => i.status === 'open' || i.status === 'in_progress').length
  const totalBudget = (budgetItems ?? []).reduce((s: number, b: any) => s + (b.budgeted_amount || 0), 0)
  const totalActual = (budgetItems ?? []).reduce((s: number, b: any) => s + (b.actual_amount || 0), 0)

  const recentProjects = projectList.slice(0, 5)

  return (
    <div className="flex flex-col h-full">
      <Header title="專案總覽" subtitle={user ? `歡迎回來，${user.display_name ?? user.username}` : '訪客瀏覽模式（唯讀）'} />

      <div className="flex-1 p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="進行中專案" value={activeProjects} subtitle={`共 ${projectList.length} 個專案`} icon={FolderOpen} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard title="已完成工項" value={completedTasks} subtitle={`共 ${taskList.length} 個工項`} icon={CheckSquare} iconColor="text-green-600" iconBg="bg-green-50" />
          <StatCard title="待處理問題" value={openIssues} subtitle="工程缺失 / 問題單" icon={AlertTriangle} iconColor="text-orange-600" iconBg="bg-orange-50" />
          <StatCard title="總預算" value={formatCurrency(totalBudget)} subtitle={`支出 ${formatCurrency(totalActual)}`} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>最近專案</CardTitle>
                  <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">查看全部 <ArrowRight className="w-3 h-3" /></Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {recentProjects.length === 0 ? (
                  <div className="px-6 py-10 text-center text-slate-400">
                    <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>尚無專案，<Link href="/projects/new" className="text-blue-600 hover:underline">立即建立</Link></p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentProjects.map(project => (
                      <Link key={project.id} href={`/projects/${project.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-800 truncate">{project.name}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLOR[project.status]}`}>
                              {PROJECT_STATUS_LABEL[project.status]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">{project.location ?? '未設定地點'}</p>
                          <ProgressBar value={project.progress_pct} showLabel />
                        </div>
                        <div className="text-right flex-shrink-0 text-xs text-slate-400">
                          <p>{formatDate(project.end_date)}</p>
                          <p className="mt-1">{formatCurrency(project.budget_total)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>最新問題</CardTitle>
                  <Link href="/issues" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">全部 <ArrowRight className="w-3 h-3" /></Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {issueList.length === 0 ? (
                  <div className="px-6 py-10 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">暫無問題</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {issueList.map(issue => (
                      <div key={issue.id} className="px-6 py-3">
                        <div className="flex items-start gap-2">
                          <span className={`mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${ISSUE_SEVERITY_COLOR[issue.severity]}`}>
                            {ISSUE_SEVERITY_LABEL[issue.severity]}
                          </span>
                          <p className="text-sm text-slate-700 flex-1 leading-tight">{issue.title}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(issue.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {totalBudget > 0 && (
          <Card>
            <CardHeader><CardTitle>預算概覽</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div><p className="text-xs text-slate-500 mb-1">總預算</p><p className="text-xl font-bold text-slate-800">{formatCurrency(totalBudget)}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">實際支出</p><p className="text-xl font-bold text-orange-600">{formatCurrency(totalActual)}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">剩餘</p><p className={`text-xl font-bold ${totalBudget - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalBudget - totalActual)}</p></div>
              </div>
              <ProgressBar value={totalActual} max={totalBudget || 1} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
