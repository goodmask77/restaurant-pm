'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { DailyReport, Project } from '@/lib/supabase/types'
import { formatDate } from '@/lib/utils'
import { FileText, Plus, CloudSun, Users } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const WEATHER_OPTIONS = ['晴天', '多雲', '陰天', '小雨', '大雨', '颱風', '其他']

export default function ReportsPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const defaultProject = searchParams.get('project') ?? ''

  const [reports, setReports] = useState<DailyReport[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterProject, setFilterProject] = useState(defaultProject)
  const [form, setForm] = useState({
    project_id: defaultProject,
    report_date: new Date().toISOString().slice(0, 10),
    weather: '晴天',
    workers_count: '0',
    work_summary: '',
    progress_update: '',
    issues_encountered: '',
    next_day_plan: '',
    reported_by: '',
  })

  async function load() {
    setLoading(true)
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from('daily_reports').select('*, project:projects(id,name)').order('report_date', { ascending: false }),
      supabase.from('projects').select('id,name').order('name'),
    ])
    setReports((r ?? []) as DailyReport[])
    setProjects((p ?? []) as Project[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('daily_reports').upsert({
      project_id: form.project_id,
      report_date: form.report_date,
      weather: form.weather,
      workers_count: parseInt(form.workers_count) || 0,
      work_summary: form.work_summary || null,
      progress_update: form.progress_update || null,
      issues_encountered: form.issues_encountered || null,
      next_day_plan: form.next_day_plan || null,
      reported_by: form.reported_by || null,
    }, { onConflict: 'project_id,report_date' })
    setSaving(false)
    if (!error) {
      setModalOpen(false)
      setForm(f => ({ ...f, work_summary:'', progress_update:'', issues_encountered:'', next_day_plan:'', reported_by:'' }))
      load()
    }
  }

  const filtered = filterProject ? reports.filter(r => r.project_id === filterProject) : reports

  return (
    <div className="flex flex-col h-full">
      <Header
        title="工地日報"
        subtitle={`共 ${filtered.length} 筆`}
        actions={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> 新增日報</Button>}
      />
      <div className="flex-1 p-8 space-y-6">
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">全部專案</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p>尚無日報記錄</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-800">{formatDate(report.report_date)}</span>
                      {report.weather && (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <CloudSun className="w-4 h-4" />{report.weather}
                        </span>
                      )}
                      {report.workers_count > 0 && (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Users className="w-4 h-4" />{report.workers_count} 人
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {(report as any).project?.name}
                      {report.reported_by && ` · ${report.reported_by}`}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {[
                    { label: '今日工作摘要', value: report.work_summary },
                    { label: '進度更新', value: report.progress_update },
                    { label: '遇到的問題', value: report.issues_encountered },
                    { label: '明日計畫', value: report.next_day_plan },
                  ].map(({ label, value }) =>
                    value ? (
                      <div key={label}>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{value}</p>
                      </div>
                    ) : null
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新增工地日報" size="xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">所屬專案 *</label>
              <select required value={form.project_id} onChange={e => setForm(f=>({...f,project_id:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選擇專案</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">日期 *</label>
              <input type="date" required value={form.report_date} onChange={e => setForm(f=>({...f,report_date:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">天氣</label>
              <select value={form.weather} onChange={e => setForm(f=>({...f,weather:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">工人數量</label>
              <input type="number" min="0" value={form.workers_count} onChange={e => setForm(f=>({...f,workers_count:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">填報人</label>
              <input value={form.reported_by} onChange={e => setForm(f=>({...f,reported_by:e.target.value}))} placeholder="監工姓名"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {[
            { key: 'work_summary', label: '今日工作摘要', placeholder: '今天完成了哪些工項...' },
            { key: 'progress_update', label: '進度更新', placeholder: '整體進度說明...' },
            { key: 'issues_encountered', label: '遇到的問題 / 障礙', placeholder: '今天遇到哪些問題...' },
            { key: 'next_day_plan', label: '明日工作計畫', placeholder: '明天預計進行...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <textarea
                value={form[key as keyof typeof form]}
                onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
                rows={3} placeholder={placeholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="submit" loading={saving}>儲存日報</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
