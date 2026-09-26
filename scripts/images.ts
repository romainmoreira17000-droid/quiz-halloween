/** @file CLI: converts the illustrations of images-sources/ into light WebP files in public/images/. */
import { mkdirSync, readdirSync } from 'node:fs'
import sharp from 'sharp'
import { toWebpName } from './slug'

const SOURCE = 'images-sources'
// Wide enough for a tablet held landscape; the PWA precaches every image, so each must stay light.
const MAX_WIDTH = 1920
const QUALITY = 72

mkdirSync('public/images', { recursive: true })
for (const file of readdirSync(SOURCE).filter((name) => /\.(png|jpe?g)$/i.test(name))) {
  const target = `public/images/${toWebpName(file)}`
  const info = await sharp(`${SOURCE}/${file}`).resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY }).toFile(target)
  console.log(`✅ ${file} → ${target} (${Math.round(info.size / 1024)} Ko)`)
}
