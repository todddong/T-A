import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BUCKET = 'images'
const PREFIX = 'relationship-map/gallery'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

let ok = 0
let fail = 0
for (let i = 1; i <= 28; i++) {
  const from = `${PREFIX}/photo-${String(i).padStart(2, '0')}.jpg`
  const to = `${PREFIX}/${i}.jpg`
  const { error } = await supabase.storage.from(BUCKET).move(from, to)
  if (error) {
    console.error(`FAIL ${from} -> ${to}: ${error.message}`)
    fail++
  } else {
    console.log(`OK   ${from} -> ${to}`)
    ok++
  }
}
console.log(`\n${ok}/28 renamed (${fail} failed)`)
