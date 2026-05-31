import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, MapPin, Calendar, DollarSign, User } from 'lucide-react'
import {
  formatCurrency, formatDate,
  PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR,
  RESTAURANT_TYPES
} from '@/lib/utils'
import type { Project } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  const projectList = (projects ?? []) as Project[]

  const statusGroups = {
    in_progress: projectList.filter(p => p.status === 'in_progress'),
    planning:    projectList.filter(p => p.status === 'planning'),
    completed:   projectList.filter(p => p.status === 'completed'),
    paused:      projectList.filter(p => p.status === 'paused'),
    cancelled:   projectList.filter(p => p.status === 'cancelled'),
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="專案管理"
        subtitle={`共 ${projectList.length} 個專案`}
        actions={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增專案
          </Link>
        }
      />

      <div className="flex-1 p-8">
        {projectList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="text-6xl mb-4">🏗️</div>
            <p className="text-lg font-medium text-slate-600 mb-2">還沒有任何專案</p>
            <p className="text-sm mb-6">建立第一個餐廳工程專案開始管理</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              建立專案
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(statusGroups).map(([status, list]) => {
              if (list.length === 0) return null
              return (
                <section key={status}>
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${PROJECT_STATUS_COLOR[status as keyof typeof PROJECT_STATUS_COLOR]}`}>
                      {PROJECT_STATUS_LABEL[status as keyof typeof PROJECT_STATUS_LABEL]}
                    </span>
                    <span>{list.length} 個</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {list.map(project => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-slate-800 leading-tight">{project.name}</h3>
                              <span className={`ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_STATUS_COLOR[project.status]}`}>
                                {PROJECT_STATUS_LABEL[project.status]}
                              </span>
                            </div>

                            {project.restaurant_type && (
                              <span className="inline-block text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded mb-3">
                                {project.restaurant_type}
                              </span>
                            )}

                            <div className="space-y-1.5 mb-4 text-xs text-slate-500">
                              {project.location && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{project.location}</span>
                                </div>
                              )}
                              {(project.start_date || project.end_date) && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{formatDate(project.start_date)} — {formatDate(project.end_date)}</span>
                                </div>
                              )}
                              {project.budget_total > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>{formatCurrency(project.budget_total)}</span>
                                </div>
                              )}
                              {project.site_supervisor && (
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5" />
                                  <span>監工：{project.site_supervisor}</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>施工進度</span>
                              </div>
                              <ProgressBar value={project.progress_pct} />
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
