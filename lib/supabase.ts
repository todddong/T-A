import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

const STORAGE_BUCKET = 'images'

// Resolve a stored image path into a public URL served from Supabase Storage.
// Paths in the database look like "relationship-map/photos/porch.jpg" and live
// inside the public "images" bucket.
export function getPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const trimmed = path.replace(/^\/+/, '')
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(trimmed)
  return data.publicUrl
}

export type Memory = {
  id: string
  title: string
  location: string
  caption: string
  image_path: string | null
  lng: number
  lat: number
  happened_on: string | null
  order_index: number
  city: string
  state: string
}

export type GalleryPhoto = {
  id: string
  image_path: string
  caption: string | null
  order_index: number
}

export type Person = 'todd' | 'annissa'

export type CityInfo = {
  city: string
  state: string
}

export type CityRanking = {
  id: string
  person: Person
  city: string
  state: string
  rank: number | null
  updated_at: string
}
