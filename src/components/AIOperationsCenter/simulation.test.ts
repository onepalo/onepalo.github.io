import { describe, expect, it } from 'vitest'
import { advanceSimulation, CORRIDOR_Y, createWalkingPath, DIRECTOR_ROOM_ID, initialAgents, nextRoomId, pathLength, positionAlongPath, positionForAgent, rooms, VERTICAL_CORRIDOR_X, VISIT_DURATION_MS } from './simulation'

const insideRoom = (point: { x: number; y: number }, room: (typeof rooms)[number]) =>
  point.x >= room.x && point.x <= room.x + room.width && point.y >= room.y && point.y <= room.y + room.height

describe('AI Operations Center walking paths', () => {
  it('includes dedicated geologist and geophysicist workstations with assigned agents', () => {
    expect(rooms.map((room) => room.id)).toEqual(expect.arrayContaining(['geology', 'geophysics']))
    expect(initialAgents.map((agent) => agent.roomId)).toEqual(expect.arrayContaining(['geology', 'geophysics']))
  })

  it('keeps Rafael in the director office while eight team members work in the open space', () => {
    expect(initialAgents.filter((agent) => agent.roomId !== DIRECTOR_ROOM_ID)).toHaveLength(8)
    expect(initialAgents.find((agent) => agent.roomId === DIRECTOR_ROOM_ID)?.name).toBe('RAFAEL')
    rooms.filter((room) => room.id !== DIRECTOR_ROOM_ID).forEach((room) => {
      expect(nextRoomId(room.id)).not.toBe(DIRECTOR_ROOM_ID)
    })
    const step = advanceSimulation(initialAgents, 10_000, 9000, 10_000)
    expect(step.agents.find((agent) => agent.name === 'RAFAEL')?.travel).toBeUndefined()
  })

  it.each(rooms.flatMap((room) => rooms.filter((destination) => room.id !== destination.id).map((destination) => [room.id, destination.id] as const)))(
    'routes %s to %s only through its own rooms and the corridor network',
    (from, to) => {
      const fromRoom = rooms.find((room) => room.id === from)!
      const toRoom = rooms.find((room) => room.id === to)!
      createWalkingPath(from, to).forEach((point) => {
        const inCorridor = CORRIDOR_Y.includes(point.y) || VERTICAL_CORRIDOR_X.includes(point.x)
        expect(insideRoom(point, fromRoom) || insideRoom(point, toRoom) || inCorridor).toBe(true)
      })
    },
  )
  it.each(rooms.flatMap((room) => rooms.filter((destination) => room.id !== destination.id).map((destination) => [room.id, destination.id] as const)))(
    'connects %s to %s using horizontal and vertical corridor segments',
    (from, to) => {
      const path = createWalkingPath(from, to)
      expect(path[0]).toEqual(rooms.find((room) => room.id === from)?.seat)
      expect(path[path.length - 1]).toEqual(rooms.find((room) => room.id === to)?.seat)
      expect(pathLength(path)).toBeGreaterThan(0)
      path.slice(1).forEach((point, index) => {
        const previous = path[index]
        expect(point.x === previous.x || point.y === previous.y).toBe(true)
      })
    },
  )

  it('moves continuously along a route and reaches the exact workstation seat', () => {
    const path = createWalkingPath('ingestion', 'petrophysics')
    const beforeCorner = positionAlongPath(path, 0.24)
    const afterCorner = positionAlongPath(path, 0.26)
    const destination = positionAlongPath(path, 1)

    expect(Math.hypot(afterCorner.x - beforeCorner.x, afterCorner.y - beforeCorner.y)).toBeLessThan(30)
    expect(destination).toMatchObject(rooms.find((room) => room.id === 'petrophysics')!.seat)
  })

  it('derives travel position from simulated time rather than wall-clock time', () => {
    const path = createWalkingPath('logs', 'gis')
    const agent = {
      id: 'test-agent',
      name: 'TEST',
      roomId: 'logs',
      task: 'Moving',
      status: 'Waiting' as const,
      progress: 50,
      travel: { from: 'logs', to: 'gis', startTime: 1000, duration: 4000, path, resumeStatus: 'Working' as const },
    }

    expect(positionForAgent(agent, 1000)).toMatchObject(path[0])
    expect(positionForAgent(agent, 3000)).not.toMatchObject(path[0])
    expect(positionForAgent(agent, 5000)).toMatchObject(path[path.length - 1])
  })

  it('walks a finished deliverable to Rafael, waits at his desk, and returns to the same workstation', () => {
    const director = rooms.find((room) => room.id === DIRECTOR_ROOM_ID)!
    const agents = initialAgents.map((agent) => agent.id === '02' ? { ...agent, status: 'Reviewing' as const, progress: 99 } : agent)

    const finished = advanceSimulation(agents, 2000, 1000, 60_000)
    const courier = finished.agents.find((agent) => agent.id === '02')!
    expect(courier).toMatchObject({ roomId: 'logs', status: 'Completed', travel: { to: DIRECTOR_ROOM_ID, purpose: 'deliver' } })
    expect(courier.travel!.path[courier.travel!.path.length - 1]).toEqual(director.visitor)
    courier.travel!.path.forEach((point) => {
      const inCorridor = CORRIDOR_Y.includes(point.y) || VERTICAL_CORRIDOR_X.includes(point.x)
      const logsRoom = rooms.find((room) => room.id === 'logs')!
      expect(insideRoom(point, logsRoom) || insideRoom(point, director) || inCorridor).toBe(true)
    })

    const arrivalTime = courier.travel!.startTime + courier.travel!.duration
    const arrived = advanceSimulation(finished.agents, arrivalTime, finished.lastProgressAt, finished.nextMovementAt)
    const visitor = arrived.agents.find((agent) => agent.id === '02')!
    expect(visitor).toMatchObject({ roomId: 'logs', visit: { since: arrivalTime }, deliveries: 1 })
    expect(positionForAgent(visitor, arrivalTime)).toMatchObject(director.visitor)
    expect(arrived.agents.find((agent) => agent.roomId === DIRECTOR_ROOM_ID)).toMatchObject({ status: 'Reviewing', task: "Reviewing CORE's deliverable" })

    const leaving = advanceSimulation(arrived.agents, arrivalTime + VISIT_DURATION_MS, arrived.lastProgressAt, arrived.nextMovementAt)
    const returning = leaving.agents.find((agent) => agent.id === '02')!
    expect(returning).toMatchObject({ visit: undefined, travel: { from: DIRECTOR_ROOM_ID, to: 'logs', purpose: 'return' } })

    const back = advanceSimulation(leaving.agents, returning.travel!.startTime + returning.travel!.duration, leaving.lastProgressAt, leaving.nextMovementAt)
    expect(back.agents.find((agent) => agent.id === '02')).toMatchObject({ roomId: 'logs', status: 'Idle', travel: undefined, progress: 10 })
  })

  it('starts and completes a scheduled workstation walk', () => {
    const beforeMovement = advanceSimulation(initialAgents, 9999, 9000, 10_000)
    expect(beforeMovement.agents[0].travel).toBeUndefined()

    const movement = advanceSimulation(
      beforeMovement.agents,
      10_000,
      beforeMovement.lastProgressAt,
      beforeMovement.nextMovementAt,
    )
    const traveler = movement.agents.find((agent) => agent.id === '01')!
    expect(traveler).toMatchObject({
      roomId: 'ingestion',
      status: 'Waiting',
      travel: { from: 'ingestion', to: 'logs', startTime: 10_000 },
    })

    const arrivalTime = traveler.travel!.startTime + traveler.travel!.duration
    const arrival = advanceSimulation(
      movement.agents,
      arrivalTime,
      movement.lastProgressAt,
      movement.nextMovementAt,
    )
    expect(arrival.agents.find((agent) => agent.id === '01')).toMatchObject({
      roomId: 'logs',
      status: 'Working',
      travel: undefined,
    })
  })
})
