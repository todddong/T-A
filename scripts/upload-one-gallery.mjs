import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BUCKET = 'images'
const PREFIX = 'relationship-map/gallery'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const [, , inputPath, indexArg] = process.argv
if (!inputPath || !indexArg) {
  console.error('Usage: node scripts/upload-one-gallery.mjs <input-file> <index>')
  process.exit(1)
}
const orderIndex = parseInt(indexArg, 10)
if (!Number.isFinite(orderIndex)) {
  console.error('Index must be a number')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Re-encode to a web-friendly size + JPEG quality. Honour EXIF orientation
// in case the source was captured rotated.
const raw = readFileSync(inputPath)
const buf = await sharp(raw)
  .rotate()
  .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 85 })
  .toBuffer()

const dest = `${PREFIX}/${orderIndex}.jpg`
const { error: upErr } = await supabase.storage.from(BUCKET).upload(dest, buf, {
  contentType: 'image/jpeg',
  upsert: true,
})
if (upErr) {
  console.error(`Storage upload failed: ${upErr.message}`)
  process.exit(1)
}
console.log(`Uploaded -> ${dest} (${(buf.length / 1024).toFixed(0)} KB)`)
console.log(`Now add the DB row with image_path = ${dest}, order_index = ${orderIndex}.`)
