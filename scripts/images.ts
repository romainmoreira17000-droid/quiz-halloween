/** @file CLI: converts the illustrations of images-sources/ into light WebP files in public/images/. */
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
import { toWebpName } from './slug'
import { pickSourceImages } from './sources'

const SOURCE = 'images-sources'
// Wide enough for a tablet held landscape; the PWA precaches every image, so each must stay light.
const MAX_WIDTH = 1920
const QUALITY = 72

const sources = pickSourceImages(existsSync(SOURCE) ? readdirSync(SOURCE) : null)
if (!sources.ok) {
  console.error(`❌ ${sources.message}`)
  process.exit(1)
}

mkdirSync('public/images', { recursive: true })
for (const file of sources.files) {
  const target = `public/images/${toWebpName(file)}`
  const info = await sharp(`${SOURCE}/${file}`).resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY }).toFile(target)
  console.log(`✅ ${file} → ${target} (${Math.round(info.size / 1024)} Ko)`)
}
