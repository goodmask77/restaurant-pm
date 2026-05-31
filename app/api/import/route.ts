import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const ALLOWED_TABLES = ['projects', 'tasks', 'contractors', 'budget_items', 'issues', 'daily_reports']

export async function POST(req: NextRequest) {
  const { table, records } = await req.json()

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }
  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ ok: 0, fail: 0, errors: [] })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  let ok = 0
  const errors: string[] = []

  // Insert in batches of 50 for better error reporting
  const BATCH = 50
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH)
    const { error, count } = await supabase.from(table).insert(batch, { count: 'exact' })
    if (error) {
      // Try inserting one-by-one to pinpoint bad rows
      for (let j = 0; j < batch.length; j++) {
        const { error: rowErr } = await supabase.from(table).insert(batch[j])
        if (rowErr) {
          errors.push(`第 ${i + j + 1} 筆：${rowErr.message}`)
        } else {
          ok++
        }
      }
    } else {
      ok += count ?? batch.length
    }
  }

  return NextResponse.json({ ok, fail: errors.length, errors })
}
