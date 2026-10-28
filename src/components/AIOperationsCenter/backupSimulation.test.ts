import { describe, expect, it } from 'vitest'
import { activityForReserve, activeVisitForMember, assignReserveMission, missionPhase, positionForReserveVisit, RESERVE_ACTIVITIES, RESERVE_MISSIONS, RESERVE_TEAM } from './backupSimulation'
import { initialAgents, WORLD_HEIGHT, WORLD_WIDTH } from './simulation'

describe('reserve lounge activities', () => {
  it('keeps twenty distinct characters in pairs and visits every activity on a 60-second cycle', () => {
    expect(RESERVE_TEAM).toHaveLength(20)
    expect(new Set(RESERVE_TEAM.map((member) => member.name)).size).toBe(20)
    expect(RESERVE_TEAM.slice(10, 15).every((member) => member.collection === 'ACTION · COMBAT')).toBe(true)
    expect(RESERVE_TEAM.slice(15).every((member) => member.collection === 'SUPERHERO')).toBe(true)
    for (let index = 0; index < RESERVE_TEAM.length; index += 2) {
      const activities = Array.from({ length: 5 }, (_, step) => activityForReserve(index, step * 12_000).id)
      expect(new Set(activities).size).toBe(RESERVE_ACTIVITIES.length)
      expect(activityForReserve(index, 12_000)).toEqual(activityForReserve(index + 1, 12_000))
      expect(activityForReserve(index, 60_000)).toEqual(activityForReserve(index, 0))
    }
  })
})

describe('temporary reserve missions', () => {
  it.each(RESERVE_MISSIONS)('routes $id through clear corridors without changing the core agents', (mission) => {
    const original = structuredClone(initialAgents)
    const visits = assignReserveMission([], mission.id, 0, 2_000)
    const visit = visits[0]
    expect(initialAgents).toEqual(original)
    expect(visit.path[0]).toEqual({ x: 688, y: WORLD_HEIGHT - 12 })
    for (const [index, point] of visit.path.entries()) {
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(WORLD_WIDTH)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(WORLD_HEIGHT)
      if (index > 0) {
        expect(point.x === visit.path[index - 1].x || point.y === visit.path[index - 1].y).toBe(true)
      }
    }
    expect(visit.travelMs).toBeGreaterThan(0)
    expect(missionPhase(visit, visit.startedAt)).toBe('outbound')
    expect(missionPhase(visit, visit.startedAt + visit.travelMs)).toBe('working')
    expect(missionPhase(visit, visit.startedAt + visit.travelMs + visit.workMs)).toBe('returning')
    const finish = visit.startedAt + 2 * visit.travelMs + visit.workMs
    expect(missionPhase(visit, finish - .01)).toBe('returning')
    expect(missionPhase(visit, finish)).toBe('complete')
    expect(activeVisitForMember(visits, 0, finish)).toBeUndefined()
    expect(positionForReserveVisit(visit, finish)).toMatchObject(visit.path[0])
  })

  it('supports three concurrent visits but never double-books a member or mission', () => {
    let visits = assignReserveMission([], 'data-rescue', 0, 0)
    const first = visits[0]
    expect(() => assignReserveMission(visits, 'seismic-clue', 0, 0)).toThrow('already on a mission')
    expect(() => assignReserveMission(visits, 'data-rescue', 1, 0)).toThrow('already has a guest')
    visits = assignReserveMission(visits, 'seismic-clue', 1, 0)
    visits = assignReserveMission(visits, 'decision-brief', 2, 0)
    expect(visits).toHaveLength(3)
    visits = assignReserveMission(visits, 'data-rescue', 0, 100_000)
    expect(visits).toHaveLength(3)
    expect(visits.find((visit) => visit.missionId === 'data-rescue')).not.toBe(first)
    expect(first.startedAt).toBe(0)
  })

  it('interpolates walking, reverses the return route, and respects reduced motion', () => {
    const [visit] = assignReserveMission([], 'data-rescue', 0, 0)
    const halfOut = positionForReserveVisit(visit, visit.travelMs / 2)
    const halfBack = positionForReserveVisit(visit, visit.travelMs * 1.5 + visit.workMs)
    expect(halfOut.x).toBeCloseTo(halfBack.x)
    expect(halfOut.y).toBeCloseTo(halfBack.y)
    expect(positionForReserveVisit(visit, 1, true)).toMatchObject(visit.path[visit.path.length - 1])
    expect(positionForReserveVisit(visit, visit.travelMs + visit.workMs + 1, true)).toMatchObject(visit.path[0])
  })

  it('rejects invalid member identifiers explicitly', () => {
    for (const index of [-1, RESERVE_TEAM.length, 1.5, NaN]) {
      expect(() => assignReserveMission([], 'data-rescue', index, 0)).toThrow('Unknown reserve member')
    }
  })
})
