import {
  supabase,
  getPhotoUrl,
  type Memory,
  type GalleryPhoto,
  type CityInfo,
  type CityRanking,
} from '@/lib/supabase'
import MapView from './MapView'
import GalleryGrid from './GalleryGrid'
import AnniversaryCountdown from './AnniversaryCountdown'
import CityRankings from './CityRankings'

export const revalidate = 60

async function getMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('relationship_memories')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Failed to load memories:', error.message)
    return []
  }
  return (data ?? []) as Memory[]
}

async function getGallery(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from('relationship_gallery')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Failed to load gallery:', error.message)
    return []
  }
  return (data ?? []) as GalleryPhoto[]
}

// Distinct (city, state) pairs derived from the map memories — this is what
// makes the ranking lists automatically grow as new-city memories are added.
function getCitiesFromMemories(memories: Memory[]): CityInfo[] {
  const seen = new Map<string, CityInfo>()
  for (const m of memories) {
    if (!m.city || !m.state) continue
    const key = `${m.city}|${m.state}`
    if (!seen.has(key)) seen.set(key, { city: m.city, state: m.state })
  }
  return Array.from(seen.values()).sort((a, b) =>
    `${a.city}, ${a.state}`.localeCompare(`${b.city}, ${b.state}`)
  )
}

async function getRankings(): Promise<CityRanking[]> {
  const { data, error } = await supabase.from('relationship_city_rankings').select('*')

  if (error) {
    console.error('Failed to load city rankings:', error.message)
    return []
  }
  return (data ?? []) as CityRanking[]
}

export default async function Home() {
  const [memories, gallery, rankings] = await Promise.all([
    getMemories(),
    getGallery(),
    getRankings(),
  ])

  // Pre-resolve public photo URLs on the server so the client never has to
  // know about Supabase storage paths.
  const memoriesWithUrls = memories.map((m) => ({
    ...m,
    image_url: getPhotoUrl(m.image_path),
  }))

  const galleryWithUrls = gallery.map((g) => ({
    ...g,
    image_url: getPhotoUrl(g.image_path),
  }))

  const cities = getCitiesFromMemories(memories)

  const toddRanks: Record<string, number | null> = {}
  const annissaRanks: Record<string, number | null> = {}
  for (const r of rankings) {
    const key = `${r.city}|${r.state}`
    if (r.person === 'todd') toddRanks[key] = r.rank
    if (r.person === 'annissa') annissaRanks[key] = r.rank
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <section className="relative z-10 pt-16 sm:pt-20 pb-8 px-6 flex flex-col items-center">
        <AnniversaryCountdown />
        <div className="mt-2 flex items-center gap-3 sm:gap-4">
          <span
            style={{ fontFamily: 'var(--font-serif-display), Georgia, serif' }}
            className="h-24 sm:h-28 md:h-32 flex items-center font-normal leading-none text-white text-4xl sm:text-5xl md:text-6xl"
          >
            Todd
          </span>
          <div className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mirror.jpg"
              alt="Todd and Annissa"
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <span
            style={{ fontFamily: 'var(--font-serif-display), Georgia, serif' }}
            className="h-24 sm:h-28 md:h-32 flex items-center font-normal leading-none text-white text-4xl sm:text-5xl md:text-6xl"
          >
            Annissa
          </span>
        </div>
      </section>

      <section className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-start max-w-6xl mx-auto lg:max-w-none">
          <div className="order-2 lg:order-1 lg:shrink-0">
            <CityRankings
              person="todd"
              label="Todd"
              avatarSrc="/todd.jpg"
              cities={cities}
              initialRanks={toddRanks}
            />
          </div>

          <div className="order-1 lg:order-2 flex-1 min-w-0">
            <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden border border-pink-400/20 shadow-[0_0_60px_-20px_rgba(255,61,119,0.6)]">
              <MapView memories={memoriesWithUrls} />
            </div>
          </div>

          <div className="order-3 lg:shrink-0">
            <CityRankings
              person="annissa"
              label="Annissa"
              avatarSrc="/annissa.jpg"
              cities={cities}
              initialRanks={annissaRanks}
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 pt-16 pb-12 px-6 max-w-6xl mx-auto w-full">
        <h2
          style={{ fontFamily: 'var(--font-script), "Brush Script MT", cursive' }}
          className="font-bold text-2xl sm:text-3xl text-center text-white mb-8"
        >
          more photos
        </h2>

        <GalleryGrid photos={galleryWithUrls} />
      </section>

    </main>
  )
}
