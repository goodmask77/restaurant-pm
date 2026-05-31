'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import {
  TASK_STATUS_LABEL, TASK_STATUS_COLOR, WORK_CATEGORIES,
  formatDate
} from '@/lib/utils'
import type { Task, Project, Contractor } from '@/lib/supabase/types'
import { Plus, Filter, CheckSquare } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

const PRIORITIES = ['low','medium','high','urgent'] as const
const PRIORITY_LABEL = { low:'低', medium:'中', high:'高', urgent:'緊急' }
const STATUS_OPTIONS = ['pending','in_progress','completed','blocked'] as const

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">載入中…</div>}>
      <TasksPageInner />
    </Suspense>
  )
}

function TasksPageInner() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const defaultProject = searchParams.get('project') ?? ''

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProject, setFilterProject] = useState(defaultProject)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    project_id: defaultProject,
    title: '',
    description: '',
    category: '',
    status: 'pending' as Task['status'],
    priority: 'medium' as Task['priority'],
    start_date: '',
    due_date: '',
    assigned_to: '',
    contractor_id: '',
    progress: '0',
    notes: '',
  })

  async function load() {
    setLoading(true)
    const [{ data: t }, { data: p }, { data: c }] = await Promise.all([
      supabase.from('tasks').select('*, project:projects(id,name), contractor:contractors(id,name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id,name').order('name'),
      supabase.from('contractors').select('id,name').order('name'),
    ])
    setTasks((t ?? []) as Task[])
    setProjects((p ?? []) as Project[])
    setContractors((c ?? []) as Contractor[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      project_id: form.project_id,
      title: form.title.trim(),
      description: form.description || null,
      category: form.category || null,
      status: form.status,
      priority: form.priority,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
      contractor_id: form.contractor_id || null,
      progress: parseInt(form.progress) || 0,
      notes: form.notes || null,
    }
    await supabase.from('tasks').insert(payload)
    setModalOpen(false)
    setForm(f => ({ ...f, title:'', description:'', category:'', progress:'0', notes:'', assigned_to:'', contractor_id:'' }))
    setSaving(false)
    load()
  }

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    if (filterProject && t.project_id !== filterProject) return false
    return true
  })

  return (
    <div className="flex flex-col h-full">
      <Header
        title="工程項目"
        subtitle={`共 ${filtered.length} 筆`}
        actions={
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="w-4 h-4" /> 新增工項
          </Button>
        }
      />
      <div className="flex-1 p-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全部專案</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-1">
            {['all', ...STATUS_OPTIONS].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                {s === 'all' ? '全部' : TASK_STATUS_LABEL[s as Task['status']]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <CheckSquare className="w-12 h-12 mb-3 opacity-30" />
            <p>尚無工程項目</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">工項名稱</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">專案</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">類別</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">狀態</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">負責人</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">完工日</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">進度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{task.title}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{(task as any).project?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{task.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TASK_STATUS_COLOR[task.status]}`}>
                        {TASK_STATUS_LABEL[task.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{task.assigned_to ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(task.due_date)}</td>
                    <td className="px-4 py-3"><ProgressBar value={task.progress} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新增工程項目" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">工項名稱 *</label>
              <input required value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                placeholder="例：廚房水電配管" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
              <label className="block text-sm font-medium text-slate-700 mb-1">工程類別</label>
              <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選擇類別</option>
                {WORK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">狀態</label>
              <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value as Task['status']}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">優先順序</label>
              <select value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value as Task['priority']}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">開始日期</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f=>({...f,start_date:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">完工日期</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f=>({...f,due_date:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">負責人 / 監工</label>
              <input value={form.assigned_to} onChange={e => setForm(f=>({...f,assigned_to:e.target.value}))} placeholder="李師傅"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">承包商</label>
              <select value={form.contractor_id} onChange={e => setForm(f=>({...f,contractor_id:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選擇承包商</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">完成進度：{form.progress}%</label>
              <input type="range" min="0" max="100" value={form.progress} onChange={e => setForm(f=>({...f,progress:e.target.value}))}
                className="w-full accent-blue-600" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">備註</label>
              <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="submit" loading={saving}>新增工項</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
