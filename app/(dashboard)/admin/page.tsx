'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Users, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SessionUser } from '@/lib/auth'

type AppUser = {
  id: string
  username: string
  display_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

const ROLES = ['admin', 'manager', 'supervisor', 'viewer'] as const
const ROLE_LABEL: Record<string, string> = {
  admin: '管理員', manager: '專案負責人', supervisor: '監工', viewer: '檢視者',
}
const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  supervisor: 'bg-orange-100 text-orange-700',
  viewer: 'bg-slate-100 text-slate-700',
}

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    username: '', display_name: '', role: 'viewer', is_active: true,
  })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      if (!u || u.role !== 'admin') { router.replace('/dashboard'); return }
      setCurrentUser(u)
      load()
    })
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('app_users').select('*').order('created_at')
    setUsers((data ?? []) as AppUser[])
    setLoading(false)
  }

  function openAdd() {
    setEditUser(null)
    setForm({ username: '', display_name: '', role: 'viewer', is_active: true })
    setError('')
    setModalOpen(true)
  }

  function openEdit(user: AppUser) {
    setEditUser(user)
    setForm({ username: user.username, display_name: user.display_name ?? '', role: user.role, is_active: user.is_active })
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (editUser) {
      const { error: err } = await supabase.from('app_users').update({
        display_name: form.display_name || null,
        role: form.role,
        is_active: form.is_active,
      }).eq('id', editUser.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const uname = form.username.trim().toLowerCase()
      if (!/^[a-zA-Z0-9]+$/.test(uname)) {
        setError('帳號只能包含英文字母與數字')
        setSaving(false); return
      }
      const { error: err } = await supabase.from('app_users').insert({
        username: uname,
        display_name: form.display_name || null,
        role: form.role,
        is_active: true,
      })
      if (err) { setError(err.code === '23505' ? '帳號已存在' : err.message); setSaving(false); return }
    }

    setSaving(false)
    setModalOpen(false)
    load()
  }

  async function handleDelete(user: AppUser) {
    if (user.username === currentUser?.username) { alert('不能刪除自己的帳號'); return }
    if (!confirm(`確定刪除帳號「${user.username}」？`)) return
    await supabase.from('app_users').delete().eq('id', user.id)
    load()
  }

  if (!currentUser) return null

  return (
    <div className="flex flex-col h-full">
      <Header
        title="帳號管理"
        subtitle={`共 ${users.length} 個帳號`}
        actions={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> 新增帳號</Button>}
      />
      <div className="flex-1 p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm text-amber-700">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          帳號採用「文字＋數字」格式，登入時只需輸入帳號，無需密碼。
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">載入中...</div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['帳號', '姓名 / 稱謂', '角色', '狀態', '建立時間', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{user.username}</td>
                      <td className="px-4 py-3 text-slate-600">{user.display_name ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[user.role] ?? 'bg-slate-100 text-slate-700'}`}>
                          {ROLE_LABEL[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.is_active ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(user.created_at).toLocaleDateString('zh-TW')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(user)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors" title="編輯">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(user)} className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors" title="刪除">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? `編輯帳號：${editUser.username}` : '新增帳號'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              帳號（英文 + 數字）{!editUser && <span className="text-red-500"> *</span>}
            </label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              disabled={!!editUser}
              required={!editUser}
              placeholder="worker01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 font-mono"
            />
            <p className="text-xs text-slate-400 mt-1">登入只需輸入帳號，無需密碼</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">姓名 / 稱謂</label>
            <input
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="王師傅"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">角色</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">管理員：全權限｜專案負責人：專案管理｜監工：日報/工項｜檢視者：唯讀</p>
          </div>

          {editUser && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-sm font-medium text-slate-700">帳號啟用</span>
            </label>
          )}

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="submit" loading={saving}>{editUser ? '儲存變更' : '建立帳號'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
