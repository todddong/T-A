import { supabase, getPhotoUrl, type Memory, type GalleryPhoto } from '@/lib/supabase'
import MapView from './MapView'

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
        <h1
          style={{ fontFamily: 'var(--font-script), "Brush Script MT", cursive' }}
          className="font-bold text-[3.5rem] sm:text-[5rem] md:text-[6rem] leading-[1] text-white"
        >
          T <span>+</span> A
        </h1>
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

        {galleryWithUrls.length === 0 ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {galleryWithUrls.map((photo) => (
              <figure
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden border border-pink-400/15 bg-zinc-900/40 transition hover:border-pink-400/40 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,61,119,0.55)]"
              >
                {photo.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? 'Memory photo'}
                    className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-72 w-full flex items-center justify-center text-pink-200/40 text-sm">
                    photo coming soon
                  </div>
                )}
                {photo.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm text-pink-50">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>

    </main>
  )
}
