// Smart parser that handles real-world construction documents:
// - Skips company letterhead / metadata rows before the actual data
// - Detects and flattens 估價單 (quotation) category + sub-item structure
// - Filters summary rows (小計、總計、稅金...)
// - Cleans up column names

import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export interface ParsedData {
  columns: string[]
  rows: Record<string, string>[]
  detectedFormat?: string
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const SKIP_CELL_PATTERNS = [
  /^小計$/, /^總計$/, /^稅金$/, /^合計$/, /^subtotal$/i, /^total$/i,
  /^未稅$/, /^含稅$/, /^備用金/,
]

const CHINESE_NUMERALS = new Set([
  '一','二','三','四','五','六','七','八','九','十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
])

// A row looks like a header if it has ≥3 non-empty short string cells
function isHeaderCandidate(row: unknown[]): boolean {
  const textCells = row.filter(c =>
    typeof c === 'string' && c.trim().length > 0 && c.trim().length < 30
  )
  return textCells.length >= 3
}

// Rows like ["一", "假設工程", 1, "式", 364450, 364450, ""]
// — first cell is a Chinese numeral and second cell is a category name
function isCategoryHeaderRow(row: unknown[]): string | null {
  const first = String(row[0] ?? '').trim()
  const second = String(row[1] ?? '').trim()
  if (CHINESE_NUMERALS.has(first) && second.length > 0) return second
  return null
}

function isSummaryRow(row: unknown[]): boolean {
  return row.some(c => SKIP_CELL_PATTERNS.some(p => p.test(String(c ?? '').trim())))
}

function cleanColName(name: string): string {
  return name.replace(/[\s　]+/g, '').trim()
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────

function parseSheet(allRows: unknown[][]): { rows: Record<string, string>[]; columns: string[]; isQuotation: boolean } {
  // Find the actual header row (skip company letterhead)
  let headerIdx = 0
  for (let i = 0; i < Math.min(20, allRows.length); i++) {
    if (isHeaderCandidate(allRows[i])) {
      headerIdx = i
      break
    }
  }

  const rawHeaders = (allRows[headerIdx] as unknown[]).map(c => cleanColName(String(c)))
  const headerCols: { idx: number; name: string }[] = rawHeaders
    .map((n, idx) => ({ idx, name: n }))
    .filter(h => h.name.length > 0)

  const colNames = headerCols.map(h => h.name)
  const isQuotation = colNames.some(c => /複|單價|數量|複價/.test(c))

  let currentCategory = ''
  const rows: Record<string, string>[] = []

  for (const rawRow of allRows.slice(headerIdx + 1)) {
    const row = rawRow as unknown[]
    if (row.every(c => c === '' || c === null || c === undefined)) continue
    if (isSummaryRow(row)) continue

    if (isQuotation) {
      const cat = isCategoryHeaderRow(row)
      if (cat) { currentCategory = cat; continue }
    }

    const obj: Record<string, string> = {}
    for (const { idx, name } of headerCols) {
      obj[name] = String(row[idx] ?? '').trim()
    }
    if (isQuotation && currentCategory) obj['工程分類'] = currentCategory
    rows.push(obj)
  }

  const columns = [...colNames]
  if (rows.some(r => r['工程分類']) && !columns.includes('工程分類')) {
    columns.push('工程分類')
  }

  return { rows, columns, isQuotation }
}

export function parseXLSX(buffer: ArrayBuffer): ParsedData {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })

  // Parse all sheets, pick the one with the most data rows
  let bestResult: ReturnType<typeof parseSheet> | null = null
  for (const sheetName of wb.SheetNames) {
    const allRows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
      header: 1, defval: '', raw: false,
    }) as unknown[][]
    const result = parseSheet(allRows)
    if (!bestResult || result.rows.length > bestResult.rows.length) {
      bestResult = result
    }
  }

  const { rows, columns, isQuotation } = bestResult!

  return {
    columns,
    rows,
    detectedFormat: isQuotation ? '工程估價單（自動識別）' : undefined,
  }
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

export function parseCSV(text: string): ParsedData {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => cleanColName(h.trim()),
  })
  const columns = (result.meta.fields ?? []).filter(f => f.length > 0)
  return { columns, rows: result.data }
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

export function parseJSON(text: string): ParsedData {
  const parsed = JSON.parse(text)
  const arr: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed]
  const columns = arr.length > 0 ? Object.keys(arr[0]) : []
  const rows = arr.map(r =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? '')]))
  )
  return { columns, rows }
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export async function parseFile(file: File): Promise<ParsedData> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') {
    return parseXLSX(await file.arrayBuffer())
  } else if (ext === 'json') {
    return parseJSON(await file.text())
  } else {
    // CSV or unknown — try CSV
    return parseCSV(await file.text())
  }
}
