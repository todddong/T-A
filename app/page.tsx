import { supabase, getPhotoUrl, type Memory, type GalleryPhoto } from '@/lib/supabase'
import MapView from './MapView'
import GalleryGrid from './GalleryGrid'

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

export default async function Home() {
  const [memories, gallery] = await Promise.all([getMemories(), getGallery()])

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

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <section className="relative z-10 flex flex-col items-center justify-center pt-20 pb-12 px-6 text-center">
        <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/todd.jpg"
            alt="Todd"
            className="h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full object-cover border-2 border-pink-400/60 shadow-[0_0_30px_-5px_rgba(255,61,119,0.7)]"
          />
          <h1
            style={{ fontFamily: 'var(--font-script), "Brush Script MT", cursive' }}
            className="font-bold text-[3.5rem] sm:text-[5rem] md:text-[6rem] leading-[1] text-white"
          >
            T <span>+</span> A
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/annissa.jpg"
            alt="Annissa"
            className="h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full object-cover border-2 border-pink-400/60 shadow-[0_0_30px_-5px_rgba(255,61,119,0.7)]"
          />
        </div>
      </section>

      <section className="relative z-10 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="rounded-3xl overflow-hidden border border-pink-400/20 shadow-[0_0_60px_-20px_rgba(255,61,119,0.6)]">
          <MapView memories={memoriesWithUrls} />
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
