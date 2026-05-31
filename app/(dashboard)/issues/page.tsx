'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Card } from '@/components/ui/Card'
import type { Issue, Project } from '@/lib/supabase/types'
import {
  formatDate,
  ISSUE_SEVERITY_LABEL, ISSUE_SEVERITY_COLOR,
  ISSUE_STATUS_LABEL,
} from '@/lib/utils'
import { AlertTriangle, Plus } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const SEVERITIES = ['low','medium','high','critical'] as const
const STATUSES = ['open','in_progress','resolved','closed'] as const
const STATUS_COLOR: Record<string, string> = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-slate-100 text-slate-600',
}

export default function IssuesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const defaultProject = searchParams.get('project') ?? ''

  const [issues, setIssues] = useState<Issue[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProject, setFilterProject] = useState(defaultProject)
  const [form, setForm] = useState({
    project_id: defaultProject, title: '', description: '',
    severity: 'medium' as Issue['severity'], status: 'open' as Issue['status'],
    reported_by: '', assigned_to: '', resolution_notes: '',
  })

  async function load() {
    setLoading(true)
    const [{ data: i }, { data: p }] = await Promise.all([
      supabase.from('issues').select('*, project:projects(id,name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id,name').order('name'),
    ])
    setIssues((i ?? []) as Issue[])
    setProjects((p ?? []) as Project[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('issues').insert({
      project_id: form.project_id,
      title: form.title.trim(),
      description: form.description || null,
      severity: form.severity,
      status: form.status,
      reported_by: form.reported_by || null,
      assigned_to: form.assigned_to || null,
      resolution_notes: form.resolution_notes || null,
    })
    setSaving(false)
    setModalOpen(false)
    setForm(f => ({ ...f, title:'', description:'', reported_by:'', assigned_to:'', resolution_notes:'' }))
    load()
  }

  const filtered = issues.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    if (filterProject && i.project_id !== filterProject) return false
    return true
  })

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = issues.filter(i => i.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="工程問題"
        subtitle={`共 ${filtered.length} 筆`}
        actions={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> 新增問題</Button>}
      />
      <div className="flex-1 p-8 space-y-6">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-3">
          {STATUSES.map(s => (
            <div key={s} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${STATUS_COLOR[s]}`}>
              {ISSUE_STATUS_LABEL[s]}：{counts[s] ?? 0}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全部專案</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-1">
            {['all', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                {s === 'all' ? '全部' : ISSUE_STATUS_LABEL[s as Issue['status']]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <AlertTriangle className="w-12 h-12 mb-3 opacity-30" />
            <p>暫無問題記錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(issue => (
              <Card key={issue.id} className="hover:shadow-sm transition-shadow">
                <div className="p-4 flex items-start gap-4">
                  <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${ISSUE_SEVERITY_COLOR[issue.severity]}`}>
                    {ISSUE_SEVERITY_LABEL[issue.severity]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-800">{issue.title}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[issue.status]}`}>
                        {ISSUE_STATUS_LABEL[issue.status]}
                      </span>
                    </div>
                    {issue.description && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">{issue.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>專案：{(issue as any).project?.name ?? '—'}</span>
                      {issue.reported_by && <span>回報：{issue.reported_by}</span>}
                      {issue.assigned_to && <span>負責：{issue.assigned_to}</span>}
                      <span>{formatDate(issue.created_at)}</span>
                    </div>
                    {issue.resolution_notes && (
                      <div className="mt-2 text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                        解決說明：{issue.resolution_notes}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新增工程問題" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">問題標題 *</label>
              <input required value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                placeholder="例：廚房地板未完成防水層"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">所屬專案 *</label>
              <select required value={form.project_id} onChange={e => setForm(f=>({...f,project_id:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選擇專案</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">嚴重程度</label>
              <select value={form.severity} onChange={e => setForm(f=>({...f,severity:e.target.value as Issue['severity']}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SEVERITIES.map(s => <option key={s} value={s}>{ISSUE_SEVERITY_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">狀態</label>
              <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value as Issue['status']}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUSES.map(s => <option key={s} value={s}>{ISSUE_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">回報人</label>
              <input value={form.reported_by} onChange={e => setForm(f=>({...f,reported_by:e.target.value}))} placeholder="監工姓名"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">指派給</label>
              <input value={form.assigned_to} onChange={e => setForm(f=>({...f,assigned_to:e.target.value}))} placeholder="負責人"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">問題描述</label>
              <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">解決說明</label>
              <textarea value={form.resolution_notes} onChange={e => setForm(f=>({...f,resolution_notes:e.target.value}))} rows={2}
                placeholder="已解決時填寫解決方式..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="submit" loading={saving}>新增問題</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
