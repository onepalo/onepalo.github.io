export const BASE_CHARACTER_COUNT = 6
const FRAME_HEIGHT = 32

type Range = [number, number]

/** Selects palette pixels by HSL (hue in degrees, saturation/lightness 0-1) and repaints them. */
export interface Recolor {
  hue?: Range
  saturation?: Range
  lightness?: Range
  /** Only recolor pixels at or above this row inside each 32px frame (e.g. hair, not shoes). */
  maxFrameRow?: number
  to: { hue: number; saturation: number; lightnessScale?: number; lightnessOffset?: number }
}

export interface CharacterLook {
  base: number
  recolors: Recolor[]
}

/**
 * One look per agent, in agent order. The six Pixel Agents sheets are used as-is first; extra
 * team members reuse a base sheet with different hair and clothing so nobody looks like a twin.
 */
export const CHARACTER_LOOKS: CharacterLook[] = [
  { base: 0, recolors: [] },
  { base: 1, recolors: [] },
  { base: 2, recolors: [] },
  { base: 3, recolors: [] },
  { base: 4, recolors: [] },
  { base: 5, recolors: [] },
  {
    // Auburn hair and a teal dress.
    base: 1,
    recolors: [
      { hue: [22, 40], saturation: [0.45, 1], to: { hue: 10, saturation: 0.75, lightnessScale: 0.85 } },
      { saturation: [0, 0.08], lightness: [0.03, 0.2], to: { hue: 172, saturation: 0.45, lightnessOffset: 0.1 } },
    ],
  },
  {
    // Blond hair and a khaki field shirt.
    base: 4,
    recolors: [
      { hue: [10, 35], saturation: [0.45, 1], lightness: [0, 0.32], to: { hue: 40, saturation: 0.62, lightnessScale: 2.2, lightnessOffset: 0.08 } },
      { saturation: [0, 0.03], lightness: [0.6, 1], to: { hue: 78, saturation: 0.28, lightnessScale: 0.86 } },
    ],
  },
  {
    // Silver hair and a blue shirt.
    base: 2,
    recolors: [
      { hue: [340, 35], saturation: [0.6, 1], to: { hue: 232, saturation: 0.62, lightnessScale: 0.95 } },
      { saturation: [0, 0.12], lightness: [0.05, 0.18], maxFrameRow: 14, to: { hue: 30, saturation: 0.06, lightnessOffset: 0.5 } },
    ],
  },
]

export function lookForAgent(index: number): CharacterLook {
  return CHARACTER_LOOKS[index % CHARACTER_LOOKS.length]
}

function inRange(value: number, range: Range | undefined) {
  if (!range) return true
  const [min, max] = range
  // Hue ranges may wrap around 360 (e.g. [340, 35] covers reds).
  return min <= max ? value >= min && value <= max : value >= min || value <= max
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2
  if (max === min) return [0, 0, lightness]
  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue: number
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0)
  else if (max === green) hue = (blue - red) / delta + 2
  else hue = (red - green) / delta + 4
  return [hue * 60, saturation, lightness]
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const sector = hue / 60
  const x = chroma * (1 - Math.abs((sector % 2) - 1))
  const [r, g, b] = sector < 1 ? [chroma, x, 0]
    : sector < 2 ? [x, chroma, 0]
      : sector < 3 ? [0, chroma, x]
        : sector < 4 ? [0, x, chroma]
          : sector < 5 ? [x, 0, chroma]
            : [chroma, 0, x]
  const m = lightness - chroma / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Recolors RGBA pixel data in place according to the look's rules (first matching rule wins). */
export function recolorPixels(data: Uint8ClampedArray, width: number, recolors: Recolor[]) {
  if (!recolors.length) return
  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] === 0) continue
    const [hue, saturation, lightness] = rgbToHsl(data[offset], data[offset + 1], data[offset + 2])
    const frameRow = Math.floor(offset / 4 / width) % FRAME_HEIGHT
    const rule = recolors.find((candidate) => inRange(hue, candidate.hue)
      && inRange(saturation, candidate.saturation)
      && inRange(lightness, candidate.lightness)
      && (candidate.maxFrameRow === undefined || frameRow <= candidate.maxFrameRow))
    if (!rule) continue
    const nextLightness = clamp01(lightness * (rule.to.lightnessScale ?? 1) + (rule.to.lightnessOffset ?? 0))
    const [r, g, b] = hslToRgb(rule.to.hue, clamp01(rule.to.saturation), nextLightness)
    data[offset] = r
    data[offset + 1] = g
    data[offset + 2] = b
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load character sheet ${src}`))
    image.src = src
  })
}

/** Loads the base sheets once and returns one canvas per agent look. */
export async function buildCharacterSheets(sheetUrl: (base: number) => string): Promise<HTMLCanvasElement[]> {
  const images = await Promise.all(Array.from({ length: BASE_CHARACTER_COUNT }, (_, base) => loadImage(sheetUrl(base))))
  return CHARACTER_LOOKS.map((look) => {
    const image = images[look.base]
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('2D canvas is not available for character sheets')
    context.imageSmoothingEnabled = false
    context.drawImage(image, 0, 0)
    if (look.recolors.length) {
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      recolorPixels(pixels.data, canvas.width, look.recolors)
      context.putImageData(pixels, 0, 0)
    }
    return canvas
  })
}
