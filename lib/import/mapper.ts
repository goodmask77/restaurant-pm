// Auto-mapping: detects which Supabase table a set of columns belongs to,
// and maps each source column to a destination field.

export type TargetTable = 'projects' | 'tasks' | 'contractors' | 'budget_items' | 'issues' | 'daily_reports'

export interface FieldDef {
  key: string
  label: string        // display name
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean'
  required?: boolean
  enumValues?: string[]
}

export const TABLE_LABELS: Record<TargetTable, string> = {
  projects: '專案',
  tasks: '工程項目',
  contractors: '承包商',
  budget_items: '預算項目',
  issues: '工程問題',
  daily_reports: '工地日報',
}

export const TABLE_FIELDS: Record<TargetTable, FieldDef[]> = {
  projects: [
    { key: 'name', label: '專案名稱', type: 'text', required: true },
    { key: 'description', label: '描述', type: 'text' },
    { key: 'location', label: '地址/位置', type: 'text' },
    { key: 'restaurant_type', label: '餐廳類型', type: 'enum', enumValues: ['中餐','西餐','日式','火鍋','咖啡廳','快餐','其他'] },
    { key: 'area_sqm', label: '面積(坪)', type: 'number' },
    { key: 'floors', label: '樓層數', type: 'number' },
    { key: 'start_date', label: '開工日期', type: 'date' },
    { key: 'end_date', label: '完工日期', type: 'date' },
    { key: 'budget_total', label: '總預算', type: 'number' },
    { key: 'project_manager', label: '專案負責人', type: 'text' },
    { key: 'site_supervisor', label: '現場監工', type: 'text' },
    { key: 'status', label: '狀態', type: 'enum', enumValues: ['planning','in_progress','paused','completed','cancelled'] },
  ],
  tasks: [
    { key: 'title', label: '工項名稱', type: 'text', required: true },
    { key: 'description', label: '描述', type: 'text' },
    { key: 'category', label: '工程類別', type: 'enum', enumValues: ['土建','水電','空調','裝修','設備','消防','驗收','其他'] },
    { key: 'status', label: '狀態', type: 'enum', enumValues: ['pending','in_progress','completed','blocked'] },
    { key: 'priority', label: '優先級', type: 'enum', enumValues: ['low','medium','high','urgent'] },
    { key: 'start_date', label: '開始日期', type: 'date' },
    { key: 'due_date', label: '截止日期', type: 'date' },
    { key: 'assigned_to', label: '負責人', type: 'text' },
    { key: 'progress', label: '進度(%)', type: 'number' },
    { key: 'notes', label: '備註', type: 'text' },
  ],
  contractors: [
    { key: 'name', label: '廠商名稱', type: 'text', required: true },
    { key: 'company', label: '公司名稱', type: 'text' },
    { key: 'contact_person', label: '聯絡人', type: 'text' },
    { key: 'phone', label: '電話', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'specialty', label: '專長/工種', type: 'text' },
    { key: 'rating', label: '評分', type: 'number' },
    { key: 'status', label: '狀態', type: 'enum', enumValues: ['active','inactive'] },
    { key: 'notes', label: '備註', type: 'text' },
  ],
  budget_items: [
    { key: 'item_name', label: '項目名稱', type: 'text', required: true },
    { key: 'category', label: '工程類別', type: 'enum', enumValues: ['土建','水電','空調','裝修','設備','消防','驗收','其他'] },
    { key: 'budgeted_amount', label: '預算金額', type: 'number' },
    { key: 'actual_amount', label: '實際金額', type: 'number' },
    { key: 'paid_amount', label: '已付金額', type: 'number' },
    { key: 'payment_status', label: '付款狀態', type: 'enum', enumValues: ['pending','partial','paid'] },
    { key: 'invoice_no', label: '發票號碼', type: 'text' },
    { key: 'notes', label: '備註', type: 'text' },
  ],
  issues: [
    { key: 'title', label: '問題標題', type: 'text', required: true },
    { key: 'description', label: '描述', type: 'text' },
    { key: 'severity', label: '嚴重程度', type: 'enum', enumValues: ['low','medium','high','critical'] },
    { key: 'status', label: '狀態', type: 'enum', enumValues: ['open','in_progress','resolved','closed'] },
    { key: 'reported_by', label: '回報人', type: 'text' },
    { key: 'assigned_to', label: '處理人', type: 'text' },
    { key: 'resolution_notes', label: '解決說明', type: 'text' },
  ],
  daily_reports: [
    { key: 'report_date', label: '日期', type: 'date', required: true },
    { key: 'weather', label: '天氣', type: 'text' },
    { key: 'workers_count', label: '工人數量', type: 'number' },
    { key: 'work_summary', label: '工作摘要', type: 'text' },
    { key: 'progress_update', label: '進度更新', type: 'text' },
    { key: 'issues_encountered', label: '遇到問題', type: 'text' },
    { key: 'next_day_plan', label: '明日計劃', type: 'text' },
    { key: 'reported_by', label: '填報人', type: 'text' },
  ],
}

// Keywords for detecting field mappings (lowercase)
const FIELD_KEYWORDS: Record<TargetTable, Record<string, string[]>> = {
  projects: {
    name: ['專案名稱','名稱','項目名稱','project name','name','project'],
    description: ['描述','說明','備註說明','description','desc'],
    location: ['地址','位置','地點','location','address','addr'],
    restaurant_type: ['餐廳類型','類型','餐廳','restaurant type','type'],
    area_sqm: ['面積','坪數','area','sqm','坪'],
    floors: ['樓層','層數','floor','floors'],
    start_date: ['開工日期','開始日期','start date','start','開工'],
    end_date: ['完工日期','結束日期','預計完工','end date','end','完工'],
    budget_total: ['總預算','預算','budget','total budget'],
    project_manager: ['專案負責人','負責人','pm','project manager','manager'],
    site_supervisor: ['現場監工','監工','supervisor','site supervisor'],
    status: ['狀態','status'],
  },
  tasks: {
    title: ['工項名稱','工項','任務','名稱','title','task','item'],
    description: ['描述','說明','description','desc'],
    category: ['類別','工程類別','category','work type','工種'],
    status: ['狀態','status'],
    priority: ['優先級','優先','priority'],
    start_date: ['開始日期','start date','start','開始'],
    due_date: ['截止日期','到期日','due date','due','截止','期限'],
    assigned_to: ['負責人','承辦人','assigned to','assignee','指派'],
    progress: ['進度','完成度','progress','%','percent'],
    notes: ['備註','notes','remark','note'],
  },
  contractors: {
    name: ['廠商名稱','廠商','承包商','名稱','contractor','name','vendor'],
    company: ['公司名稱','公司','company','firm'],
    contact_person: ['聯絡人','聯絡','contact','contact person','聯絡窗口'],
    phone: ['電話','手機','tel','phone','mobile','聯絡電話'],
    email: ['email','電郵','mail','e-mail'],
    specialty: ['專長','工種','specialty','service','服務項目','專業'],
    rating: ['評分','評級','rating','score','分數'],
    status: ['狀態','status'],
    notes: ['備註','notes','remark'],
  },
  budget_items: {
    item_name: ['項目名稱','工程名稱','項目內容','項目','品項','item','item name','name','名稱'],
    category: ['類別','工程類別','工程分類','category','分類'],
    budgeted_amount: ['預算金額','複價','複　　價','複　价','小計金額','合計','預算','budgeted','budget amount','預算額','總價'],
    actual_amount: ['實際金額','實際','actual','actual amount','實際費用'],
    paid_amount: ['已付金額','已付','paid','payment','付款'],
    payment_status: ['付款狀態','付款','payment status'],
    invoice_no: ['發票號碼','發票','invoice','inv no','統一編號'],
    notes: ['備註','備　　　註','備注','notes','remark'],
  },
  issues: {
    title: ['問題標題','標題','問題','title','issue','problem'],
    description: ['描述','說明','description','detail'],
    severity: ['嚴重程度','嚴重性','severity','level','等級'],
    status: ['狀態','status'],
    reported_by: ['回報人','報告人','reported by','reporter'],
    assigned_to: ['處理人','負責人','assigned to','assignee'],
    resolution_notes: ['解決說明','處理說明','resolution','solution'],
  },
  daily_reports: {
    report_date: ['日期','報告日期','date','report date'],
    weather: ['天氣','weather'],
    workers_count: ['工人數量','人數','workers','worker count','人員','出工人數'],
    work_summary: ['工作摘要','今日工作','work summary','summary','工作內容'],
    progress_update: ['進度更新','進度','progress','update'],
    issues_encountered: ['遇到問題','問題','issues','problem encountered'],
    next_day_plan: ['明日計劃','隔日計劃','next day plan','plan','tomorrow'],
    reported_by: ['填報人','填寫人','reported by','reporter'],
  },
}

// Table-level keywords for detecting which table data belongs to
const TABLE_KEYWORDS: Record<TargetTable, string[]> = {
  projects: ['專案','project','工程案','工地'],
  tasks: ['工項','工程項目','task','任務','施工'],
  contractors: ['廠商','承包商','contractor','vendor','供應商'],
  budget_items: ['預算','budget','費用','金額','報價','估價','複價','單價','數量','工程名稱'],
  issues: ['問題','缺失','issue','defect','punch'],
  daily_reports: ['日報','daily','工地日報','每日'],
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[\s_\-\/]/g, '')
}

// Score how well a source column name matches a target field
function scoreField(col: string, keywords: string[]): number {
  const n = normalize(col)
  for (const kw of keywords) {
    const nkw = normalize(kw)
    if (n === nkw) return 10
    if (n.includes(nkw) || nkw.includes(n)) return 5
  }
  return 0
}

// For each source column, find the best-matching field in a given table
function mapColumnsToTable(cols: string[], table: TargetTable): Record<string, string> {
  const keywords = FIELD_KEYWORDS[table]
  const mapping: Record<string, string> = {}
  const usedFields = new Set<string>()

  for (const col of cols) {
    let bestField = ''
    let bestScore = 0
    for (const [field, kws] of Object.entries(keywords)) {
      if (usedFields.has(field)) continue
      const score = scoreField(col, kws)
      if (score > bestScore) { bestScore = score; bestField = field }
    }
    if (bestScore > 0) {
      mapping[col] = bestField
      usedFields.add(bestField)
    }
  }
  return mapping
}

// Score how likely a set of columns belongs to a given table
function scoreTable(cols: string[], table: TargetTable): number {
  const keywords = FIELD_KEYWORDS[table]
  let score = 0
  const colsNorm = cols.map(normalize)

  // Check table-level keywords in the column names
  for (const kw of TABLE_KEYWORDS[table]) {
    if (colsNorm.some(c => c.includes(normalize(kw)))) score += 3
  }

  // Count how many columns match a field
  for (const col of cols) {
    for (const kws of Object.values(keywords)) {
      if (scoreField(col, kws) > 0) { score += 1; break }
    }
  }
  return score
}

export interface AutoMapResult {
  detectedTable: TargetTable
  tableScore: number
  columnMapping: Record<string, string>   // sourceCol -> fieldKey ('' = ignore)
  allTableScores: Record<TargetTable, number>
}

export function autoMap(columns: string[]): AutoMapResult {
  const tables = Object.keys(TABLE_FIELDS) as TargetTable[]
  const scores = Object.fromEntries(
    tables.map(t => [t, scoreTable(columns, t)])
  ) as Record<TargetTable, number>

  const detectedTable = tables.reduce((a, b) => scores[a] >= scores[b] ? a : b)
  const columnMapping = mapColumnsToTable(columns, detectedTable)
  // Ensure all columns have an entry ('' = skip)
  for (const col of columns) {
    if (!(col in columnMapping)) columnMapping[col] = ''
  }

  return {
    detectedTable,
    tableScore: scores[detectedTable],
    columnMapping,
    allTableScores: scores,
  }
}

// Remap columns when user switches target table
export function remapForTable(columns: string[], table: TargetTable): Record<string, string> {
  const mapping = mapColumnsToTable(columns, table)
  for (const col of columns) {
    if (!(col in mapping)) mapping[col] = ''
  }
  return mapping
}

// Coerce a raw string value to the correct JS type for insertion
export function coerceValue(raw: string, field: FieldDef): unknown {
  if (raw === '' || raw == null) return null
  if (field.type === 'number') {
    const n = parseFloat(raw.replace(/,/g, ''))
    return isNaN(n) ? null : n
  }
  if (field.type === 'date') {
    // Accept YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD
    const cleaned = raw.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned
    // Try to parse and reformat
    const d = new Date(cleaned)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    return null
  }
  if (field.type === 'boolean') {
    return ['true','1','yes','是','啟用','active'].includes(raw.toLowerCase())
  }
  return raw.trim() || null
}
