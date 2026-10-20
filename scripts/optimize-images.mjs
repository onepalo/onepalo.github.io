import { mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const candidateDirectory = new URL('../src/assets/candidate/', import.meta.url)
const outputDirectory = new URL('optimized/', candidateDirectory)
const images = [
  { source: 'rafael-navarro-portrait.png', output: 'rafael-navarro-portrait.webp', width: 162 },
  { source: 'DesignerRN.png', output: 'DesignerRN.webp', width: 1260 },
  { source: 'Leader.png', output: 'Leader.webp', width: 1520 },
  { source: 'Cycling/DirtyCycling.png', output: 'DirtyCycling.webp', width: 1600 },
  { source: 'Cycling/RN_AirMonitor.png', output: 'RN_AirMonitor.webp', width: 1400 },
]

await mkdir(outputDirectory, { recursive: true })
for (const image of images) {
  const source = fileURLToPath(new URL(image.source, candidateDirectory))
  const output = fileURLToPath(new URL(image.output, outputDirectory))
  await sharp(source)
    .rotate()
    .resize({ width: image.width, withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 100, effort: 6 })
    .toFile(output)
  const originalSize = (await stat(source)).size
  const optimizedSize = (await stat(output)).size
  const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1)
  console.log(`${image.output}: ${originalSize} -> ${optimizedSize} bytes (${reduction}% smaller)`)
}