import { describe, expect, it } from 'vitest'
import { CHARACTER_LOOKS, lookForAgent, recolorPixels } from './characterLooks'
import { initialAgents } from './simulation'

const pixel = (r: number, g: number, b: number) => new Uint8ClampedArray([r, g, b, 255])

describe('character looks', () => {
  it('gives every agent a distinct look', () => {
    expect(CHARACTER_LOOKS.length).toBeGreaterThanOrEqual(initialAgents.length)
    const signatures = initialAgents.map((_, index) => JSON.stringify(lookForAgent(index)))
    expect(new Set(signatures).size).toBe(initialAgents.length)
  })

  it('recolors hair but keeps skin tones for reused sheets', () => {
    const auburn = CHARACTER_LOOKS[6]
    const hair = pixel(0xbe, 0x77, 0x43)
    recolorPixels(hair, 1, auburn.recolors)
    expect([...hair]).not.toEqual([0xbe, 0x77, 0x43, 255])

    const skin = pixel(0xe9, 0xa3, 0x84)
    recolorPixels(skin, 1, auburn.recolors)
    expect([...skin]).toEqual([0xe9, 0xa3, 0x84, 255])
  })

  it('limits row-scoped rules to the top of each frame', () => {
    const silver = CHARACTER_LOOKS[8]
    const width = 1
    const data = new Uint8ClampedArray(32 * 4)
    for (let row = 0; row < 32; row += 1) data.set([0x22, 0x1e, 0x1e, 255], row * 4)
    recolorPixels(data, width, silver.recolors)
    expect(data[0]).toBeGreaterThan(0x80)
    expect([...data.slice(31 * 4, 32 * 4)]).toEqual([0x22, 0x1e, 0x1e, 255])
  })

  it('leaves transparent pixels and outlines untouched', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 255])
    recolorPixels(data, 2, CHARACTER_LOOKS[7].recolors)
    expect([...data]).toEqual([0, 0, 0, 0, 0, 0, 0, 255])
  })
})
