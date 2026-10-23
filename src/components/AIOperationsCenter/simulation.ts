export interface Point {
  x: number
  y: number
}

export interface Room {
  id: string
  name: string
  shortName: string
  task: string
  color: number
  x: number
  y: number
  width: number
  height: number
  row: number
  desk: Point
  seat: Point
  door: Point
  visitor: Point
  corridorY: number
}

export type AgentStatus = 'Idle' | 'Working' | 'Waiting' | 'Reviewing' | 'Completed'

export interface Travel {
  from: string
  to: string
  startTime: number
  duration: number
  path: Point[]
  resumeStatus: AgentStatus
  purpose?: 'deliver' | 'return'
}

export interface Agent {
  id: string
  name: string
  roomId: string
  task: string
  status: AgentStatus
  progress: number
  travel?: Travel
  completedAt?: number
  /** Set while the agent stands at a colleague's desk handing over a deliverable. */
  visit?: { since: number; roomId: string }
  /** Deliverables handed to the director. */
  deliveries?: number
  waitingSince?: number
  /** A hand-off received while busy; picked up as soon as the current job is delivered. */
  inbox?: { item: string; from: string }
}

export interface PathPosition extends Point {
  direction: 'up' | 'down' | 'left' | 'right'
}

export const WORLD_WIDTH = 1040
export const WORLD_HEIGHT = 790
export const WALK_SPEED = 54
export const VISIT_DURATION_MS = 4_000
export const WAIT_TIMEOUT_MS = 60_000

export const ROOM_WIDTH = 300
export const ROOM_HEIGHT = 220
export const COLUMN_X = [34, 370, 706]
export const ROW_Y = [38, 294, 550]
export const CORRIDOR_Y = [276, 532]
export const CORRIDOR_WIDTH = 36
export const VERTICAL_CORRIDOR_X = [352, 688]

type RoomSeed = Pick<Room, 'id' | 'name' | 'shortName' | 'task' | 'color'>

function createRoom(seed: RoomSeed, column: number, row: number): Room {
  const x = COLUMN_X[column]
  const y = ROW_Y[row]
  const centerX = x + ROOM_WIDTH / 2
  // Bottom-row rooms open onto the corridor above them, so their desk shifts right to keep the doorway clear.
  const opensUp = row === 2
  const deskX = opensUp ? centerX + 40 : centerX
  return {
    ...seed,
    x,
    y,
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    row,
    desk: { x: deskX, y: y + 96 },
    seat: { x: deskX, y: y + 158 },
    door: opensUp ? { x: x + 60, y } : { x: centerX, y: y + ROOM_HEIGHT },
    visitor: { x: deskX - 46, y: y + 164 },
    corridorY: row === 0 ? CORRIDOR_Y[0] : CORRIDOR_Y[1],
  }
}

export const DIRECTOR_ROOM_ID = 'director'

export const rooms: Room[] = [
  createRoom({ id: 'ingestion', name: 'Data Ingestion', shortName: 'INGESTION', task: 'Seismic & well data sync', color: 0x6ec7bf }, 0, 0),
  createRoom({ id: 'logs', name: 'Well Log Analysis', shortName: 'WELL LOGS', task: 'LAS curve normalization', color: 0x83c1ef }, 1, 0),
  createRoom({ id: DIRECTOR_ROOM_ID, name: 'Director Office', shortName: 'DIRECTOR · RAFAEL', task: 'Operations oversight & reports', color: 0xd8b25a }, 2, 0),
  createRoom({ id: 'petrophysics', name: 'Petrophysics', shortName: 'PETROPHYSICS', task: 'Porosity & saturation', color: 0xe6b670 }, 0, 1),
  createRoom({ id: 'gis', name: 'GIS Mapping', shortName: 'GIS MAPPING', task: 'Prospect map layers', color: 0xb89be8 }, 1, 1),
  createRoom({ id: 'reservoir', name: 'Reservoir Analytics', shortName: 'RESERVOIR', task: 'Pressure-depletion model', color: 0x74c9dc }, 2, 1),
  createRoom({ id: 'geology', name: 'Geologist Desk', shortName: 'GEOLOGIST', task: 'Facies & structural interpretation', color: 0xd99a6c }, 0, 2),
  createRoom({ id: 'economics', name: 'Economics', shortName: 'ECONOMICS', task: 'Scenario sensitivity run', color: 0xe58d80 }, 1, 2),
  createRoom({ id: 'geophysics', name: 'Geophysicist Desk', shortName: 'GEOPHYSICIST', task: 'Seismic horizon interpretation', color: 0x9fa8f0 }, 2, 2),
]

export const roomById = new Map(rooms.map((room) => [room.id, room]))

export const initialAgents: Agent[] = [
  { id: 'DIR', name: 'RAFAEL', roomId: DIRECTOR_ROOM_ID, task: 'Overseeing team operations', status: 'Reviewing', progress: 62 },
  { id: '01', name: 'Joel', roomId: 'ingestion', task: 'Syncing 14 well files', status: 'Working', progress: 68 },
  { id: '02', name: 'Palo', roomId: 'logs', task: 'Checking curve coverage', status: 'Reviewing', progress: 84 },
  { id: '03', name: 'Igor', roomId: 'petrophysics', task: 'Waiting for normalized log curves from Well Log Analysis', status: 'Waiting', progress: 32 },
  { id: '04', name: 'Sun Y', roomId: 'gis', task: 'Updating surface layers', status: 'Working', progress: 49 },
  { id: '05', name: 'Luke', roomId: 'reservoir', task: 'Running 3 model cases', status: 'Working', progress: 73 },
  { id: '06', name: 'IRIS', roomId: 'economics', task: 'Reviewing price deck', status: 'Idle', progress: 21 },
  { id: '07', name: 'Lisa W', roomId: 'geology', task: 'Mapping depositional facies', status: 'Working', progress: 41 },
  { id: '08', name: 'Victor', roomId: 'geophysics', task: 'Picking seismic horizons', status: 'Working', progress: 57 },
]

export interface SimulationStep {
  agents: Agent[]
  lastProgressAt: number
}

/** Subsurface workflow: each desk hands its finished deliverable to the next specialist, ending with Rafael. */
export const HANDOFF_TARGETS: Record<string, string> = {
  ingestion: 'logs',
  logs: 'petrophysics',
  petrophysics: 'reservoir',
  reservoir: 'economics',
  economics: DIRECTOR_ROOM_ID,
  geophysics: 'geology',
  geology: 'gis',
  gis: DIRECTOR_ROOM_ID,
}

export const DELIVERABLES: Record<string, string> = {
  ingestion: 'QC-checked well data',
  logs: 'normalized log curves',
  petrophysics: 'porosity & saturation results',
  reservoir: 'production forecast',
  economics: 'economic scenarios',
  geophysics: 'interpreted seismic horizons',
  geology: 'facies model',
  gis: 'prospect maps',
}

export function upstreamRoomId(roomId: string) {
  return Object.keys(HANDOFF_TARGETS).find((source) => HANDOFF_TARGETS[source] === roomId && roomId !== DIRECTOR_ROOM_ID)
}

function waitingTask(roomId: string) {
  const upstream = upstreamRoomId(roomId)
  return upstream ? `Waiting for ${DELIVERABLES[upstream]} from ${roomById.get(upstream)?.name ?? upstream}` : undefined
}

function startDelivery(agent: Agent, time: number): Agent {
  const target = HANDOFF_TARGETS[agent.roomId] ?? DIRECTOR_ROOM_ID
  const path = createWalkingPath(agent.roomId, target, { toVisitor: true })
  return {
    ...agent,
    status: 'Completed',
    completedAt: undefined,
    travel: {
      from: agent.roomId,
      to: target,
      startTime: time,
      duration: pathLength(path) / WALK_SPEED * 1000,
      path,
      resumeStatus: 'Completed',
      purpose: 'deliver',
    },
  }
}

function startReturn(agent: Agent, time: number): Agent {
  const from = agent.visit?.roomId ?? DIRECTOR_ROOM_ID
  const path = createWalkingPath(from, agent.roomId, { fromVisitor: true })
  return {
    ...agent,
    visit: undefined,
    progress: 10,
    travel: {
      from,
      to: agent.roomId,
      startTime: time,
      duration: pathLength(path) / WALK_SPEED * 1000,
      path,
      resumeStatus: 'Idle',
      purpose: 'return',
    },
  }
}

/** Back at their desk, specialists start on any queued input, otherwise wait for upstream; source desks stand by. */
function settleAtDesk(agent: Agent, time: number): Agent {
  if (agent.inbox) {
    return { ...agent, ...integrating(agent.inbox), travel: undefined, inbox: undefined }
  }
  const task = waitingTask(agent.roomId)
  return task
    ? { ...agent, status: 'Waiting', task, travel: undefined, waitingSince: time }
    : { ...agent, status: 'Idle', task: roomById.get(agent.roomId)?.task ?? agent.task, travel: undefined }
}

function integrating(input: { item: string; from: string }) {
  return {
    status: 'Working' as const,
    task: `Integrating ${input.item} from ${input.from}`,
    progress: 10,
    completedAt: undefined,
    waitingSince: undefined,
  }
}

function receiveHandoff(receiver: Agent, courier: Agent): Agent {
  const item = DELIVERABLES[courier.roomId] ?? 'deliverable'
  if (receiver.roomId === DIRECTOR_ROOM_ID) {
    return { ...receiver, status: 'Reviewing', task: `Reviewing ${courier.name}'s ${item}`, progress: 20, completedAt: undefined }
  }
  // Busy specialists queue the input and pick it up after delivering their current job.
  if (receiver.status === 'Working' || receiver.status === 'Reviewing') {
    return { ...receiver, inbox: { item, from: courier.name } }
  }
  return { ...receiver, ...integrating({ item, from: courier.name }) }
}

export function advanceSimulation(agents: Agent[], time: number, lastProgressAt: number): SimulationStep {
  const seconds = Math.floor(time / 1000)
  const arrivedDeliveries: Agent[] = []
  let next = agents.map((agent, index) => {
    if (agent.travel && time >= agent.travel.startTime + agent.travel.duration) {
      if (agent.travel.purpose === 'deliver') {
        const target = agent.travel.to
        const delivered = {
          ...agent,
          status: 'Completed' as const,
          travel: undefined,
          visit: { since: time, roomId: target },
          deliveries: (agent.deliveries ?? 0) + (target === DIRECTOR_ROOM_ID ? 1 : 0),
        }
        arrivedDeliveries.push(delivered)
        return delivered
      }
      return settleAtDesk({ ...agent, roomId: agent.travel.to }, time)
    }
    if (agent.travel) return agent
    if (agent.visit) {
      return time - agent.visit.since >= VISIT_DURATION_MS ? startReturn(agent, time) : agent
    }
    if (agent.status === 'Completed') {
      if (agent.completedAt !== undefined && time - agent.completedAt >= 5000) {
        return { ...agent, status: 'Idle' as const, progress: 10, completedAt: undefined }
      }
      return agent
    }
    if (agent.status === 'Waiting' && time - (agent.waitingSince ?? 0) >= WAIT_TIMEOUT_MS) {
      // Nobody should stall forever: after a while the specialist carries on with the data already on hand.
      return { ...agent, status: 'Working' as const, task: roomById.get(agent.roomId)?.task ?? agent.task, waitingSince: undefined }
    }
    if (agent.status === 'Idle' && seconds > 0 && seconds % (22 + index * 3) === index * 2) {
      return { ...agent, status: 'Working' as const, task: roomById.get(agent.roomId)?.task ?? agent.task }
    }
    return agent
  })

  arrivedDeliveries.forEach((courier) => {
    const target = courier.visit!.roomId
    next = next.map((agent) => agent.roomId === target && !agent.travel && !agent.visit ? receiveHandoff(agent, courier) : agent)
  })

  if (time >= lastProgressAt + 1000) {
    lastProgressAt = time
    next = next.map((agent) => {
      if (agent.travel || agent.visit) return agent
      if (agent.status !== 'Working' && agent.status !== 'Reviewing') return agent
      const progress = Math.min(100, agent.progress + 1)
      if (progress >= 100) {
        // Finished deliverables are walked to the next specialist; the director just closes his review.
        return agent.roomId === DIRECTOR_ROOM_ID
          ? { ...agent, progress, status: 'Completed' as const, completedAt: time }
          : startDelivery({ ...agent, progress }, time)
      }
      return { ...agent, progress, status: progress >= 90 ? 'Reviewing' as const : agent.status }
    })
  }

  return { agents: next, lastProgressAt }
}

export interface WalkingPathOptions {
  fromVisitor?: boolean
  toVisitor?: boolean
}

export function createWalkingPath(fromId: string, toId: string, options: WalkingPathOptions = {}): Point[] {
  const from = roomById.get(fromId)
  const to = roomById.get(toId)
  if (!from || !to) throw new Error(`Unknown room in route: ${fromId} -> ${toId}`)

  // Visitors stand in front of the desk, so they step in just past the doorway instead of using the chair column.
  const entryFor = (room: Room) => ({ x: room.door.x, y: room.door.y + (room.door.y === room.y ? 18 : -18) })
  const fromEntry = entryFor(from)
  const toEntry = entryFor(to)
  const path: Point[] = options.fromVisitor
    ? [from.visitor, { x: from.visitor.x, y: fromEntry.y }, fromEntry, from.door]
    : [from.seat, { x: from.door.x, y: from.seat.y }, from.door]
  path.push({ x: from.door.x, y: from.corridorY })
  if (from.corridorY !== to.corridorY) {
    const connectorX = VERTICAL_CORRIDOR_X.reduce((best, x) =>
      Math.abs(from.door.x - x) + Math.abs(to.door.x - x) < Math.abs(from.door.x - best) + Math.abs(to.door.x - best) ? x : best)
    path.push({ x: connectorX, y: from.corridorY }, { x: connectorX, y: to.corridorY })
  }
  path.push({ x: to.door.x, y: to.corridorY }, to.door)
  if (options.toVisitor) {
    path.push(toEntry, { x: to.visitor.x, y: toEntry.y }, to.visitor)
  } else {
    path.push({ x: to.door.x, y: to.seat.y }, to.seat)
  }

  return path.filter((point, index) => index === 0 || point.x !== path[index - 1].x || point.y !== path[index - 1].y)
}

export function pathLength(path: Point[]) {
  return path.slice(1).reduce((total, point, index) => total + Math.hypot(point.x - path[index].x, point.y - path[index].y), 0)
}

export function positionAlongPath(path: Point[], progress: number): PathPosition {
  if (path.length === 0) throw new Error('A walking route must contain at least one point')
  if (path.length === 1) return { ...path[0], direction: 'down' }

  const total = pathLength(path)
  let remaining = Math.max(0, Math.min(1, progress)) * total
  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1]
    const to = path[index]
    const segmentLength = Math.hypot(to.x - from.x, to.y - from.y)
    if (remaining <= segmentLength || index === path.length - 1) {
      const segmentProgress = segmentLength === 0 ? 1 : Math.min(1, remaining / segmentLength)
      const direction = Math.abs(to.x - from.x) > Math.abs(to.y - from.y)
        ? to.x > from.x ? 'right' : 'left'
        : to.y > from.y ? 'down' : 'up'
      return {
        x: from.x + (to.x - from.x) * segmentProgress,
        y: from.y + (to.y - from.y) * segmentProgress,
        direction,
      }
    }
    remaining -= segmentLength
  }
  return { ...path[path.length - 1], direction: 'down' }
}

export function positionForAgent(agent: Agent, time: number): PathPosition {
  if (agent.visit) {
    const visitor = roomById.get(agent.visit.roomId)?.visitor
    if (!visitor) throw new Error(`Unknown visit room for agent ${agent.id}: ${agent.visit.roomId}`)
    return { ...visitor, direction: 'right' }
  }
  if (!agent.travel) {
    const seat = roomById.get(agent.roomId)?.seat
    if (!seat) throw new Error(`Unknown room for agent ${agent.id}: ${agent.roomId}`)
    return { ...seat, direction: 'up' }
  }
  const progress = agent.travel.duration <= 0 ? 1 : (time - agent.travel.startTime) / agent.travel.duration
  return positionAlongPath(agent.travel.path, progress)
}
