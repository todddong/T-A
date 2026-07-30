const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v', '.avi']

// Storage paths/URLs work the same for any file type — this is the only
// bit that decides whether to render a <video> or an <img>.
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext))
}
