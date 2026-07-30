import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Person } from '@/lib/supabase'

const PEOPLE: Person[] = ['todd', 'annissa']
const MAX_ITEMS = 500

type OrderItem = { city: string; state: string }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const person = body?.person as Person | undefined
  const order = body?.order as unknown

  if (!person || !PEOPLE.includes(person)) {
    return NextResponse.json({ error: 'Invalid person' }, { status: 400 })
  }
  if (!Array.isArray(order) || order.length === 0 || order.length > MAX_ITEMS) {
    return NextResponse.json({ error: 'Invalid order' }, { status: 400 })
  }

  const rows: { person: Person; city: string; state: string; rank: number; updated_at: string }[] = []
  for (let i = 0; i < order.length; i++) {
    const item = order[i] as Partial<OrderItem> | null
    const city = typeof item?.city === 'string' ? item.city.trim().slice(0, 200) : ''
    const state = typeof item?.state === 'string' ? item.state.trim().slice(0, 200) : ''
    if (!city || !state) {
      return NextResponse.json({ error: 'Invalid city entry' }, { status: 400 })
    }
    rows.push({ person, city, state, rank: i + 1, updated_at: new Date().toISOString() })
  }

  const { error } = await supabaseAdmin
    .from('relationship_city_rankings')
    .upsert(rows, { onConflict: 'person,city,state' })

  if (error) {
    console.error('Failed to save rankings:', error.message)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
