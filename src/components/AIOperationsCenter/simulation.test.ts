import { describe, expect, it } from 'vitest'
import { advanceSimulation, CORRIDOR_Y, createWalkingPath, DELIVERABLES, DIRECTOR_ROOM_ID, HANDOFF_TARGETS, initialAgents, pathLength, positionAlongPath, positionForAgent, rooms, upstreamRoomId, VERTICAL_CORRIDOR_X, VISIT_DURATION_MS, WAIT_TIMEOUT_MS } from './simulation'
import type { Agent } from './simulation'

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
    const step = advanceSimulation(initialAgents, 10_000, 9000)
    expect(step.agents.find((agent) => agent.name === 'RAFAEL')?.travel).toBeUndefined()
  })

  it('chains every open-space desk through the workflow to the director', () => {
    rooms.filter((room) => room.id !== DIRECTOR_ROOM_ID).forEach((room) => {
      expect(DELIVERABLES[room.id]).toBeTruthy()
      const seen = new Set<string>()
      let current = room.id
      while (current !== DIRECTOR_ROOM_ID) {
        expect(seen.has(current)).toBe(false)
        seen.add(current)
        current = HANDOFF_TARGETS[current]
        expect(current).toBeTruthy()
      }
    })
    expect(upstreamRoomId('petrophysics')).toBe('logs')
    expect(upstreamRoomId('ingestion')).toBeUndefined()
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

  it('hands a finished deliverable to the next specialist, who starts integrating it', () => {
    const petrophysics = rooms.find((room) => room.id === 'petrophysics')!
    const agents = initialAgents.map((agent) => agent.id === '02' ? { ...agent, status: 'Reviewing' as const, progress: 99 } : agent)

    const finished = advanceSimulation(agents, 2000, 1000)
    const courier = finished.agents.find((agent) => agent.id === '02')!
    expect(courier).toMatchObject({ roomId: 'logs', status: 'Completed', travel: { to: 'petrophysics', purpose: 'deliver' } })
    expect(courier.travel!.path[courier.travel!.path.length - 1]).toEqual(petrophysics.visitor)
    courier.travel!.path.forEach((point) => {
      const inCorridor = CORRIDOR_Y.includes(point.y) || VERTICAL_CORRIDOR_X.includes(point.x)
      const logsRoom = rooms.find((room) => room.id === 'logs')!
      expect(insideRoom(point, logsRoom) || insideRoom(point, petrophysics) || inCorridor).toBe(true)
    })

    const arrivalTime = courier.travel!.startTime + courier.travel!.duration
    const arrived = advanceSimulation(finished.agents, arrivalTime, finished.lastProgressAt)
    const visitor = arrived.agents.find((agent) => agent.id === '02')!
    expect(visitor).toMatchObject({ roomId: 'logs', visit: { since: arrivalTime, roomId: 'petrophysics' } })
    expect(visitor.deliveries ?? 0).toBe(0)
    expect(positionForAgent(visitor, arrivalTime)).toMatchObject(petrophysics.visitor)
    const receiver = arrived.agents.find((agent) => agent.id === '03')!
    expect(receiver).toMatchObject({ status: 'Working', task: 'Integrating normalized log curves from CORE' })
    expect(receiver.progress).toBeLessThanOrEqual(11)

    const leaving = advanceSimulation(arrived.agents, arrivalTime + VISIT_DURATION_MS, arrived.lastProgressAt)
    const returning = leaving.agents.find((agent) => agent.id === '02')!
    expect(returning).toMatchObject({ visit: undefined, travel: { from: 'petrophysics', to: 'logs', purpose: 'return' } })

    const backTime = returning.travel!.startTime + returning.travel!.duration
    const back = advanceSimulation(leaving.agents, backTime, leaving.lastProgressAt)
    expect(back.agents.find((agent) => agent.id === '02')).toMatchObject({
      roomId: 'logs',
      status: 'Waiting',
      travel: undefined,
      progress: 10,
      waitingSince: backTime,
      task: 'Waiting for QC-checked well data from Data Ingestion',
    })
  })

  it('counts deliveries that reach Rafael and puts him in review', () => {
    const agents = initialAgents.map((agent) => agent.id === '06' ? { ...agent, status: 'Reviewing' as const, progress: 99 } : agent)
    const finished = advanceSimulation(agents, 2000, 1000)
    const courier = finished.agents.find((agent) => agent.id === '06')!
    expect(courier.travel).toMatchObject({ to: DIRECTOR_ROOM_ID, purpose: 'deliver' })

    const arrivalTime = courier.travel!.startTime + courier.travel!.duration
    const arrived = advanceSimulation(finished.agents, arrivalTime, finished.lastProgressAt)
    expect(arrived.agents.find((agent) => agent.id === '06')).toMatchObject({ deliveries: 1, visit: { roomId: DIRECTOR_ROOM_ID } })
    expect(arrived.agents.find((agent) => agent.roomId === DIRECTOR_ROOM_ID)).toMatchObject({
      status: 'Reviewing',
      task: "Reviewing IRIS's economic scenarios",
    })
  })

  it('does not interrupt a busy receiver and never leaves a specialist waiting forever', () => {
    const courier: Agent = { ...initialAgents[1], id: 'C', roomId: 'ingestion', status: 'Completed', travel: undefined, visit: undefined }
    const busy: Agent = { ...initialAgents[2], status: 'Working', progress: 50 }
    const deliveringPath = createWalkingPath('ingestion', 'logs', { toVisitor: true })
    const step = advanceSimulation([
      { ...courier, travel: { from: 'ingestion', to: 'logs', startTime: 0, duration: 1000, path: deliveringPath, resumeStatus: 'Completed', purpose: 'deliver' } },
      busy,
    ], 1000, 1000)
    expect(step.agents[1]).toMatchObject({ status: 'Working', progress: 50, task: busy.task, inbox: { item: 'QC-checked well data', from: courier.name } })

    // Once the busy specialist delivers and walks back, the queued input is picked up instead of waiting.
    const returnPath = createWalkingPath('petrophysics', 'logs', { fromVisitor: true })
    const returning: Agent = { ...step.agents[1], status: 'Completed', travel: { from: 'petrophysics', to: 'logs', startTime: 2000, duration: 1000, path: returnPath, resumeStatus: 'Idle', purpose: 'return' } }
    expect(advanceSimulation([returning], 3000, 3000).agents[0]).toMatchObject({
      status: 'Working',
      task: `Integrating QC-checked well data from ${courier.name}`,
      inbox: undefined,
    })

    const waiting: Agent = { ...initialAgents[3], status: 'Waiting', waitingSince: 5000 }
    expect(advanceSimulation([waiting], 5000 + WAIT_TIMEOUT_MS - 1, 0).agents[0].status).toBe('Waiting')
    expect(advanceSimulation([waiting], 5000 + WAIT_TIMEOUT_MS, 0).agents[0]).toMatchObject({ status: 'Working', task: 'Porosity & saturation' })
  })

  it('keeps the whole workflow flowing over several simulated minutes', () => {
    let step = advanceSimulation(initialAgents, 0, 0)
    const integratingTasks = new Set<string>()
    for (let time = 200; time <= 360_000; time += 200) {
      step = advanceSimulation(step.agents, time, step.lastProgressAt)
      step.agents.forEach((agent) => {
        if (agent.task.startsWith('Integrating')) integratingTasks.add(agent.roomId)
        expect(agent.progress).toBeGreaterThanOrEqual(0)
        expect(agent.progress).toBeLessThanOrEqual(100)
      })
    }
    const delivered = step.agents.reduce((total, agent) => total + (agent.deliveries ?? 0), 0)
    expect(delivered).toBeGreaterThan(0)
    expect(integratingTasks.size).toBeGreaterThanOrEqual(3)
    step.agents.forEach((agent, index) => expect(agent.roomId).toBe(initialAgents[index].roomId))
  })

  it('no longer relocates workers between desks on a timer', () => {
    let step = advanceSimulation(initialAgents, 0, 0)
    for (let time = 1000; time <= 15_000; time += 1000) step = advanceSimulation(step.agents, time, step.lastProgressAt)
    step.agents.forEach((agent, index) => expect(agent.roomId).toBe(initialAgents[index].roomId))
    expect(step.agents.some((agent) => agent.travel)).toBe(false)
  })
})
