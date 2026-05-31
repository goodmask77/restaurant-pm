'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Contractor } from '@/lib/supabase/types'
import { Users, Star, Phone, Mail, Plus } from 'lucide-react'
import { WORK_CATEGORIES } from '@/lib/utils'
import { useCurrentUser } from '@/lib/use-current-user'

const SPECIALTY_OPTIONS = WORK_CATEGORIES.filter(c => c !== '驗收')

export default function ContractorsPage() {
  const supabase = createClient()
  const { canEdit } = useCurrentUser()
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', company: '', contact_person: '', phone: '', email: '',
    specialty: [] as string[], rating: '5', notes: ''
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('contractors').select('*').order('name')
    setContractors((data ?? []) as Contractor[])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function toggleSpecialty(s: string) {
    setForm(f => ({
      ...f,
      specialty: f.specialty.includes(s) ? f.specialty.filter(x => x !== s) : [...f.specialty, s]
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('contractors').insert({
      name: form.name.trim(),
      company: form.company || null,
      contact_person: form.contact_person || null,
      phone: form.phone || null,
      email: form.email || null,
      specialty: form.specialty,
      rating: parseInt(form.rating),
      notes: form.notes || null,
      owner_id: user?.id,
    })
    setSaving(false)
    setModalOpen(false)
    setForm({ name:'', company:'', contact_person:'', phone:'', email:'', specialty:[], rating:'5', notes:'' })
    load()
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="承包商管理"
        subtitle={`共 ${contractors.length} 間`}
        actions={canEdit && <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> 新增承包商</Button>}
      />
      <div className="flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">載入中...</div>
        ) : contractors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p>尚無承包商</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {contractors.map(c => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      {c.company && <p className="text-xs text-slate-500">{c.company}</p>}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < (c.rating ?? 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>

                  {c.specialty.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.specialty.map(s => (
                        <span key={s} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-slate-500">
                    {c.contact_person && <p>聯絡人：{c.contact_person}</p>}
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />{c.phone}
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />{c.email}
                      </div>
                    )}
                  </div>

                  {c.notes && <p className="mt-2 text-xs text-slate-400 border-t border-slate-100 pt-2">{c.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="新增承包商" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">名稱 / 師傅 *</label>
              <input required value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="王師傅"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">公司名稱</label>
              <input value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))} placeholder="台北工程有限公司"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">聯絡人</label>
              <input value={form.contact_person} onChange={e => setForm(f=>({...f,contact_person:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">電話</label>
              <input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="0912-345-678"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">評分</label>
              <select value={form.rating} onChange={e => setForm(f=>({...f,rating:e.target.value}))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} 星</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">專業類別</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTY_OPTIONS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.specialty.includes(s) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">備註</label>
              <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="submit" loading={saving}>新增承包商</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
