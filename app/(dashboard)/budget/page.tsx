'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { BudgetItem, Project, Contractor } from '@/lib/supabase/types'
import { formatCurrency, WORK_CATEGORIES, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR } from '@/lib/utils'
import { DollarSign, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useCurrentUser } from '@/lib/use-current-user'

const PAYMENT_STATUSES = ['pending','partial','paid'] as const

export default function BudgetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">載入中…</div>}>
      <BudgetPageInner />
    </Suspense>
  )
}

function BudgetPageInner() {
  const supabase = createClient()
  const { canEdit } = useCurrentUser()
  const searchParams = useSearchParams()
  const defaultProject = searchParams.get('project') ?? ''

  const [items, setItems] = useState<BudgetItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterProject, setFilterProject] = useState(defaultProject)
  const [form, setForm] = useState({
    project_id: defaultProject, category: '土建' as BudgetItem['category'],
    item_name: '', contractor_id: '', budgeted_amount: '', actual_amount: '',
    paid_amount: '', payment_status: 'pending' as BudgetItem['payment_status'],
    invoice_no: '', notes: ''
  })

  async function load() {
    setLoading(true)
    const [{ data: b }, { data: p }, { data: c }] = await Promise.all([
      supabase.from('budget_items').select('*, contractor:contractors(id,name)').order('category'),
      supabase.from('projects').select('id,name').order('name'),
      supabase.from('contractors').select('id,name').order('name'),
    ])
    setItems((b ?? []) as BudgetItem[])
    setProjects((p ?? []) as Project[])
    setContractors((c ?? []) as Contractor[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('budget_items').insert({
      project_id: form.project_id,
      category: form.category,
      item_name: form.item_name.trim(),
      contractor_id: form.contractor_id || null,
      budgeted_amount: parseFloat(form.budgeted_amount) || 0,
      actual_amount: parseFloat(form.actual_amount) || 0,
      paid_amount: parseFloat(form.paid_amount) || 0,
      payment_status: form.payment_status,
      invoice_no: form.invoice_no || null,
      notes: form.notes || null,
    })
    setSaving(false)
    setModalOpen(false)
    setForm(f => ({ ...f, item_name:'', budgeted_amount:'', actual_amount:'', paid_amount:'', invoice_no:'', notes:'' }))
    load()
  }

  const filtered = filterProject ? items.filter(i => i.project_id === filterProject) : items
  const totalBudget = filtered.reduce((s, i) => s + i.budgeted_amount, 0)
  const totalActual = filtered.reduce((s, i) => s + i.actual_amount, 0)
  const totalPaid   = filtered.reduce((s, i) => s + i.paid_amount, 0)
  const variance = totalBudget - totalActual

  const byCategory = WORK_CATEGORIES.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat)
    if (catItems.length > 0) {
      acc[cat] = {
        budget: catItems.reduce((s, i) => s + i.budgeted_amount, 0),
        actual: catItems.reduce((s, i) => s + i.actual_amount, 0),
      }
    }
    return acc
  }, {} as Record<string, { budget: number; actual: number }>)

  return (
    <div className="flex flex-col h-full">
      <Header
        title="預算追蹤"
        actions={canEdit && <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> 新增費用</Button>}
      />
      <div className="flex-1 p-8 space-y-6">
        {/* Project filter */}
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">全部專案</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '總預算', value: formatCurrency(totalBudget), color: 'text-slate-800', icon: DollarSign, bg: 'bg-slate-50', ic: 'text-slate-600' },
            { label: '實際支出', value: formatCurrency(totalActual), color: 'text-orange-600', icon: TrendingUp, bg: 'bg-orange-50', ic: 'text-orange-600' },
            { label: '已付款', value: formatCurrency(totalPaid), color: 'text-green-600', icon: DollarSign, bg: 'bg-green-50', ic: 'text-green-600' },
            { label: '預算差額', value: formatCurrency(variance), color: variance >= 0 ? 'text-green-600' : 'text-red-600', icon: variance >= 0 ? TrendingDown : TrendingUp, bg: variance >= 0 ? 'bg-green-50' : 'bg-red-50', ic: variance >= 0 ? 'text-green-600' : 'text-red-600' },
          ].map(({ label, value, color, icon: Icon, bg, ic }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`${bg} p-2.5 rounded-lg`}><Icon className={`w-5 h-5 ${ic}`} /></div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Budget usage bar */}
        {totalBudget > 0 && (
          <Card>
            <CardContent>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">預算使用率</span>
                <span className="text-slate-500">{Math.round((totalActual / totalBudget) * 100)}%</span>
              </div>
              <ProgressBar value={totalActual} max={totalBudget} />
            </CardContent>
          </Card>
        )}

        {/* By Category */}
        {Object.keys(byCategory).length > 0 && (
          <Card>
            <CardHeader><CardTitle>各類別預算</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(byCategory).map(([cat, { budget, actual }]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{cat}</span>
                    <span className="text-xs text-slate-400">{formatCurrency(actual)} / {formatCurrency(budget)}</span>
                  </div>
                  <ProgressBar value={actual} max={budget || 1} showLabel={false} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <Card>
            <CardHeader><CardTitle>費用明細</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['類別','項目名稱','承包商','預算','實際','已付','付款狀態'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-500">{item.category}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{item.item_name}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{(item as any).contractor?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{formatCurrency(item.budgeted_amount)}</td>
                      <td className="px-4 py-3 text-orange-600">{formatCurrency(item.actual_amount)}</td>
                      <td className="px-4 py-3 text-green-600">{formatCurrency(item.paid_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLOR[item.payment_status]}`}>
                          {PAYMENT_STATUS_LABEL[item.payment_status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新增費用項目" size="lg">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">類別 *</label>
              <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value as BudgetItem['category']}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {WORK_CATEGORIES.filter(c => c !== '驗收').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">項目名稱 *</label>
              <input required value={form.item_name} onChange={e => setForm(f=>({...f,item_name:e.target.value}))} placeholder="廚房排煙設備"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">承包商</label>
              <select value={form.contractor_id} onChange={e => setForm(f=>({...f,contractor_id:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選擇</option>
                {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">付款狀態</label>
              <select value={form.payment_status} onChange={e => setForm(f=>({...f,payment_status:e.target.value as BudgetItem['payment_status']}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            {[['budgeted_amount','預算金額'], ['actual_amount','實際金額'], ['paid_amount','已付金額']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input type="number" value={form[key as keyof typeof form] as string} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">發票 / 單號</label>
              <input value={form.invoice_no} onChange={e => setForm(f=>({...f,invoice_no:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="submit" loading={saving}>新增</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
