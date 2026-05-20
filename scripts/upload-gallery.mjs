import { createClient } from '@supabase/supabase-js'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BUCKET = 'images'
const PREFIX = 'relationship-map/gallery'
const SRC = '/tmp/relmap-upload'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Source files are named photo-01.jpg .. photo-28.jpg; we upload them as
// 1.jpg .. 28.jpg so they are easy to refer to by number.
const files = readdirSync(SRC)
  .filter((f) => f.startsWith('photo-') && f.endsWith('.jpg'))
  .sort()

let ok = 0
let fail = 0
for (const f of files) {
  const num = parseInt(f.replace('photo-', '').replace('.jpg', ''), 10)
  const buf = readFileSync(join(SRC, f))
  const dest = `${PREFIX}/${num}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(dest, buf, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) {
    console.error(`FAIL ${f} -> ${num}.jpg: ${error.message}`)
    fail++
  } else {
    console.log(`OK   ${f} -> ${dest}`)
    ok++
  }
}
console.log(`\n${ok}/${files.length} uploaded (${fail} failed)`)
