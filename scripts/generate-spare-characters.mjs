import assert from 'node:assert/strict'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const charactersDirectory = new URL('../public/assets/agent-office/characters/', import.meta.url)
const outputDirectory = new URL('spares/', charactersDirectory)
const verifyOnly = process.argv.includes('--check')

const palettes = {
  1: {
    hair: ['7e4b29', 'be7743', 'e39f5a', 'f1c084'],
    skin: ['c5896e', 'bd8068', 'e29878', 'e9a384', 'fbbf97', 'ffd8b2'],
    outfit: ['101010', '252525', '2b2b2b'],
  },
  3: {
    hair: ['b0a6a3', 'bfb6b3', 'daccc9', 'e9d7d4', 'f0e1de', 'fff1ef'],
    skin: ['8c583f', 'ac6847', 'b67352', 'e08d64', 'ffa77c'],
    outfit: ['bdbdbd', 'd4d4d4', 'eeeeee'],
  },
  4: {
    hair: ['2f160f', '432415', '442414', '57351a', '69451b'],
    skin: ['c5896e', 'bd8068', 'e29878', 'e9a384', 'fbbf97', 'ffd8b2'],
    outfit: ['bdbdbd', 'd4d4d4', 'eeeeee'],
  },
}

const skinTones = {
  warm: ['85523b', '945e43', 'ac7553', 'bc8765', 'd8a47d', 'ecc39c'],
  deep: ['452d27', '52362d', '654436', '795441', '936b50', 'b08868'],
  light: ['bd8975', 'ce9984', 'dda991', 'ecc0a5', 'f7d5ba', 'ffe6d0'],
}

const spares = [
  { name: 'Teal / Auburn', base: 1, hair: ['512a25', '8a4031', 'bd6543', 'e39b65'], skin: 'warm', outfit: ['123c40', '20636a', '34838a'] },
  { name: 'Navy / Silver', base: 4, hair: ['424854', '697381', '717b89', 'a0aab5', 'd2dae0'], skin: 'deep', outfit: ['263e66', '3b5984', '637ca2'] },
  { name: 'Olive / Dark', base: 3, hair: ['191b23', '242731', '353846', '424655', '4c5261', '646b7b'], skin: 'light', outfit: ['485239', '69754b', '8c9968'] },
  { name: 'Plum / Blonde', base: 1, hair: ['78603c', 'b19254', 'd7bb73', 'f3dc9d'], skin: 'deep', outfit: ['412541', '6e3c69', '995d8b'] },
  { name: 'Rust / Black', base: 4, hair: ['11131b', '242633', '2b2d3a', '393c4c', '515568'], skin: 'warm', outfit: ['8a4735', 'b56848', 'd99b6b'] },
  { name: 'Blue / Copper', base: 3, hair: ['63352b', '7c4231', 'a35c3c', 'b96f47', 'cc8655', 'e5ad77'], skin: 'light', outfit: ['305f7c', '4886a6', '75b6ca'] },
  { name: 'Coral / Chestnut', base: 1, hair: ['35261f', '62422e', '89613e', 'b88d5b'], skin: 'light', outfit: ['713941', 'ad5660', 'd98283'] },
  { name: 'Forest / Blonde', base: 4, hair: ['705337', '9d7746', 'a8804d', 'c8a568', 'e9cd8c'], skin: 'deep', outfit: ['264b3d', '3f7055', '719978'] },
  { name: 'Gold / Silver', base: 3, hair: ['505363', '686e7d', '969dac', 'adb5c3', 'c7ced9', 'e4e9f0'], skin: 'warm', outfit: ['8a672c', 'b89443', 'ddbd6b'] },
  { name: 'Violet / Brunette', base: 4, hair: ['2b2026', '48313b', '503742', '6c4c56', '936b73'], skin: 'light', outfit: ['55416e', '7b5f99', 'a88abd'] },
]

function filename(index) {
  return `spare_${String(index + 1).padStart(2, '0')}.png`
}

function recolor(data, base, spare) {
  const replacements = new Map()
  for (const part of ['hair', 'skin', 'outfit']) {
    const target = part === 'skin' ? skinTones[spare.skin] : spare[part]
    const source = palettes[base][part]
    source.forEach((hex, index) => {
      const targetIndex = Math.round(index * (target.length - 1) / (source.length - 1))
      replacements.set(hex, Buffer.from(target[targetIndex], 'hex'))
    })
  }
  const result = Buffer.from(data)
  for (let offset = 0; offset < result.length; offset += 4) {
    if (result[offset + 3] === 0) continue
    const replacement = replacements.get(data.subarray(offset, offset + 3).toString('hex'))
    if (replacement) replacement.copy(result, offset)
  }
  return result
}

async function decode(path) {
  return sharp(fileURLToPath(path)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
}

if (!verifyOnly) await mkdir(outputDirectory, { recursive: true })
const sheets = []
for (const [index, spare] of spares.entries()) {
  const source = await decode(new URL(`char_${spare.base}.png`, charactersDirectory))
  assert.equal(source.info.width, 112)
  assert.equal(source.info.height, 96)
  const raw = { width: 112, height: 96, channels: 4 }
  const pixels = recolor(source.data, spare.base, spare)
  assert.notDeepEqual(pixels, source.data, `${filename(index)} must have a new palette`)
  for (let offset = 3; offset < pixels.length; offset += 4) {
    assert.equal(pixels[offset], source.data[offset], 'Transparency must be preserved')
  }
  const output = new URL(filename(index), outputDirectory)
  if (!verifyOnly) await sharp(pixels, { raw }).png().toFile(fileURLToPath(output))
  const saved = await decode(output)
  assert.equal(saved.info.width, raw.width)
  assert.equal(saved.info.height, raw.height)
  assert.deepEqual(saved.data, pixels, `${filename(index)} must match its generated palette`)
  sheets.push(pixels)
}
assert.equal(new Set(sheets.map((sheet) => sheet.toString('hex'))).size, 10, 'All ten sheets must be unique')
const files = await readdir(outputDirectory)
assert.equal(files.filter((name) => /^spare_.*\.png$/.test(name)).length, 10)

const previews = await Promise.all(sheets.map(async (pixels, index) => ({
  input: await sharp(pixels, { raw: { width: 112, height: 96, channels: 4 } })
    .extract({ left: 0, top: 0, width: 16, height: 32 })
    .resize(64, 128, { kernel: 'nearest' })
    .png().toBuffer(),
  left: (index % 5) * 160 + 48,
  top: Math.floor(index / 5) * 176 + 4,
})))
const labels = spares.map((spare, index) =>
  `<text x="${(index % 5) * 160 + 80}" y="${Math.floor(index / 5) * 176 + 154}">${String(index + 1).padStart(2, '0')} ${spare.name}</text>`,
).join('')
const preview = await sharp({ create: { width: 800, height: 352, channels: 4, background: '#eef1f5' } })
  .composite([...previews, {
    input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="352"><g font-family="sans-serif" font-size="12" text-anchor="middle" fill="#243044">${labels}</g></svg>`),
    left: 0,
    top: 0,
  }]).png().toBuffer()
const previewPath = new URL('preview.png', outputDirectory)
if (!verifyOnly) await sharp(preview).toFile(fileURLToPath(previewPath))
const savedPreview = await readFile(previewPath)
assert.deepEqual(
  await sharp(savedPreview).raw().toBuffer(),
  await sharp(preview).raw().toBuffer(),
  'The preview must show the current spare characters',
)
console.log(`${verifyOnly ? 'Verified' : 'Generated and verified'} 10 spare sprite sheets and preview. Active characters are unchanged.`)
