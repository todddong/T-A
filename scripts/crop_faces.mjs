import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '..', 'public')

// Todd: face center is at (1981, 2622) in the rotation-corrected 4284 x 5712
// frame. Zoomed-out crop of 3000 x 3000 keeps the face dead center.
async function cropTodd() {
  const size = 3000
  const cx = 1981
  const cy = 2622
  await sharp(path.join(publicDir, 'todd_src.jpg'))
    .rotate()
    .extract({
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
    })
    .resize(600, 600)
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, 'todd.jpg'))
}

// Annissa: face center is near (1004, 492) in the 3024 x 4032 frame. The face
// sits close to the top edge of the original, so to zoom out without showing
// any black padding at the top we align the crop with y = 0 in the source.
// The face ends up in the upper portion of the circle, which corresponds to
// the photo being shifted downward inside the frame.
async function cropAnnissa() {
  const size = 1800
  const cx = 1004
  await sharp(path.join(publicDir, 'annissa_src.jpg'))
    .rotate()
    .extract({
      left: cx - size / 2,
      top: 0,
      width: size,
      height: size,
    })
    .resize(600, 600)
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, 'annissa.jpg'))
}

await cropTodd()
await cropAnnissa()
console.log('Done.')
