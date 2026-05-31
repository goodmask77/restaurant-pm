'use client'

import { useState, useCallback, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  autoMap, remapForTable, coerceValue,
  TABLE_LABELS, TABLE_FIELDS,
  type TargetTable, type AutoMapResult,
} from '@/lib/import/mapper'
import { parseFile, type ParsedData } from '@/lib/import/smart-parser'
import { Upload, FileText, ChevronDown, CheckCircle, XCircle, AlertCircle, Trash2, Sparkles } from 'lucide-react'

type ImportState = 'idle' | 'mapped' | 'importing' | 'done'

const TABLES = Object.keys(TABLE_LABELS) as TargetTable[]

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [state, setState] = useState<ImportState>('idle')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [mapResult, setMapResult] = useState<AutoMapResult | null>(null)
  const [targetTable, setTargetTable] = useState<TargetTable>('projects')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [importResult, setImportResult] = useState<{ ok: number; fail: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    setFileName(file.name)
    const data = await parseFile(file)
    setParsed(data)
    const result = autoMap(data.columns)
    setMapResult(result)
    setTargetTable(result.detectedTable)
    setColumnMapping(result.columnMapping)
    setState('mapped')
    // fetch projects for linking
    fetch('/api/projects-list').then(r => r.json()).then(setProjects).catch(() => {})
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function changeTable(t: TargetTable) {
    setTargetTable(t)
    if (parsed) setColumnMapping(remapForTable(parsed.columns, t))
  }

  function setColMap(col: string, field: string) {
    setColumnMapping(prev => ({ ...prev, [col]: field }))
  }

  async function doImport() {
    if (!parsed) return
    setState('importing')
    const fields = TABLE_FIELDS[targetTable]
    const fieldMap = Object.fromEntries(fields.map(f => [f.key, f]))

    const records = parsed.rows.map(row => {
      const obj: Record<string, unknown> = {}
      for (const [col, fieldKey] of Object.entries(columnMapping)) {
        if (!fieldKey) continue
        const def = fieldMap[fieldKey]
        if (!def) continue
        const val = coerceValue(String(row[col] ?? ''), def)
        if (val !== null) obj[fieldKey] = val
      }
      // attach project_id if the table needs it and user selected one
      if (projectId && ['tasks','budget_items','issues','daily_reports'].includes(targetTable)) {
        obj.project_id = projectId
      }
      // specialty field for contractors is an array
      if (targetTable === 'contractors' && typeof obj.specialty === 'string') {
        obj.specialty = (obj.specialty as string).split(/[,、，]/).map((s: string) => s.trim()).filter(Boolean)
      }
      return obj
    })

    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: targetTable, records }),
    })
    const result = await res.json()
    setImportResult(result)
    setState('done')
  }

  function reset() {
    setState('idle'); setParsed(null); setMapResult(null)
    setFileName(''); setImportResult(null); setProjectId('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const needsProject = ['tasks', 'budget_items', 'issues', 'daily_reports'].includes(targetTable)
  const fields = TABLE_FIELDS[targetTable]

  return (
    <div className="flex flex-col h-full">
      <Header title="批量匯入" subtitle="支援 CSV、Excel、JSON 格式，自動對應欄位" />

      <div className="flex-1 p-8 space-y-6 max-w-5xl">

        {/* ── Step 1: Upload ── */}
        {state === 'idle' && (
          <Card>
            <CardContent className="p-8">
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-colors
                  ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
              >
                <div className="bg-blue-50 p-4 rounded-full">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-slate-700">拖曳檔案至此，或點擊上傳</p>
                  <p className="text-sm text-slate-400 mt-1">支援 .csv、.xlsx、.xls、.json 格式</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" onChange={onFileInput} />

              <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 space-y-1">
                <p className="font-medium text-slate-700 mb-2">支援自動對應的資料類型：</p>
                {TABLES.map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span><b>{TABLE_LABELS[t]}</b>：{TABLE_FIELDS[t].map(f => f.label).join('、')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Mapping ── */}
        {(state === 'mapped' || state === 'importing') && parsed && (
          <>
            {/* File info + table selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{fileName}</p>
                      <p className="text-xs text-slate-400">{parsed.rows.length} 筆資料，{parsed.columns.length} 個欄位</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">匯入至：</span>
                    <div className="relative">
                      <select
                        value={targetTable}
                        onChange={e => changeTable(e.target.value as TargetTable)}
                        className="appearance-none px-3 py-1.5 pr-8 border border-slate-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TABLES.map(t => <option key={t} value={t}>{TABLE_LABELS[t]}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <button onClick={reset} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="重新上傳">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {mapResult && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    {parsed?.detectedFormat
                      ? `偵測格式：${parsed.detectedFormat}　→　自動歸類為「${TABLE_LABELS[mapResult.detectedTable]}」`
                      : `自動偵測為「${TABLE_LABELS[mapResult.detectedTable]}」資料（信心度 ${mapResult.tableScore} 分）`
                    }
                    {mapResult.detectedTable !== targetTable && (
                      <span className="text-orange-600 ml-1">（已手動切換至「{TABLE_LABELS[targetTable]}」）</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project selector (for tables that need project_id) */}
            {needsProject && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">關聯專案：</span>
                    <div className="relative flex-1 max-w-xs">
                      <select
                        value={projectId}
                        onChange={e => setProjectId(e.target.value)}
                        className="w-full appearance-none px-3 py-1.5 pr-8 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— 不指定專案 —</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <span className="text-xs text-slate-400">（若資料中有「專案名稱」欄位會自動嘗試比對）</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Column mapping table */}
            <Card>
              <CardHeader><CardTitle>欄位對應設定</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 w-1/3">來源欄位</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 w-1/3">對應欄位</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">預覽（前3筆）</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.columns.map(col => (
                      <tr key={col} className={columnMapping[col] ? '' : 'opacity-50'}>
                        <td className="px-4 py-2 font-mono text-slate-700">{col}</td>
                        <td className="px-4 py-2">
                          <select
                            value={columnMapping[col] ?? ''}
                            onChange={e => setColMap(col, e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">— 忽略 —</option>
                            {fields.map(f => (
                              <option key={f.key} value={f.key}>{f.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-slate-400 text-xs truncate max-w-xs">
                          {parsed.rows.slice(0, 3).map(r => r[col]).filter(Boolean).join('、')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Data preview */}
            <Card>
              <CardHeader><CardTitle>資料預覽（前 5 筆）</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {parsed.columns.filter(c => columnMapping[c]).map(col => (
                        <th key={col} className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">
                          {fields.find(f => f.key === columnMapping[col])?.label ?? col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsed.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {parsed.columns.filter(c => columnMapping[c]).map(col => (
                          <td key={col} className="px-3 py-2 text-slate-600 max-w-[200px] truncate">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={doImport} loading={state === 'importing'}>
                匯入 {parsed.rows.length} 筆資料到「{TABLE_LABELS[targetTable]}」
              </Button>
              <Button variant="secondary" onClick={reset}>取消</Button>
            </div>
          </>
        )}

        {/* ── Step 3: Result ── */}
        {state === 'done' && importResult && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              {importResult.fail === 0 ? (
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              ) : importResult.ok === 0 ? (
                <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              ) : (
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
              )}
              <div>
                <p className="text-xl font-bold text-slate-800">
                  成功匯入 {importResult.ok} 筆
                  {importResult.fail > 0 && `，失敗 ${importResult.fail} 筆`}
                </p>
                <p className="text-sm text-slate-500 mt-1">資料已匯入「{TABLE_LABELS[targetTable]}」</p>
              </div>
              {importResult.errors.length > 0 && (
                <div className="text-left bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 font-mono">{e}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={reset}>繼續匯入</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
