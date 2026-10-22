import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { missionPhase, positionForReserveVisit, RESERVE_ENTRANCE, RESERVE_TEAM, spareSheetUrl } from './backupSimulation'
import type { ReserveVisit } from './backupSimulation'
import { WORLD_HEIGHT, WORLD_WIDTH } from './simulation'

interface OfficeVisitorsProps {
  visits: ReserveVisit[]
  clock: RefObject<number>
  isRunning: boolean
}

export function OfficeVisitors({ visits, clock, isRunning }: OfficeVisitorsProps) {
  const [time, setTime] = useState(clock.current)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [assetsFailed, setAssetsFailed] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReducedMotion(preference.matches)
    preference.addEventListener('change', change)
    return () => preference.removeEventListener('change', change)
  }, [])

  useEffect(() => {
    if (!isRunning || visits.length === 0) return
    let frame: number
    const update = () => {
      setTime(clock.current)
      if (visits.some((visit) => missionPhase(visit, clock.current) !== 'complete')) {
        frame = window.requestAnimationFrame(update)
      }
    }
    frame = window.requestAnimationFrame(update)
    return () => window.cancelAnimationFrame(frame)
  }, [visits, clock, isRunning])

  const active = visits.filter((visit) => missionPhase(visit, time) !== 'complete')
  if (active.length === 0) return null

  return (
    <div className="office-visitors">
      {assetsFailed && <p className="office-visitor-error" role="alert">A reserve visitor sprite could not load.</p>}
      <svg viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} role="img" aria-label={`Temporary reserve visitors: ${active.map((visit) => RESERVE_TEAM[visit.memberIndex].name).join(', ')}`}>
        <g className="office-guest-entrance" transform={`translate(${RESERVE_ENTRANCE.x} ${RESERVE_ENTRANCE.y})`}>
          <rect x="-56" y="-8" width="112" height="18" rx="3" fill="#705479" />
          <text y="5" textAnchor="middle" fill="#fffdf8" fontSize="9" fontFamily="monospace">GUEST ENTRANCE</text>
        </g>
        {active.map((visit) => {
          const phase = missionPhase(visit, time)
          const position = positionForReserveVisit(visit, time, reducedMotion)
          const moving = phase !== 'working'
          const column = reducedMotion ? 1 : moving ? [0, 1, 2, 1][Math.floor(time / 150) % 4] : 3 + Math.floor(time / 360) % 2
          const row = position.direction === 'up' ? 1 : position.direction === 'down' ? 0 : 2
          return (
            <g key={visit.missionId} className="office-visitor" data-member={RESERVE_TEAM[visit.memberIndex].name} data-phase={phase} transform={`translate(${position.x} ${position.y})`}>
              <ellipse cy="-2" rx="17" ry="5" fill="#705479" opacity=".25" />
              <g transform={position.direction === 'left' ? 'scale(-1 1)' : undefined}>
                <svg x="-16" y="-64" width="32" height="64" viewBox="0 0 32 64" overflow="hidden">
                  <image href={spareSheetUrl(visit.memberIndex)} x={-column * 32} y={-row * 64} width="224" height="192" imageRendering="pixelated" onError={() => {
                    console.error('Reserve visitor could not load its local sprite sheet.', spareSheetUrl(visit.memberIndex))
                    setAssetsFailed(true)
                  }} />
                </svg>
              </g>
              <rect x="-38" y="-82" width="76" height="16" rx="3" fill="#705479" />
              <text y="-71" textAnchor="middle" fill="#fffdf8" fontSize="9" fontFamily="monospace">{RESERVE_TEAM[visit.memberIndex].name} · GUEST</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
