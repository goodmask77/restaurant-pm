'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HardHat, User, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || '登入失敗')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-600 p-3 rounded-xl mb-3">
          <HardHat className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">餐廳工程監工系統</h1>
        <p className="text-slate-400 text-sm mt-1">Restaurant Construction PM</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">帳號</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="輸入帳號"
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? '登入中...' : '登入'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        帳號由管理員建立，直接輸入帳號即可登入
      </p>
    </div>
  )
}
