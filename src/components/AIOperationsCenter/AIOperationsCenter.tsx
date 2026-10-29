import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { Activity, ArrowLeft, ArrowRight, Cpu, FileCheck, Gauge, Pause, Play, RotateCcw, Users, X } from 'lucide-react'
import { Application, Container, Graphics, Rectangle, Sprite, Text, TextStyle, Texture, TilingSprite } from 'pixi.js'
import { useDialogController } from '../../utils/useDialogController'
import type { ExperienceId } from '../../content/contentTypes'
import { WorkflowDemo } from './WorkflowDemo'
import {
  advanceSimulation,
  CORRIDOR_WIDTH,
  DELIVERABLES,
  DIRECTOR_ROOM_ID,
  CORRIDOR_Y,
  initialAgents,
  positionForAgent,
  roomById,
  rooms,
  VERTICAL_CORRIDOR_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './simulation'
import type { Agent, AgentStatus, PathPosition, Room } from './simulation'
import { buildCharacterSheets, lookForAgent } from './characterLooks'
import { BackupTeam } from './BackupTeam'
import { OfficeVisitors } from './OfficeVisitors'
import { assignReserveMission, missionPhase } from './backupSimulation'
import type { ReserveVisit } from './backupSimulation'
import './ai-operations-center.css'

const FRAME_WIDTH = 16
const FRAME_HEIGHT = 32
const WALK_FRAMES = [0, 1, 2, 1]
const PIXEL_SCALE = 2
const CHARACTER_FRAME_MS = 150
const TYPE_FRAME_MS = 360
type Facing = PathPosition['direction']
type AnimationFrames = Record<Facing, { walk: Texture[]; type: Texture[] }>

interface AgentDisplay {
  container: Container
  sprite: Sprite
  selection: Graphics
  nameplate: Container
  name: Text
  progress: Graphics
  bubble: Container
  bubbleGlyph: Graphics
  bubbleKey?: string
  frames: AnimationFrames
  lastTexture?: Texture
}

type BubbleKind = 'waiting' | 'thinking' | 'done' | 'carrying' | 'idle'

const BUBBLE_FRAME = [
  '.ooooooooo.',
  'owwwwwwwwwo',
  'owwwwwwwwwo',
  'owwwwwwwwwo',
  'owwwwwwwwwo',
  'owwwwwwwwwo',
  'owwwwwwwwwo',
  'owwwwwwwwwo',
  '.owwoooooo.',
  '..owo......',
  '...o.......',
]

const BUBBLE_GLYPHS: Record<Exclude<BubbleKind, 'thinking'>, { rows: string[]; color: number }> = {
  waiting: { rows: ['.###.', '#...#', '..##.', '.....', '..#..'], color: 0xb7801f },
  done: { rows: ['....#', '...##', '#.##.', '###..', '.#...'], color: 0x3f8a55 },
  // A page with a folded corner and text lines: the deliverable being handed over.
  carrying: { rows: ['###..', '#.##.', '#-..#', '#---#', '#-..#', '#####'], color: 0x2e6f95 },
  idle: { rows: ['####.', '..#..', '.#...', '####.', '.....'], color: 0x8a959c },
}

function drawBitmap(graphics: Graphics, rows: string[], palette: Record<string, number>, offsetX = 0, offsetY = 0) {
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    const color = palette[cell]
    if (color !== undefined) graphics.rect(offsetX + x, offsetY + y, 1, 1).fill(color)
  }))
}

/** Pixel-art speech bubble glyph; the "thinking" dots fill in one by one. */
function paintBubbleGlyph(glyph: Graphics, kind: BubbleKind, frame: number) {
  glyph.clear()
  if (kind === 'thinking') {
    const dots = frame % 4
    for (let dot = 0; dot < 3; dot += 1) {
      glyph.rect(2 + dot * 3, 4, 1, 1).fill(dot < dots ? 0x2e6f95 : 0xc9d3d8)
    }
    return
  }
  const { rows, color } = BUBBLE_GLYPHS[kind]
  drawBitmap(glyph, rows, { '#': color, '-': 0x9fb7c6 }, 3, rows.length > 5 ? 1 : 2)
}

function bubbleKindFor(agent: Agent): BubbleKind | undefined {
  if (agent.visit || agent.travel?.purpose === 'deliver') return 'carrying'
  if (agent.travel) return undefined
  switch (agent.status) {
    case 'Waiting': return 'waiting'
    case 'Reviewing': return 'thinking'
    case 'Completed': return 'done'
    case 'Idle': return 'idle'
    default: return undefined
  }
}

interface RoomDisplay {
  agentName: Text
  progressFill: Graphics
  statusDot: Graphics
  screens: Graphics[]
  screenKey?: string
}

type ScreenMode = 'work' | 'review' | 'wait' | 'sleep'

const SCREEN_WIDTH = 32
const SCREEN_HEIGHT = 15
const SCREEN_FRAME_MS = 180

/** Redraws one monitor's pixel content for the current animation frame. */
function paintScreen(screen: Graphics, mode: ScreenMode, frame: number, seed: number, accent: number, secondary: boolean) {
  screen.clear()
  if (mode === 'sleep') {
    // Screensaver: a dim panel with a slowly drifting dot.
    screen.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(0x1c272c)
    const step = Math.floor(frame / 3) + seed
    const dotX = 2 + Math.abs(((step * 3) % 52) - 26)
    const dotY = 2 + Math.abs(((step * 2) % 18) - 9)
    screen.rect(dotX, dotY, 2, 2).fill({ color: accent, alpha: 0.7 })
    return
  }

  screen.rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT).fill(mode === 'wait' ? 0x2a4048 : 0x2c5260)

  if (mode === 'wait') {
    // Loading indicator: three dots filling in sequence plus an indeterminate bar.
    for (let dot = 0; dot < 3; dot += 1) {
      screen.rect(10 + dot * 5, 4, 3, 3).fill(dot <= (Math.floor(frame / 2) % 4) - 1 ? 0xf0c35c : 0x46606a)
    }
    screen.rect(3, 11, 26, 2).fill(0x1f3238)
    screen.rect(3 + ((frame * 2) % 20), 11, 6, 2).fill(0xd6a94a)
    return
  }

  if (secondary) {
    // Dashboard monitor: live bar chart that keeps updating.
    for (let bar = 0; bar < 6; bar += 1) {
      const height = 3 + Math.round((Math.sin(frame * 0.35 + bar * 1.7 + seed) + 1) * 4.5)
      screen.rect(3 + bar * 5, SCREEN_HEIGHT - 2 - height, 3, height).fill(bar % 2 ? 0x7fe0c3 : accent)
    }
    screen.rect(2, SCREEN_HEIGHT - 2, 28, 1).fill(0x8fb2c4)
    return
  }

  // Code / data stream: lines scroll up while the last line is typed out with a blinking cursor.
  const lineColors = [0x7fe0c3, 0x63b9be, 0x4c8797]
  const scroll = Math.floor(frame / 6)
  const typing = frame % 6
  for (let row = 0; row < 3; row += 1) {
    const lineIndex = scroll + row + seed
    const indent = (lineIndex % 3) * 2
    const fullLength = 8 + ((lineIndex * 7 + seed) % 16)
    const length = row === 2 ? Math.max(2, Math.round(fullLength * (typing + 1) / 6)) : fullLength
    screen.rect(2 + indent, 2 + row * 4, length, 2).fill(lineColors[(lineIndex + row) % lineColors.length])
    if (row === 2 && frame % 2 === 0) screen.rect(3 + indent + length, 1 + row * 4, 2, 4).fill(0xf1f6f2)
  }
  if (mode === 'review') {
    // Reviewing adds a scanning highlight that sweeps over the output.
    const sweep = frame % 8
    screen.rect(0, Math.min(SCREEN_HEIGHT - 2, sweep * 2), SCREEN_WIDTH, 2).fill({ color: 0xf0c35c, alpha: 0.45 })
  }
}

const STATUS_COLORS: Record<AgentStatus, number> = {
  Working: 0x2f8f7f,
  Reviewing: 0x2e6f95,
  Waiting: 0xd6a94a,
  Idle: 0x8a959c,
  Completed: 0x4f9a63,
}

interface AIOperationsCenterProps {
  headingRef: RefObject<HTMLHeadingElement | null>
  onNavigate: (experience: ExperienceId) => void
}

function assetPath(file: string) {
  return `${import.meta.env.BASE_URL}assets/agent-office/${file}`
}

function frameTexture(sheet: Texture, column: number, row: number) {
  return new Texture({
    source: sheet.source,
    frame: new Rectangle(column * FRAME_WIDTH, row * FRAME_HEIGHT, FRAME_WIDTH, FRAME_HEIGHT),
  })
}

function createFrames(sheets: Texture[]): Map<number, AnimationFrames> {
  return new Map(sheets.map((sheet, palette) => {
    sheet.source.scaleMode = 'nearest'
    const rows = { down: 0, up: 1, right: 2 }
    const makeFrames = (row: number, first: number, count: number) => Array.from(
      { length: count },
      (_, index) => frameTexture(sheet, first + index, row),
    )
    const downWalk = makeFrames(rows.down, 0, 3)
    const upWalk = makeFrames(rows.up, 0, 3)
    const rightWalk = makeFrames(rows.right, 0, 3)
    const downType = makeFrames(rows.down, 3, 2)
    const upType = makeFrames(rows.up, 3, 2)
    const rightType = makeFrames(rows.right, 3, 2)
    const directions: AnimationFrames = {
      down: { walk: [downWalk[0], downWalk[1], downWalk[2], downWalk[1]], type: downType },
      up: { walk: [upWalk[0], upWalk[1], upWalk[2], upWalk[1]], type: upType },
      right: { walk: [rightWalk[0], rightWalk[1], rightWalk[2], rightWalk[1]], type: rightType },
      left: {
        walk: [rightWalk[0], rightWalk[1], rightWalk[2], rightWalk[1]],
        type: rightType,
      },
    }
    return [palette, directions]
  }))
}

function addPixelWall(root: Container, x: number, y: number, width: number, height: number) {
  const wall = new Graphics()
    .rect(x, y, width, height).fill(0xd6d0c2)
    .rect(x, y, width, 3).fill(0xf4f0e6)
    .rect(x, y + height - 3, width, 3).fill(0x9c9483)
  root.addChild(wall)
}

function createFloorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 32
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the pixel-art floor texture')
  context.imageSmoothingEnabled = false
  context.fillStyle = '#b8936a'
  context.fillRect(0, 0, canvas.width, canvas.height)
  const plankColors = ['#d9bb93', '#e2c7a1', '#d4b48a', '#dcc09a']
  for (let row = 0; row < 2; row += 1) {
    const y = row * 16
    for (let x = -32 + (row ? 16 : 0), index = 0; x < 64; x += 32, index += 1) {
      const left = Math.max(0, x)
      const right = Math.min(64, x + 32)
      const width = right - left
      if (width <= 0) continue
      context.fillStyle = plankColors[(row + index) % plankColors.length]
      context.fillRect(left, y, width, 15)
      context.fillStyle = '#ecd8b8'
      context.fillRect(left, y, width, 1)
      context.fillStyle = '#b8936a'
      context.fillRect(left, y + 14, width, 2)
      context.fillStyle = '#cdab80'
      context.fillRect(left, y + 4, width, 1)
    }
  }
  return Texture.from(canvas)
}

function createCarpetTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the pixel-art carpet texture')
  context.fillStyle = '#c3cbc9'
  context.fillRect(0, 0, 16, 16)
  context.fillStyle = '#bac3c1'
  context.fillRect(0, 0, 8, 8)
  context.fillRect(8, 8, 8, 8)
  context.fillStyle = '#ccd3d1'
  context.fillRect(3, 3, 1, 1)
  context.fillRect(11, 11, 1, 1)
  return Texture.from(canvas)
}

function addCarpet(root: Container, texture: Texture, x: number, y: number, width: number, height: number) {
  const carpet = new TilingSprite({ texture, width, height })
  carpet.position.set(x, y)
  // Anchor the pattern to world coordinates so crossing aisles tile seamlessly.
  carpet.tilePosition.set(-x, -y)
  root.addChild(carpet)
}

/** Draws a horizontal edge strip, skipping the openings where vertical aisles join. */
function addHorizontalEdge(edges: Graphics, x: number, y: number, width: number, openings: number[]) {
  let cursor = x
  openings
    .map((centerX) => [centerX - CORRIDOR_WIDTH / 2, centerX + CORRIDOR_WIDTH / 2])
    .sort((a, b) => a[0] - b[0])
    .forEach(([start, end]) => {
      if (start > cursor) edges.rect(cursor, y, start - cursor, 2).fill(0x9fa9a7)
      cursor = Math.max(cursor, end)
    })
  if (cursor < x + width) edges.rect(cursor, y, x + width - cursor, 2).fill(0x9fa9a7)
}

function drawFloor(root: Container) {
  const floorTexture = createFloorTexture()
  floorTexture.source.scaleMode = 'nearest'
  root.addChild(new TilingSprite({ texture: floorTexture, width: WORLD_WIDTH, height: WORLD_HEIGHT }))

  const carpet = createCarpetTexture()
  carpet.source.scaleMode = 'nearest'
  const half = CORRIDOR_WIDTH / 2
  const aisleLeft = 28
  const aisleWidth = WORLD_WIDTH - 56
  const [topY, bottomY] = CORRIDOR_Y
  VERTICAL_CORRIDOR_X.forEach((centerX) => {
    addCarpet(root, carpet, centerX - half, topY, CORRIDOR_WIDTH, bottomY - topY)
  })
  CORRIDOR_Y.forEach((centerY) => {
    addCarpet(root, carpet, aisleLeft, centerY - half, aisleWidth, CORRIDOR_WIDTH)
  })

  // Edges outline the combined aisle shape, leaving junctions open so the carpet reads as one piece.
  const edges = new Graphics()
  CORRIDOR_Y.forEach((centerY, index) => {
    const openingsAbove = index === 1 ? VERTICAL_CORRIDOR_X : []
    const openingsBelow = index === 0 ? VERTICAL_CORRIDOR_X : []
    addHorizontalEdge(edges, aisleLeft, centerY - half, aisleWidth, openingsAbove)
    addHorizontalEdge(edges, aisleLeft, centerY + half - 2, aisleWidth, openingsBelow)
  })
  VERTICAL_CORRIDOR_X.forEach((centerX) => {
    const start = topY + half
    const length = bottomY - half - start
    edges.rect(centerX - half, start, 2, length).fill(0x9fa9a7)
    edges.rect(centerX + half - 2, start, 2, length).fill(0x9fa9a7)
  })
  root.addChild(edges)
}

function drawDirectorOffice(root: Container, room: Room) {
  const wall = 8
  const left = room.x - 10
  const bottom = room.y + room.height - 2
  const doorWidth = 46
  const doorLeft = room.door.x - doorWidth / 2
  const doorRight = room.door.x + doorWidth / 2
  const interiorRight = WORLD_WIDTH - 28

  root.addChild(new Graphics()
    .rect(left + wall, room.y - 2, interiorRight - left - wall, bottom - room.y + 2).fill({ color: 0x8aa1b4, alpha: 0.28 }))

  addPixelWall(root, left, room.y - 2, wall, bottom - room.y + wall + 2)
  addPixelWall(root, left, bottom, doorLeft - left, wall)
  addPixelWall(root, doorRight, bottom, interiorRight - doorRight, wall)

  // The door leaf is drawn swung open into the office: Rafael's door is always open.
  const leaf = doorWidth - 2
  root.addChild(new Graphics()
    .rect(doorLeft + 3, bottom + 1, doorWidth - 6, wall - 2).fill(0x8c6f4e)
    .rect(doorLeft + 5, bottom + 3, doorWidth - 10, wall - 6).fill(0xa98a63)
    .moveTo(doorRight, bottom - leaf)
    .arc(doorRight, bottom, leaf, -Math.PI / 2, -Math.PI, true).stroke({ color: 0x6f675a, width: 1, alpha: 0.45 })
    .rect(doorRight - 6, bottom - leaf, 6, leaf).fill(0x7a5032)
    .rect(doorRight - 5, bottom - leaf + 1, 4, leaf - 2).fill(0xb07b4a)
    .rect(doorRight - 5, bottom - leaf + 1, 1, leaf - 2).fill(0xd2a273)
    .rect(doorRight - 9, bottom - leaf / 2 - 2, 3, 4).fill(0xe0c070)
    .rect(doorLeft - 2, bottom, 2, wall).fill(0x6f675a)
    .rect(doorRight, bottom, 2, wall).fill(0x6f675a))

  const shelfX = room.x + room.width - 64
  const shelf = new Graphics()
    .rect(shelfX, room.y + 2, 52, 30).fill(0x6b4a2e)
    .rect(shelfX + 2, room.y + 4, 48, 12).fill(0x3d2a1b)
    .rect(shelfX + 2, room.y + 18, 48, 12).fill(0x3d2a1b)
  const bookColors = [0xc95f4f, 0x5c8fc0, 0xd8b25a, 0x6eaa7a, 0x9b7ed0, 0xe08f5a]
  for (let index = 0; index < 8; index += 1) {
    shelf.rect(shelfX + 4 + index * 6, room.y + 6, 4, 10).fill(bookColors[index % bookColors.length])
    shelf.rect(shelfX + 4 + index * 6, room.y + 20, 4, 10).fill(bookColors[(index + 3) % bookColors.length])
  }
  root.addChild(shelf)

  // Front-facing lounge couch in the corner with a small coffee table in front of it.
  const sofaX = interiorRight - 72
  const sofaY = bottom - 38
  const sofa = new Graphics()
    .rect(sofaX + 2, sofaY + 26, 64, 6).fill({ color: 0x3a3226, alpha: 0.18 })
    .rect(sofaX + 4, sofaY, 56, 15).fill(0x37505d)
    .rect(sofaX + 4, sofaY, 56, 2).fill(0x5f8193)
    .rect(sofaX + 8, sofaY + 3, 23, 11).fill(0x6f93a8)
    .rect(sofaX + 33, sofaY + 3, 23, 11).fill(0x6f93a8)
    .rect(sofaX + 8, sofaY + 3, 23, 2).fill(0x8fb2c4)
    .rect(sofaX + 33, sofaY + 3, 23, 2).fill(0x8fb2c4)
    .rect(sofaX + 7, sofaY + 14, 50, 11).fill(0x7ea2b5)
    .rect(sofaX + 31, sofaY + 14, 2, 11).fill(0x5f8193)
    .rect(sofaX + 7, sofaY + 23, 50, 3).fill(0x4a6878)
    .rect(sofaX, sofaY + 6, 8, 22).fill(0x37505d)
    .rect(sofaX + 56, sofaY + 6, 8, 22).fill(0x37505d)
    .rect(sofaX, sofaY + 6, 8, 2).fill(0x5f8193)
    .rect(sofaX + 56, sofaY + 6, 8, 2).fill(0x5f8193)
    .rect(sofaX + 10, sofaY + 7, 8, 8).fill(0xe2c27a)
    .rect(sofaX + 2, sofaY + 28, 3, 3).fill(0x2a3236)
    .rect(sofaX + 59, sofaY + 28, 3, 3).fill(0x2a3236)
  root.addChild(sofa)
  const tableX = sofaX + 14
  const tableY = sofaY - 26
  root.addChild(new Graphics()
    .rect(tableX + 1, tableY + 13, 36, 4).fill({ color: 0x3a3226, alpha: 0.16 })
    .rect(tableX, tableY + 6, 36, 10).fill(0x6b4a2e)
    .rect(tableX, tableY + 4, 36, 8).fill(0xa97d52)
    .rect(tableX, tableY + 4, 36, 2).fill(0xc99d6c)
    .rect(tableX + 3, tableY + 14, 3, 5).fill(0x5a3a22)
    .rect(tableX + 30, tableY + 14, 3, 5).fill(0x5a3a22)
    .rect(tableX + 6, tableY - 1, 6, 7).fill(0xf3efe6)
    .rect(tableX + 7, tableY, 4, 3).fill(0x5a3a22)
    .rect(tableX + 12, tableY + 1, 2, 3).fill(0xf3efe6)
    .rect(tableX + 18, tableY + 3, 13, 5).fill(0xe7e1d2)
    .rect(tableX + 19, tableY + 4, 9, 1).fill(0x9aa3a8))
}

function drawPartitions(root: Container) {
  addPixelWall(root, 16, 22, WORLD_WIDTH - 32, 14)
  addPixelWall(root, 16, 22, 12, WORLD_HEIGHT - 40)
  addPixelWall(root, WORLD_WIDTH - 28, 22, 12, WORLD_HEIGHT - 40)
  addPixelWall(root, 16, WORLD_HEIGHT - 18, WORLD_WIDTH - 32, 14)
}

function drawDesk(root: Container, room: Room): Graphics[] {
  const { x, y } = room.desk
  const furniture = new Graphics()
    .rect(x - 66, y + 22, 132, 30).fill({ color: 0x5a4a38, alpha: 0.18 })
    .rect(x - 58, y + 18, 6, 24).fill(0x3a2921)
    .rect(x + 52, y + 18, 6, 24).fill(0x3a2921)
    .rect(x - 65, y + 10, 130, 12).fill(0x523923)
    .rect(x - 63, y + 8, 126, 10).fill(0xb48a5d)
    .rect(x - 62, y + 8, 124, 2).fill(0xd3ad7e)
    .rect(x - 49, y + 22, 98, 2).fill(0x785638)
    .rect(x - 14, y + 43, 28, 4).fill(0x30383b)
    .rect(x - 17, y + 47, 34, 5).fill(0x243034)
    .rect(x - 17, y + 49, 34, 2).fill(room.color)
    .rect(x - 58, y + 37, 5, 5).fill(0x262f32)
    .rect(x + 53, y + 37, 5, 5).fill(0x262f32)
  // Rafael works on a dual-monitor setup; open-space desks have a single screen.
  const isDirector = room.id === DIRECTOR_ROOM_ID
  const monitors = isDirector ? [x - 44, x + 6] : [x - 26]
  monitors.forEach((left) => {
    furniture.rect(left, y - 15, 38, 22).fill(0x182025)
      .rect(left + 16, y + 4, 7, 4).fill(0x333a3b)
  })
  const keyboardX = isDirector ? x - 22 : x - 30
  const mouseX = isDirector ? x + 48 : x + 23
  furniture.rect(keyboardX, y + 5, 45, 3).fill(0x535452)
    .rect(mouseX, y + 3, 8, 5).fill(0xc4c3ad)
    .rect(mouseX + 2, y + 4, 3, 2).fill(0x333a3b)
  root.addChild(furniture)

  const screens = monitors.map((left) => {
    const screen = new Graphics()
    screen.position.set(left + 3, y - 12)
    root.addChild(screen)
    return screen
  })

  const chair = new Graphics()
    .rect(room.seat.x - 12, room.seat.y - 8, 24, 4).fill(0x263137)
    .rect(room.seat.x - 10, room.seat.y - 4, 20, 7).fill(0x39474a)
    .rect(room.seat.x - 5, room.seat.y + 3, 10, 3).fill(0x222d32)
    .rect(room.seat.x - 12, room.seat.y + 6, 4, 3).fill(0x222d32)
    .rect(room.seat.x + 8, room.seat.y + 6, 4, 3).fill(0x222d32)
  root.addChild(chair)
  return screens
}

function plot(graphics: Graphics, x: number, y: number, points: number[], color: number, step = 2) {
  points.forEach((value, index) => graphics.rect(x + index * step, y + value, step, 2).fill(color))
}

function drawBoard(root: Container, room: Room) {
  const x = room.x + 232
  const y = room.y + 16
  const width = 56
  const height = 40
  const board = new Graphics()
    .rect(x + 2, y + 4, width, height + 12).fill({ color: 0x3a3226, alpha: 0.12 })

  if (room.id === 'ingestion') {
    // Server rack with blinking-style status lights.
    board.rect(x + 10, y - 2, 36, 58).fill(0x2a3236)
      .rect(x + 12, y, 32, 54).fill(0x384449)
    for (let unit = 0; unit < 6; unit += 1) {
      board.rect(x + 14, y + 3 + unit * 8, 28, 6).fill(0x222a2e)
        .rect(x + 16, y + 5 + unit * 8, 2, 2).fill(unit % 3 === 0 ? 0xf0b34a : 0x6fe0a8)
        .rect(x + 20, y + 5 + unit * 8, 2, 2).fill(0x6fe0a8)
        .rect(x + 28, y + 5 + unit * 8, 12, 1).fill(0x56656b)
    }
    root.addChild(board)
    return
  }

  if (room.id === 'petrophysics') {
    // Core sample shelf.
    board.rect(x, y, width, 46).fill(0x6b4a2e)
      .rect(x + 2, y + 2, width - 4, 12).fill(0x3d2a1b)
      .rect(x + 2, y + 16, width - 4, 12).fill(0x3d2a1b)
      .rect(x + 2, y + 30, width - 4, 12).fill(0x3d2a1b)
    const coreColors = [0xc9a26b, 0x9c7a55, 0xd8c08f, 0x7e6a58, 0xb38b5d]
    for (let shelf = 0; shelf < 3; shelf += 1) {
      for (let piece = 0; piece < 4; piece += 1) {
        board.rect(x + 4 + piece * 13, y + 5 + shelf * 14, 11, 6).fill(coreColors[(piece + shelf * 2) % coreColors.length])
          .rect(x + 4 + piece * 13, y + 5 + shelf * 14, 11, 1).fill({ color: 0xffffff, alpha: 0.35 })
      }
    }
    root.addChild(board)
    return
  }

  // Standing whiteboard with discipline-specific content.
  board.rect(x + 6, y + height, 3, 14).fill(0x5a6266)
    .rect(x + width - 9, y + height, 3, 14).fill(0x5a6266)
    .rect(x, y, width, height).fill(0x5a6266)
    .rect(x + 2, y + 2, width - 4, height - 4).fill(0xf8f6ef)
    .rect(x + 4, y + height - 3, 16, 2).fill(0x8f979b)
  const ix = x + 5
  const iy = y + 5

  if (room.id === 'logs') {
    board.rect(ix + 15, iy, 1, 30).fill(0xc9c4b6).rect(ix + 31, iy, 1, 30).fill(0xc9c4b6)
    for (let depth = 0; depth < 15; depth += 1) {
      board.rect(ix + 4 + Math.round(Math.sin(depth * 1.3) * 3 + 3), iy + depth * 2, 2, 2).fill(0x3f8f4f)
      board.rect(ix + 20 + Math.round(Math.cos(depth * 0.9) * 4 + 4), iy + depth * 2, 2, 2).fill(0xc95f4f)
      board.rect(ix + 36 + Math.round(Math.sin(depth * 0.7 + 1) * 3 + 3), iy + depth * 2, 2, 2).fill(0x3b6fb0)
    }
  } else if (room.id === 'gis') {
    board.rect(ix, iy, 46, 30).fill(0xcfe3ef)
      .rect(ix + 4, iy + 4, 22, 18).fill(0xbcd9a2)
      .rect(ix + 20, iy + 12, 22, 14).fill(0x9fcb8a)
      .rect(ix + 10, iy + 8, 10, 8).fill(0x83b773)
      .rect(ix + 28, iy + 16, 8, 6).fill(0x6fa761)
      .rect(ix + 30, iy + 4, 3, 3).fill(0xc95f4f)
      .rect(ix + 14, iy + 20, 3, 3).fill(0xc95f4f)
  } else if (room.id === 'reservoir') {
    board.rect(ix + 2, iy, 1, 30).fill(0x5a6266).rect(ix + 2, iy + 29, 44, 1).fill(0x5a6266)
    plot(board, ix + 4, iy, [2, 3, 5, 7, 9, 11, 13, 15, 16, 18, 19, 20, 21, 22, 23, 23, 24, 24, 25, 25, 25], 0x2e6f95)
    plot(board, ix + 4, iy, [10, 11, 12, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 24, 25, 26, 26, 27, 27, 27, 27], 0xd6a94a)
  } else if (room.id === 'economics') {
    board.rect(ix + 2, iy + 29, 44, 1).fill(0x5a6266)
    const bars = [10, 16, 13, 22, 19, 27]
    bars.forEach((barHeight, index) => {
      board.rect(ix + 4 + index * 7, iy + 29 - barHeight, 5, barHeight).fill(index === bars.length - 1 ? 0x4f9a63 : 0xe58d80)
    })
  } else if (room.id === 'geology') {
    const strata = [0xe2c48f, 0xc9a26b, 0xd99a6c, 0xa98a63, 0xc7b38a]
    strata.forEach((color, index) => {
      for (let column = 0; column < 23; column += 1) {
        const offset = Math.round(Math.sin(column * 0.35) * 2)
        board.rect(ix + column * 2, iy + index * 6 + offset + 2, 2, 6).fill(color)
      }
    })
    board.rect(ix + 26, iy, 2, 30).fill(0x6b4a2e)
  } else if (room.id === 'geophysics') {
    for (let trace = 0; trace < 7; trace += 1) {
      for (let depth = 0; depth < 15; depth += 1) {
        const amplitude = Math.round(Math.sin(depth * 0.9 + trace * 0.5) * 2)
        board.rect(ix + 3 + trace * 6 + amplitude, iy + depth * 2, 1, 2).fill(amplitude > 0 ? 0x2f3f41 : 0x8a959c)
      }
    }
  }
  root.addChild(board)
}

function drawFloorProp(root: Container, room: Room, kind: number) {
  const x = room.row === 2 ? room.x + 14 : room.x + room.width - 44
  const y = room.y + 176
  const prop = new Graphics().rect(x + 2, y + 26, 30, 5).fill({ color: 0x3a3226, alpha: 0.14 })
  if (kind === 0) {
    // Filing cabinet.
    prop.rect(x + 4, y, 24, 28).fill(0x7d8a90)
      .rect(x + 5, y + 1, 22, 2).fill(0xa8b4b9)
      .rect(x + 6, y + 5, 20, 9).fill(0x95a2a8)
      .rect(x + 6, y + 16, 20, 9).fill(0x95a2a8)
      .rect(x + 13, y + 9, 6, 2).fill(0x4e585c)
      .rect(x + 13, y + 20, 6, 2).fill(0x4e585c)
  } else if (kind === 1) {
    // Printer on a small stand.
    prop.rect(x + 2, y + 10, 28, 18).fill(0x6b4a2e)
      .rect(x + 3, y + 11, 26, 3).fill(0x9a6a3e)
      .rect(x + 4, y, 24, 12).fill(0xdfe3e2)
      .rect(x + 4, y + 9, 24, 3).fill(0x8f979b)
      .rect(x + 8, y - 4, 16, 5).fill(0xf8f6ef)
      .rect(x + 22, y + 3, 3, 2).fill(0x6fe0a8)
  } else {
    // Coffee station.
    prop.rect(x + 2, y + 10, 28, 18).fill(0x6b4a2e)
      .rect(x + 3, y + 11, 26, 3).fill(0x9a6a3e)
      .rect(x + 6, y - 2, 12, 13).fill(0x2f3638)
      .rect(x + 8, y, 8, 4).fill(0x4a5558)
      .rect(x + 10, y + 7, 4, 3).fill(0xf3efe6)
      .rect(x + 21, y + 4, 6, 6).fill(0xf3efe6)
      .rect(x + 22, y + 5, 4, 3).fill(0x5a3a22)
  }
  root.addChild(prop)
}

function drawPlant(root: Container, x: number, y: number, scale = 1) {
  const plant = new Graphics()
    .rect(x - 8 * scale, y, 16 * scale, 9 * scale).fill(0x70432b)
    .rect(x - 6 * scale, y - 2 * scale, 12 * scale, 3 * scale).fill(0xb2824e)
    .rect(x - 2 * scale, y - 18 * scale, 4 * scale, 17 * scale).fill(0x517443)
    .rect(x - 10 * scale, y - 17 * scale, 8 * scale, 4 * scale).fill(0x5e914e)
    .rect(x + 2 * scale, y - 21 * scale, 8 * scale, 4 * scale).fill(0x689651)
    .rect(x - 9 * scale, y - 24 * scale, 6 * scale, 5 * scale).fill(0x527d43)
    .rect(x + 3 * scale, y - 14 * scale, 8 * scale, 4 * scale).fill(0x598248)
  root.addChild(plant)
}

function addText(root: Container, text: string, x: number, y: number, style: TextStyle) {
  const item = new Text({ text, style, resolution: 3 })
  item.position.set(x, y)
  root.addChild(item)
  return item
}

function drawOffice(root: Container, displays: Map<string, RoomDisplay>) {
  root.sortableChildren = true
  drawFloor(root)
  drawPartitions(root)

  rooms.forEach((room) => {
    if (room.id === DIRECTOR_ROOM_ID) {
      drawDirectorOffice(root, room)
    } else {
      drawBoard(root, room)
    }
    const screens = drawDesk(root, room)
    const titlePlate = new Graphics()
      .rect(room.x + 12, room.y + 9, 135, 19).fill(room.id === DIRECTOR_ROOM_ID ? 0x3a2f4a : 0x202a2c)
      .rect(room.x + 12, room.y + 9, 3, 19).fill(room.color)
      .rect(room.x + 16, room.y + 26, 128, 2).fill({ color: room.color, alpha: 0.45 })
    root.addChild(titlePlate)

    addText(
      root,
      room.shortName,
      room.x + 22,
      room.y + 14,
      new TextStyle({ fontFamily: 'monospace', fontSize: 9, fontWeight: '700', fill: 0xf1e8d6, letterSpacing: 0.6 }),
    )
    const infoCard = new Graphics()
      .rect(room.x + 12, room.y + 28, 135, 24).fill({ color: 0xfbf8f1, alpha: 0.94 })
      .rect(room.x + 12, room.y + 51, 135, 1).fill(0xb9ae98)
      .rect(room.x + 12, room.y + 28, 3, 24).fill(room.color)
    root.addChild(infoCard)
    const statusDot = new Graphics().rect(0, 0, 6, 6).fill(0xffffff)
    statusDot.position.set(room.x + 20, room.y + 33)
    root.addChild(statusDot)
    const agentName = addText(
      root,
      '',
      room.x + 30,
      room.y + 31,
      new TextStyle({ fontFamily: 'monospace', fontSize: 9, fontWeight: '700', fill: 0x2f3f41, letterSpacing: 0.4 }),
    )
    const progressBack = new Graphics()
      .rect(room.x + 20, room.y + 44, 118, 4).fill(0xdcd5c6)
    root.addChild(progressBack)
    const progressFill = new Graphics().rect(0, 0, 118, 4).fill(room.color)
    progressFill.position.set(room.x + 20, room.y + 44)
    root.addChild(progressFill)
    displays.set(room.id, { agentName, progressFill, statusDot, screens })
  })

  rooms.filter((room) => room.id !== DIRECTOR_ROOM_ID).forEach((room, index) => drawFloorProp(root, room, index % 3))

  rooms.forEach((room) => {
    const plantX = room.row === 2 ? room.x + room.width - 24 : room.x + 24
    drawPlant(root, plantX, room.y + room.height - 30, room.id === DIRECTOR_ROOM_ID ? 1 : 0.8)
  })
}

function addAgentDisplays(root: Container, frames: Map<number, AnimationFrames>, agents: Agent[], onSelect: (id: string) => void) {
  const displays = new Map<string, AgentDisplay>()
  agents.forEach((agent, index) => {
    const room = roomById.get(agent.roomId)
    const agentFrames = frames.get(index % frames.size)
    if (!room || !agentFrames) throw new Error(`Missing room or sprite palette for agent ${agent.id}`)

    const container = new Container()
    container.zIndex = room.seat.y
    const selection = new Graphics()
      .ellipse(0, -2, 17, 6).fill({ color: 0xe8b84a, alpha: 0.28 })
      .ellipse(0, -2, 17, 6).stroke({ color: 0xe8b84a, width: 2 })
    selection.visible = false
    container.addChild(selection)

    const sprite = new Sprite(agentFrames.up.walk[1])
    sprite.anchor.set(0.5, 1)
    sprite.scale.set(PIXEL_SCALE, PIXEL_SCALE)
    container.addChild(sprite)

    const nameplate = new Container()
    const isDirector = agent.roomId === DIRECTOR_ROOM_ID
    nameplate.position.set(-23, -77)
    nameplate.addChild(new Graphics()
      .rect(0, 0, 46, 15).fill(0x171d2a)
      .rect(0, 0, 46, 2).fill(isDirector ? 0xe8c25c : 0x8b83dc)
      .rect(0, 13, 46, 2).fill(isDirector ? 0xb8902e : 0x6e65bd)
      .rect(2, 2, 42, 11).fill(0x1f2635))
    const name = new Text({
      text: agent.name,
      anchor: { x: 0.5, y: 0 },
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 9, fontWeight: '700', fill: 0xf5efe1 }),
    })
    name.position.set(23, 3)
    nameplate.addChild(name)
    container.addChild(nameplate)

    const indicator = new Graphics().rect(0, 0, 7, 7).fill(room.color)
    indicator.position.set(-3, -89)
    container.addChild(indicator)

    const bubble = new Container()
    const bubbleFrame = new Graphics()
    drawBitmap(bubbleFrame, BUBBLE_FRAME, { o: 0x2a3540, w: 0xfdfbf5 })
    const bubbleGlyph = new Graphics()
    bubble.addChild(bubbleFrame, bubbleGlyph)
    bubble.scale.set(PIXEL_SCALE)
    bubble.visible = false
    container.addChild(bubble)

    container.eventMode = 'static'
    container.cursor = 'pointer'
    container.hitArea = new Rectangle(-20, -88, 40, 88)
    container.on('pointertap', () => onSelect(agent.id))
    displays.set(agent.id, {
      container,
      sprite,
      selection,
      nameplate,
      name,
      progress: indicator,
      bubble,
      bubbleGlyph,
      frames: agentFrames,
    })
    root.addChild(container)
  })
  return displays
}

function updateAgentScene(
  agents: Agent[],
  agentDisplays: Map<string, AgentDisplay>,
  roomDisplays: Map<string, RoomDisplay>,
  time: number,
  selectedId: string,
) {
  const occupants = new Map<string, Agent[]>()
  const visitors = new Map<string, Agent[]>()
  agents.forEach((agent) => {
    if (agent.visit) {
      const roomVisitors = visitors.get(agent.visit.roomId) ?? []
      roomVisitors.push(agent)
      visitors.set(agent.visit.roomId, roomVisitors)
      return
    }
    if (agent.travel) return
    const roomAgents = occupants.get(agent.roomId) ?? []
    roomAgents.push(agent)
    occupants.set(agent.roomId, roomAgents)
  })

  agents.forEach((agent) => {
    const display = agentDisplays.get(agent.id)
    if (!display) return
    const position = positionForAgent(agent, time)
    const roomAgents = occupants.get(agent.roomId) ?? []
    // Simultaneous visitors queue side by side instead of stacking on the same spot.
    const offset = agent.visit
      ? -(visitors.get(agent.visit.roomId) ?? []).indexOf(agent) * 24
      : agent.travel ? 0 : (roomAgents.indexOf(agent) - (roomAgents.length - 1) / 2) * 22
    display.container.position.set(position.x + offset, position.y)
    display.container.zIndex = position.y
    if (display.name.text !== agent.name) display.name.text = agent.name
    display.nameplate.position.set(-23, -76)
    // Seated agents hide their overhead label so the desk monitor stays visible; the room card names them.
    const showLabel = Boolean(agent.travel)
    display.nameplate.visible = showLabel
    display.progress.visible = showLabel

    const bubbleKind = bubbleKindFor(agent)
    display.bubble.visible = Boolean(bubbleKind)
    if (bubbleKind) {
      // Above the nameplate while walking; beside the head when seated so the monitor stays clear.
      display.bubble.position.set(showLabel ? 16 : 14, showLabel ? -100 : -60)
      const bubbleFrame = Math.floor(time / 320)
      const bubbleKey = bubbleKind === 'thinking' ? `${bubbleKind}:${bubbleFrame % 4}` : bubbleKind
      if (display.bubbleKey !== bubbleKey) {
        display.bubbleKey = bubbleKey
        paintBubbleGlyph(display.bubbleGlyph, bubbleKind, bubbleFrame)
      }
    }
    const isSelected = agent.id === selectedId
    display.selection.visible = isSelected
    if (isSelected) display.selection.alpha = 0.65 + Math.sin(time / 220) * 0.35

    const facing = position.direction
    const animationSet = display.frames[facing]
    if (facing === 'left') display.sprite.scale.x = -PIXEL_SCALE
    else display.sprite.scale.x = PIXEL_SCALE
    const texture = agent.travel
      ? animationSet.walk[Math.floor(time / CHARACTER_FRAME_MS) % WALK_FRAMES.length]
      : agent.status === 'Working' || agent.status === 'Reviewing'
        ? animationSet.type[Math.floor(time / TYPE_FRAME_MS) % 2]
        : animationSet.walk[1]
    if (display.lastTexture !== texture) {
      display.sprite.texture = texture
      display.lastTexture = texture
    }
  })

  // Each room card shows its resident; rooms emptied by a relocation read as vacant instead of keeping stale data.
  roomDisplays.forEach((roomDisplay, roomId) => {
    const resident = agents.find((agent) => agent.roomId === roomId)
    const text = resident ? `${resident.name}  ·  ${resident.status.toUpperCase()}` : 'DESK VACANT'
    if (roomDisplay.agentName.text !== text) roomDisplay.agentName.text = text
    const tint = resident ? STATUS_COLORS[resident.status] : 0xc9c4b6
    if (roomDisplay.statusDot.tint !== tint) roomDisplay.statusDot.tint = tint
    const progress = resident ? Math.max(0.02, resident.progress / 100) : 0
    if (roomDisplay.progressFill.scale.x !== progress) roomDisplay.progressFill.scale.x = progress

    // Monitors only animate while their operator is seated at the desk.
    const seated = resident && !resident.travel && !resident.visit
    const mode: ScreenMode = !seated ? 'sleep'
      : resident.status === 'Working' ? 'work'
        : resident.status === 'Reviewing' ? 'review'
          : resident.status === 'Waiting' ? 'wait'
            : 'sleep'
    const frame = Math.floor(time / SCREEN_FRAME_MS)
    const screenKey = `${mode}:${frame}`
    if (roomDisplay.screenKey !== screenKey) {
      roomDisplay.screenKey = screenKey
      const room = roomById.get(roomId)
      const seed = rooms.findIndex((candidate) => candidate.id === roomId) * 5
      roomDisplay.screens.forEach((screen, index) => paintScreen(screen, mode, frame, seed + index * 3, room?.color ?? 0x7fe0c3, index > 0))
    }
  })
}

function handoffLabel(agent: Agent) {
  const target = agent.visit?.roomId ?? agent.travel?.to
  const item = DELIVERABLES[agent.roomId] ?? 'results'
  const recipient = target === DIRECTOR_ROOM_ID ? 'Rafael' : roomById.get(target ?? '')?.name ?? 'the next desk'
  return { item, recipient }
}

function currentRoomLabel(agent: Agent) {
  if (agent.visit) return `${roomById.get(agent.visit.roomId)?.name ?? 'Colleague desk'} · handing over results`
  if (agent.travel) {
    const destination = roomById.get(agent.travel.to)?.name
    return `In aisle → ${destination ?? 'next desk'}`
  }
  return roomById.get(agent.roomId)?.name ?? 'Unknown room'
}

function processingLabel(agent: Agent) {
  if (agent.visit) {
    const { item, recipient } = handoffLabel(agent)
    return `Handing ${item} to ${recipient}`
  }
  if (agent.travel?.purpose === 'deliver') {
    const { item, recipient } = handoffLabel(agent)
    return `Taking ${item} to ${recipient}`
  }
  if (agent.travel?.purpose === 'return') return 'Returning to workstation'
  if (agent.roomId === DIRECTOR_ROOM_ID && agent.status === 'Reviewing') return 'Reviewing team deliverables'
  switch (agent.status) {
    case 'Waiting': return 'Waiting on upstream data'
    case 'Reviewing': return 'Quality check before hand-off'
    case 'Completed': return 'Output ready for review'
    case 'Idle': return 'Standing by for input'
    default: return 'Running local workflow'
  }
}

function hexColor(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`
}

function SpritePortrait({ index, urls }: { index: number; urls: string[] }) {
  const url = urls[index] ?? assetPath(`characters/char_${lookForAgent(index).base}.png`)
  return <span className="agent-sprite" aria-hidden="true" style={{ backgroundImage: `url(${url})` }} />
}

function statusLabel(status: AgentStatus) {
  return status.toUpperCase()
}

export function AIOperationsCenter({ headingRef, onNavigate }: AIOperationsCenterProps) {
  const mapHostRef = useRef<HTMLDivElement>(null)
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const workflowCloseRef = useDialogController<HTMLButtonElement>(workflowOpen, () => setWorkflowOpen(false))
  const agentsRef = useRef(initialAgents)
  const isRunningRef = useRef(true)
  const simulationTimeRef = useRef(0)
  const lastProgressAtRef = useRef(0)
  const lastStateSecondRef = useRef(0)
  const [agents, setAgents] = useState(initialAgents)
  const [selectedAgentId, setSelectedAgentId] = useState('01')
  const selectedAgentIdRef = useRef(selectedAgentId)
  const [isRunning, setIsRunning] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [canvasError, setCanvasError] = useState(false)
  const [portraitUrls, setPortraitUrls] = useState<string[]>([])
  const [resetCount, setResetCount] = useState(0)
  const [reserveVisits, setReserveVisits] = useState<ReserveVisit[]>([])
  const visitingReserves = reserveVisits.filter((visit) => missionPhase(visit, elapsed * 1000) !== 'complete')

  useEffect(() => {
    agentsRef.current = agents
  }, [agents])

  useEffect(() => {
    isRunningRef.current = isRunning
  }, [isRunning])

  useEffect(() => {
    selectedAgentIdRef.current = selectedAgentId
  }, [selectedAgentId])

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0]
  const activeCount = agents.filter((agent) => agent.status === 'Working' || agent.status === 'Reviewing').length
  const director = agents.find((agent) => agent.roomId === DIRECTOR_ROOM_ID)
  const team = agents.filter((agent) => agent.roomId !== DIRECTOR_ROOM_ID)
  const deliveredCount = team.reduce((total, agent) => total + (agent.deliveries ?? 0), 0)
  const teamProgress = team.length ? Math.round(team.reduce((total, agent) => total + agent.progress, 0) / team.length) : 0
  const selectedIndex = agents.indexOf(selectedAgent)
  const selectedIsDirector = selectedAgent.roomId === DIRECTOR_ROOM_ID

  useEffect(() => {
    const host = mapHostRef.current
    if (!host) return

    let disposed = false
    let app: Application | undefined
    let canvas: HTMLCanvasElement | undefined
    let sceneRoot: Container | undefined
    let agentDisplays = new Map<string, AgentDisplay>()
    const roomDisplays = new Map<string, RoomDisplay>()

    const initialize = async () => {
      try {
        const sheetCanvases = await buildCharacterSheets((base) => assetPath(`characters/char_${base}.png`))
        if (disposed) return
        setPortraitUrls(sheetCanvases.map((sheet) => sheet.toDataURL()))
        const characterSheets = sheetCanvases.map((sheet) => Texture.from(sheet))

        const pixiApp = new Application()
        await pixiApp.init({
          backgroundColor: 0xe9e4d8,
          antialias: false,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          resizeTo: host,
        })
        if (disposed) {
          pixiApp.destroy(true)
          return
        }

        app = pixiApp
        canvas = pixiApp.canvas
        host.appendChild(canvas)
        canvas.style.imageRendering = 'pixelated'
        sceneRoot = new Container()
        drawOffice(sceneRoot, roomDisplays)
        const frames = createFrames(characterSheets)
        agentDisplays = addAgentDisplays(sceneRoot, frames, agentsRef.current, setSelectedAgentId)
        pixiApp.stage.addChild(sceneRoot)
        pixiApp.ticker.add((ticker) => {
          if (!sceneRoot || !app) return
          if (isRunningRef.current) {
            simulationTimeRef.current += Math.min(ticker.deltaMS, 80)
          }
          const scale = Math.min(app.screen.width / WORLD_WIDTH, app.screen.height / WORLD_HEIGHT)
          sceneRoot.scale.set(scale)
          sceneRoot.position.set(
            Math.round((app.screen.width - WORLD_WIDTH * scale) / 2),
            Math.round((app.screen.height - WORLD_HEIGHT * scale) / 2),
          )
          updateAgentScene(agentsRef.current, agentDisplays, roomDisplays, simulationTimeRef.current, selectedAgentIdRef.current)
        })
        setCanvasError(false)
      } catch (error) {
        console.error('AI Operations Center could not load its PixiJS scene or local sprite assets.', error)
        if (!disposed) setCanvasError(true)
      }
    }
    void initialize()

    return () => {
      disposed = true
      if (app) {
        if (canvas && host.contains(canvas)) host.removeChild(canvas)
        app.destroy(true)
      }
      agentDisplays.clear()
      roomDisplays.clear()
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!isRunningRef.current) return
      const time = simulationTimeRef.current
      const seconds = Math.floor(time / 1000)
      const currentAgents = agentsRef.current
      const hasArrived = currentAgents.some((agent) => agent.travel && time >= agent.travel.startTime + agent.travel.duration)
      if (seconds === lastStateSecondRef.current && !hasArrived) return
      lastStateSecondRef.current = seconds
      const step = advanceSimulation(currentAgents, time, lastProgressAtRef.current)
      lastProgressAtRef.current = step.lastProgressAt
      agentsRef.current = step.agents
      setElapsed(seconds)
      setAgents(step.agents)
    }, 200)
    return () => window.clearInterval(timer)
  }, [])

  const resetSimulation = () => {
    setResetCount((count) => count + 1)
    setWorkflowOpen(false)
    setReserveVisits([])
    simulationTimeRef.current = 0
    lastProgressAtRef.current = 0
    lastStateSecondRef.current = 0
    agentsRef.current = initialAgents.map((agent) => ({ ...agent }))
    setElapsed(0)
    setAgents(agentsRef.current)
    isRunningRef.current = true
    setIsRunning(true)
  }

  return (
    <main className="operations-page" aria-labelledby="operations-title">
      <div className="operations-wrap">
        <header className="operations-heading">
          <div>
            <p className="operations-eyebrow"><span className="live-pulse" /> SUBSURFACE INTELLIGENCE · DEMO SIMULATION</p>
            <h1 id="operations-title" ref={headingRef} tabIndex={-1}>AI Operations Center</h1>
            <p className="operations-subtitle">A connected workspace for exploration data, subsurface insight, and better decisions.</p>
          </div>
        </header>

        <section className="operations-summary" aria-label="Simulation overview">
          <div className="summary-card"><span className="summary-icon"><Users size={17} /></span><span><strong>{String(team.length).padStart(2, '0')}</strong><small>TEAM MEMBERS</small></span></div>
          <div className="summary-card"><span className="summary-icon"><Activity size={17} /></span><span><strong>{String(activeCount).padStart(2, '0')}</strong><small>ACTIVE TASKS</small></span></div>
          <div className="summary-card"><span className="summary-icon"><FileCheck size={17} /></span><span><strong>{String(deliveredCount).padStart(2, '0')}</strong><small>DELIVERED TO DIRECTOR</small></span></div>
          <div className="summary-card"><span className="summary-icon"><Gauge size={17} /></span><span><strong>{teamProgress}%</strong><small>TEAM PROGRESS</small></span></div>
          <div className="simulation-controls">
            <div className="operations-heading-status"><span className="system-status-dot" /> SYSTEM ONLINE <span className="status-divider" /> RUN {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</div>
            <button type="button" onClick={() => setIsRunning((running) => !running)} aria-label={isRunning ? 'Pause simulation' : 'Resume simulation'}>
              {isRunning ? <Pause size={14} /> : <Play size={14} />} {isRunning ? 'PAUSE' : 'RESUME'}
            </button>
            <button type="button" onClick={resetSimulation} aria-label="Reset simulation"><RotateCcw size={14} /> RESET</button>
          </div>
        </section>

        <div className="operations-layout">
          <section className="operations-map-panel" aria-label="AI agent rooms map">
            <div className="panel-topbar">
              <div><span className="panel-kicker">EXPLORATION FLOOR</span><strong>OPEN OFFICE / CONNECTED WORKSPACES</strong></div>
              <div className="map-legend" aria-label="Status key"><span><i className="legend-dot legend-working" /> WORKING</span><span><i className="legend-dot legend-reviewing" /> REVIEW</span><span><i className="legend-dot legend-waiting" /> WAITING</span><span><i className="legend-dot legend-idle" /> IDLE</span><span><i className="legend-dot legend-completed" /> DONE</span></div>
            </div>
            <div className="operations-map" ref={mapHostRef} role="group" aria-label={`Pixel-art open-plan exploration office with ${rooms.length - 1} workstations, geologist and geophysicist desks, and director Rafael's office with an open door`}>
              {canvasError && <p className="map-error">The office scene could not be initialized. Check that the local Pixel Agents sprite assets are available.</p>}
              <OfficeVisitors key={resetCount} visits={reserveVisits} clock={simulationTimeRef} isRunning={isRunning} />
              <svg className="office-desk-actions" viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} aria-label="Desk actions">
                <foreignObject x="938" y="34" width="60" height="44"><button type="button" className="office-object-action" title="Rafael's case files" aria-label="Open Rafael's case files" onClick={() => { setSelectedAgentId('DIR'); setWorkflowOpen(true) }} /></foreignObject>
              </svg>
            </div>
            {visitingReserves.length > 0 && <div className="office-guest-status" role="status">{visitingReserves.length} TEMPORARY {visitingReserves.length === 1 ? 'GUEST' : 'GUESTS'} · Separate demo missions. Main team metrics unchanged.</div>}
            <div className="map-footer"><span><i className="status-pulse" /> {isRunning ? 'LIVE SIMULATION' : 'SIMULATION PAUSED'}</span><span>{rooms.length - 1} OPEN-SPACE DESKS <b>·</b> DIRECTOR OFFICE</span><span>LOCAL MOCK DATA</span></div>
          </section>

          <aside className="operations-sidebar" aria-label="Agent task details">
            <section className="agent-detail-card">
              <div className="sidebar-heading"><span className="panel-kicker">SELECTED MEMBER</span><span className="agent-id">{selectedIsDirector ? 'DIRECTOR' : `UNIT ${selectedAgent.id}`}</span></div>
              <div className="selected-agent">
                <div className="agent-avatar" style={{ '--agent-accent': hexColor(roomById.get(selectedAgent.roomId)?.color ?? 0x2e6f95) } as CSSProperties}><SpritePortrait index={selectedIndex} urls={portraitUrls} /></div>
                <div><h2>{selectedAgent.name}</h2><p>{currentRoomLabel(selectedAgent)}</p></div>
              </div>
              <div className={`agent-status status-${selectedAgent.status.toLowerCase()}`}><span className="status-pulse" />{statusLabel(selectedAgent.status)}</div>
              <p className="task-label">CURRENT TASK</p>
              <p className="task-name">{selectedAgent.task}</p>
              <div className="progress-heading"><span>TASK PROGRESS</span><strong>{selectedAgent.progress}%</strong></div>
              <div className="task-progress"><span style={{ width: `${selectedAgent.progress}%` }} /></div>
              <div className="processing-status"><span>PROCESSING STATUS</span><strong>{processingLabel(selectedAgent)}</strong></div>
            </section>

            <section className="agent-list-card">
              <div className="sidebar-heading"><span className="panel-kicker">ACTIVE WORKFLOWS</span><span className="task-count">{team.length} TEAM · {director ? 1 : 0} DIRECTOR</span></div>
              <div className="agent-list">
                {[...(director ? [director] : []), ...team].map((agent) => {
                  const room = roomById.get(agent.roomId)!
                  const isDirector = agent.roomId === DIRECTOR_ROOM_ID
                  return (
                    <button className={`agent-list-item${isDirector ? ' is-director' : ''}${selectedAgent.id === agent.id ? ' is-selected' : ''}`} type="button" key={agent.id} onClick={() => setSelectedAgentId(agent.id)} aria-pressed={selectedAgent.id === agent.id}>
                      <span className="agent-list-mark" style={{ '--agent-accent': hexColor(room.color) } as CSSProperties}><SpritePortrait index={agents.indexOf(agent)} urls={portraitUrls} /></span>
                      <span className="agent-list-copy"><strong>{agent.name}<small>{isDirector ? 'Director · ' + (agent.task) : currentRoomLabel(agent)}</small></strong><span className="mini-progress"><i style={{ width: `${agent.progress}%`, backgroundColor: hexColor(room.color) }} /></span></span>
                      <span className={`agent-list-status status-${agent.status.toLowerCase()}`}>{agent.status === 'Completed' ? 'DONE' : agent.status === 'Reviewing' ? 'REVIEW' : agent.status.toUpperCase()}</span>
                    </button>
                  )
                })}
              </div>
            </section>
            <p className="simulation-note">Illustrative simulation · All tasks and metrics are generated locally.</p>
          </aside>

          <BackupTeam
            key={resetCount}
            isRunning={isRunning}
            onToggleRunning={() => setIsRunning((running) => !running)}
            time={elapsed * 1000}
            visits={reserveVisits}
            onAssignMission={(missionId, memberIndex) => setReserveVisits((current) => {
              try {
                return assignReserveMission(current, missionId, memberIndex, simulationTimeRef.current)
              } catch (error) {
                // A fast double-click can race the disabled state; keep the existing visits.
                console.error('Reserve mission could not be assigned.', error)
                return current
              }
            })}
            onViewOffice={() => mapHostRef.current?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
            assignmentBlockedReason={canvasError ? 'The office scene must load before a guest can visit.' : undefined}
          />
        </div>
        <div className="office-download-backdrop office-case-backdrop" hidden={!workflowOpen} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setWorkflowOpen(false) }}>
          <section className="office-download-dialog office-case-dialog" role="dialog" aria-modal="true" aria-labelledby="workflow-title">
            <header><p className="panel-kicker">RAFAEL / CASE FILES</p><button ref={workflowCloseRef} type="button" title="Close case files" aria-label="Close case files" onClick={() => setWorkflowOpen(false)}><X size={18} /></button></header>
            <WorkflowDemo key={resetCount} onVisitDesk={(roomId) => {
              const agent = agentsRef.current.find((member) => member.roomId === roomId)
              if (agent) setSelectedAgentId(agent.id)
            }} />
          </section>
        </div>
        <footer className="operations-footnote"><span><Cpu size={13} /> HUMAN JUDGMENT STAYS IN THE LOOP</span><span>AI supports exploration workflows. It does not replace subsurface expertise.</span></footer>
        <div className="stage-next">
          <button type="button" className="stage-return" aria-label="Return to universe" onClick={() => onNavigate('home')}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="stage-action-label-full">Return to universe</span>
            <span className="stage-action-label-mobile" aria-hidden="true">Return</span>
          </button>
          <button type="button" className="stage-return" aria-label="Continue the story" onClick={() => onNavigate('impact')}>
            <span className="stage-action-label-full">Continue the story</span>
            <span className="stage-action-label-mobile" aria-hidden="true">Continue</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </main>
  )
}
