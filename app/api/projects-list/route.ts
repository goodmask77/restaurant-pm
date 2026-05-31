import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data } = await supabase.from('projects').select('id, name').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}
