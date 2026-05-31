'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RESTAURANT_TYPES } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', location: '', restaurant_type: '',
    area_sqm: '', floors: '1', start_date: '', end_date: '',
    budget_total: '', project_manager: '', site_supervisor: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('請輸入專案名稱'); return }
    setLoading(true)
    setError('')

    const meRes = await fetch('/api/auth/me')
    const currentUser = await meRes.json()

    const { data, error: err } = await supabase.from('projects').insert({
      name: form.name.trim(),
      description: form.description || null,
      location: form.location || null,
      restaurant_type: form.restaurant_type || null,
      area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : null,
      floors: parseInt(form.floors) || 1,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      budget_total: form.budget_total ? parseFloat(form.budget_total) : 0,
      project_manager: form.project_manager || null,
      site_supervisor: form.site_supervisor || null,
      owner_id: currentUser?.id ?? null,
    }).select().single()

    if (err) { setError(err.message); setLoading(false) }
    else router.push(`/projects/${data.id}`)
  }

  const field = (label: string, name: string, type = 'text', placeholder?: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input type={type} name={name} value={form[name as keyof typeof form]} onChange={handleChange} placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <Header title="新增專案" actions={
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> 返回
        </Link>
      } />
      <div className="flex-1 p-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>基本資訊</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">專案名稱 *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="例：信義區王品牛排裝修工程" required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">專案描述</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              {field('地址 / 位置', 'location', 'text', '台北市信義區松仁路 100 號')}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">餐廳類型</label>
                <select name="restaurant_type" value={form.restaurant_type} onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">請選擇</option>
                  {RESTAURANT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {field('面積（坪）', 'area_sqm', 'number', '50')}
              {field('樓層數', 'floors', 'number', '1')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>時間與預算</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('開工日期', 'start_date', 'date')}
              {field('預計完工日期', 'end_date', 'date')}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">總預算（元）</label>
                <input type="number" name="budget_total" value={form.budget_total} onChange={handleChange} placeholder="3000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>負責人員</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field('專案負責人', 'project_manager', 'text', '張經理')}
              {field('現場監工', 'site_supervisor', 'text', '李師傅')}
            </CardContent>
          </Card>

          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>建立專案</Button>
            <Link href="/projects"><Button type="button" variant="secondary">取消</Button></Link>
          </div>
        </form>
      </div>
    </div>
  )
}
