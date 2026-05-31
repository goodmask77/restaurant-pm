import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  MapPin, Calendar, DollarSign, User, LayoutGrid,
  CheckSquare, AlertTriangle, FileText, ArrowLeft, Edit
} from 'lucide-react'
import {
  formatCurrency, formatDate,
  PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR,
  TASK_STATUS_LABEL, TASK_STATUS_COLOR,
  ISSUE_SEVERITY_LABEL, ISSUE_SEVERITY_COLOR,
} from '@/lib/utils'
import type { Project, Task, Issue, BudgetItem } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: project },
    { data: tasks },
    { data: issues },
    { data: budgetItems },
    { data: reports },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).single(),
    supabase.from('tasks').select('*').eq('project_id', params.id).order('created_at'),
    supabase.from('issues').select('*').eq('project_id', params.id).order('created_at', { ascending: false }),
    supabase.from('budget_items').select('*').eq('project_id', params.id),
    supabase.from('daily_reports').select('*').eq('project_id', params.id).order('report_date', { ascending: false }).limit(3),
  ])

  if (!project) notFound()

  const p = project as Project
  const taskList = (tasks ?? []) as Task[]
  const issueList = (issues ?? []) as Issue[]
  const budgetList = (budgetItems ?? []) as BudgetItem[]

  const totalBudget = budgetList.reduce((s, b) => s + (b.budgeted_amount || 0), 0)
  const totalActual = budgetList.reduce((s, b) => s + (b.actual_amount || 0), 0)
  const totalPaid   = budgetList.reduce((s, b) => s + (b.paid_amount || 0), 0)

  const completedTasks = taskList.filter(t => t.status === 'completed').length
  const openIssues = issueList.filter(i => i.status === 'open' || i.status === 'in_progress').length

  return (
    <div className="flex flex-col h-full">
      <Header
        title={p.name}
        subtitle={p.location ?? undefined}
        actions={
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> 返回
          </Link>
        }
      />

      <div className="flex-1 p-8 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">狀態</p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${PROJECT_STATUS_COLOR[p.status]}`}>
              {PROJECT_STATUS_LABEL[p.status]}
            </span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">工項完成</p>
            <p className="text-2xl font-bold text-slate-800">{completedTasks}/{taskList.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">待處理問題</p>
            <p className={`text-2xl font-bold ${openIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>{openIssues}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">總預算</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(p.budget_total)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">完工日期</p>
            <p className="text-sm font-semibold text-slate-800">{formatDate(p.end_date)}</p>
          </div>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">整體施工進度</p>
              <span className="text-2xl font-bold text-blue-600">{p.progress_pct}%</span>
            </div>
            <ProgressBar value={p.progress_pct} />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>開工：{formatDate(p.start_date)}</span>
              <span>完工：{formatDate(p.end_date)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>工程項目</CardTitle>
                <Link href={`/tasks?project=${p.id}`} className="text-xs text-blue-600 hover:text-blue-700">管理 →</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {taskList.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-400">尚無工程項目</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {taskList.map(task => (
                    <div key={task.id} className="px-6 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.category && <span className="text-xs text-slate-400">{task.category}</span>}
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${TASK_STATUS_COLOR[task.status]}`}>
                            {TASK_STATUS_LABEL[task.status]}
                          </span>
                        </div>
                      </div>
                      <ProgressBar value={task.progress} className="w-24" showLabel={false} />
                      <span className="text-xs text-slate-400 w-8">{task.progress}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issues */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>工程問題</CardTitle>
                <Link href={`/issues?project=${p.id}`} className="text-xs text-blue-600 hover:text-blue-700">管理 →</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {issueList.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-400">暫無問題記錄</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {issueList.map(issue => (
                    <div key={issue.id} className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${ISSUE_SEVERITY_COLOR[issue.severity]}`}>
                          {ISSUE_SEVERITY_LABEL[issue.severity]}
                        </span>
                        <p className="text-sm text-slate-700 flex-1 truncate">{issue.title}</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(issue.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget Summary */}
        {budgetList.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>預算概覽</CardTitle>
                <Link href={`/budget?project=${p.id}`} className="text-xs text-blue-600 hover:text-blue-700">詳細 →</Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500">預算金額</p>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(totalBudget)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">實際支出</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(totalActual)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">已付款</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
              <ProgressBar value={totalActual} max={totalBudget || 1} />
            </CardContent>
          </Card>
        )}

        {/* Project Info */}
        <Card>
          <CardHeader><CardTitle>專案資訊</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { label: '餐廳類型', value: p.restaurant_type },
                { label: '面積', value: p.area_sqm ? `${p.area_sqm} 坪` : null },
                { label: '樓層數', value: p.floors ? `${p.floors} 層` : null },
                { label: '專案負責人', value: p.project_manager },
                { label: '現場監工', value: p.site_supervisor },
                { label: '建立日期', value: formatDate(p.created_at) },
              ].map(({ label, value }) => (
                value && (
                  <div key={label}>
                    <dt className="text-xs text-slate-500 mb-0.5">{label}</dt>
                    <dd className="font-medium text-slate-800">{value}</dd>
                  </div>
                )
              ))}
            </dl>
            {p.description && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">專案描述</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
