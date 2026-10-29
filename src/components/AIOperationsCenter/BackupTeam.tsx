import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, ArrowUpRight, Check, Coffee, FilePenLine, MessageCircle, Pause, Play, Search, X } from 'lucide-react'
import { useDialogController } from '../../utils/useDialogController'
import {
  activeVisitForMember,
  activityForReserve,
  MISSION_PHASE_LABELS,
  missionPhase,
  missionUnavailableReason,
  RESERVE_ACTIVITIES,
  RESERVE_MISSIONS,
  RESERVE_TEAM,
  spareSheetUrl,
} from './backupSimulation'
import type { ReserveMissionId, ReserveVisit } from './backupSimulation'
import './backup-team.css'

const STATION_ICONS = { coffee: Coffee, cv: FilePenLine, interview: MessageCircle, board: Search } as const
const STATIONS = RESERVE_ACTIVITIES.filter((activity) => activity.id !== 'networking')

type SpriteVariant = 'stand' | 'walk' | 'face' | 'portrait'

interface BackupTeamProps {
  isRunning: boolean
  onToggleRunning: () => void
  time: number
  visits: ReserveVisit[]
  onAssignMission: (missionId: ReserveMissionId, memberIndex: number) => void
  onViewOffice: () => void
  assignmentBlockedReason?: string
}

function visitProgress(visit: ReserveVisit, time: number) {
  return Math.max(0, Math.min(100, Math.round((time - visit.startedAt) / (visit.travelMs * 2 + visit.workMs) * 100)))
}

function missionById(id: ReserveMissionId) {
  return RESERVE_MISSIONS.find((mission) => mission.id === id)!
}

export function BackupTeam({ isRunning, onToggleRunning, time, visits, onAssignMission, onViewOffice, assignmentBlockedReason }: BackupTeamProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isBoardOpen, setIsBoardOpen] = useState(false)
  const [assetsFailed, setAssetsFailed] = useState(false)
  const [guestChoices, setGuestChoices] = useState<Partial<Record<ReserveMissionId, number>>>({})
  const wasOpenRef = useRef(false)
  const viewOfficeAfterCloseRef = useRef(false)
  const pendingFocusIdRef = useRef<string | undefined>(undefined)
  const closeBoard = () => setIsBoardOpen(false)
  const closeButtonRef = useDialogController<HTMLButtonElement>(isBoardOpen, closeBoard)
  const viewOffice = useEffectEvent(onViewOffice)

  useEffect(() => {
    if (isBoardOpen) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    wasOpenRef.current = false
    // Runs after the dialog has restored focus to its opener, so the scroll is not undone.
    if (viewOfficeAfterCloseRef.current) {
      viewOfficeAfterCloseRef.current = false
      viewOffice()
    }
  }, [isBoardOpen])

  useEffect(() => {
    const id = pendingFocusIdRef.current
    if (!id) return
    pendingFocusIdRef.current = undefined
    document.getElementById(id)?.focus()
  }, [visits])

  const busyVisit = (index: number) => activeVisitForMember(visits, index, time)
  const available = RESERVE_TEAM.map((member, index) => ({ ...member, index })).filter((member) => !busyVisit(member.index))
  const upstairs = visits.filter((visit) => missionPhase(visit, time) !== 'complete')
  const networking = available.filter((member) => activityForReserve(member.index, time).id === 'networking')
  const selected = RESERVE_TEAM[selectedIndex]
  const selectedVisit = busyVisit(selectedIndex)
  const selectedLastDone = selectedVisit ? undefined : [...visits].reverse().find((visit) => visit.memberIndex === selectedIndex && missionPhase(visit, time) === 'complete')
  const selectedStatus = selectedVisit ? MISSION_PHASE_LABELS[missionPhase(selectedVisit, time)] : selectedLastDone ? 'Mission complete · CV updated' : `Currently: ${activityForReserve(selectedIndex, time).title}`
  const blockedReason = assignmentBlockedReason
    ?? (!isRunning ? 'Resume the simulation to send a guest upstairs.' : assetsFailed ? 'Restore the missing spare sprites before sending a guest.' : undefined)

  const guestChoiceFor = (missionId: ReserveMissionId, position: number) => {
    const stored = guestChoices[missionId]
    if (stored !== undefined && available.some((member) => member.index === stored)) return stored
    if (available.some((member) => member.index === selectedIndex)) return selectedIndex
    // Different default guests per mission, so dispatching all three takes three clicks.
    return (available[position] ?? available[0])?.index
  }

  const watchUpstairs = () => {
    viewOfficeAfterCloseRef.current = true
    closeBoard()
  }

  const sprite = (index: number, variant: SpriteVariant) => (
    <span className={`backup-sprite backup-sprite-${variant}`} aria-hidden="true">
      <img
        src={spareSheetUrl(index)}
        alt=""
        onError={(event) => {
          console.error('Backup Team could not load its local spare sprite sheet.', event.currentTarget.src)
          setAssetsFailed(true)
        }}
      />
    </span>
  )

  const memberButton = (index: number, variant: 'stand' | 'walk', thought?: string) => {
    const member = RESERVE_TEAM[index]
    return (
      <button key={member.name} type="button" className="backup-reserve" aria-pressed={selectedIndex === index} aria-label={`Meet ${member.name}, ${member.role}`} onClick={() => setSelectedIndex(index)}>
        {thought && <span className="backup-thought" aria-hidden="true">{thought}</span>}
        {sprite(index, variant)}
        <span className="backup-name">{member.name}</span>
        <span className="backup-collection">{member.collection}</span>
      </button>
    )
  }

  const progressBar = (value: number) => <span className="backup-progress" aria-hidden="true"><span style={{ width: `${value}%` }} /></span>

  return (
    <>
      <section className={`operations-map-panel backup-team${isRunning ? '' : ' is-paused'}`} aria-labelledby="backup-team-title">
        <div className="panel-topbar">
          <div>
            <span className="panel-kicker">BACKUP TEAM</span>
            <h2 id="backup-team-title">NEXT MISSION / DEPARTURE LOUNGE</h2>
          </div>
          <div className="backup-topbar-actions">
            <span className="backup-ready">{available.length} READY · {upstairs.length} UPSTAIRS</span>
            <button type="button" className="backup-icon-button" onClick={onToggleRunning} aria-label={isRunning ? 'Pause lounge and simulation' : 'Resume lounge and simulation'} title={isRunning ? 'Pause' : 'Resume'}>
              {isRunning ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="backup-intro">
          <p className="backup-headline">Great team. Currently between quests.</p>
          <p>Select anyone to meet them, then check the departures board to send a guest upstairs.</p>
        </div>

        {assetsFailed && <p className="backup-error" role="alert">Some reserve characters could not load. Check the local spare sprite assets.</p>}

        <div className="backup-mobile-bar">
          {sprite(selectedIndex, 'face')}
          <span><strong>{selected.name}</strong> · {selectedVisit ? MISSION_PHASE_LABELS[missionPhase(selectedVisit, time)] : 'Open to work'}</span>
          {selectedVisit
            ? <button type="button" className="backup-secondary" onClick={onViewOffice}>Watch {selected.name} upstairs</button>
            : <button type="button" className="backup-primary" aria-haspopup="dialog" onClick={() => setIsBoardOpen(true)}>Send {selected.name} on a mission</button>}
        </div>

        <div className="backup-concourse">
          <div className="backup-stations">
            {STATIONS.map((activity) => {
              const Icon = STATION_ICONS[activity.id as keyof typeof STATION_ICONS]
              const members = available.filter((member) => activityForReserve(member.index, time).id === activity.id)
              return (
                <div className={`backup-station backup-station-${activity.id}`} key={activity.id}>
                  <div className="backup-station-title"><Icon size={14} aria-hidden="true" /><strong>{activity.title}</strong></div>
                  <p>{activity.line}</p>
                  <div className="backup-station-guests">
                    {members.map((member) => memberButton(member.index, 'stand'))}
                    {members.length === 0 && <span className="backup-empty">Back shortly. Probably networking.</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="backup-lane-label"><span>NETWORKING LOOP · LAP {Math.floor(time / 32_000) + 1}</span><span>STILL NOT A MEETING</span></div>
          <div className="backup-lane">
            {networking.map((member, position) => (
              <div className="backup-marcher" key={member.name} style={{ '--march-delay': `${-position * (32 / networking.length)}s`, '--step-delay': `${-member.index * 0.07}s`, '--rest-fraction': position / Math.max(1, networking.length - 1) } as CSSProperties}>
                {memberButton(member.index, 'walk', member.line)}
              </div>
            ))}
            {networking.length === 0 && <p className="backup-empty">Everyone found something better than another lap.</p>}
          </div>
        </div>

        <div className="map-footer backup-footer">
          <span><i className="status-pulse" /> {isRunning ? 'LOUNGE OPEN' : 'LOUNGE PAUSED'}</span>
          <span className="backup-coffee"><Coffee size={12} aria-hidden="true" /> COFFEE BREAKS ARE A TRANSFERABLE SKILL</span>
        </div>

        {isBoardOpen && createPortal(
          <div className="backup-dialog-backdrop" role="presentation" onMouseDown={closeBoard}>
            <section className="backup-dialog" role="dialog" aria-modal="true" aria-labelledby="backup-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <p className="backup-dialog-kicker">Next departures</p>
                  <h2 id="backup-dialog-title">Mission board</h2>
                  <p className="backup-dialog-sub">Short briefs, one guest each. Guests visit the main floor and come back with a story; the core team's work and metrics stay unchanged.</p>
                </div>
                <button ref={closeButtonRef} type="button" className="backup-dialog-close" onClick={closeBoard} aria-label="Close mission board"><X size={18} aria-hidden="true" /></button>
              </header>
              <div className="backup-dialog-body">
                <ol className="backup-board">
                  {RESERVE_MISSIONS.map((mission, position) => {
                    const visit = visits.find((item) => item.missionId === mission.id)
                    const phase = visit && missionPhase(visit, time)
                    const choice = guestChoiceFor(mission.id, position)
                    const reason = choice === undefined ? 'Everyone is already upstairs.' : blockedReason ?? missionUnavailableReason(visits, mission.id, choice, time)
                    return (
                      <li className="backup-board-item" key={mission.id}>
                        <div className="backup-board-copy">
                          <span className="backup-board-skills">{mission.skills}</span>
                          <h3 id={`backup-board-${mission.id}`}>{mission.title}</h3>
                          <p>{mission.brief}</p>
                        </div>
                        <div className="backup-board-action">
                          {visit && phase && phase !== 'complete' ? (
                            <>
                              <p className="backup-board-status" id={`backup-status-${mission.id}`} tabIndex={-1}>
                                {sprite(visit.memberIndex, 'face')}
                                <span><strong>{RESERVE_TEAM[visit.memberIndex].name}</strong> · {MISSION_PHASE_LABELS[phase]} · {visitProgress(visit, time)}%</span>
                              </p>
                              {progressBar(visitProgress(visit, time))}
                          </>
                        ) : (
                          <>
                            {visit && <p className="backup-last"><Check size={14} aria-hidden="true" /> {RESERVE_TEAM[visit.memberIndex].name}: {mission.result}</p>}
                            <label className="backup-select">
                              <span>Guest</span>
                              <select value={choice ?? ''} disabled={choice === undefined} onChange={(event) => setGuestChoices((current) => ({ ...current, [mission.id]: Number(event.target.value) }))}>
                                {available.map((member) => <option key={member.name} value={member.index}>{member.name} · {member.role}</option>)}
                              </select>
                            </label>
                            <button type="button" className="backup-primary" disabled={Boolean(reason)} aria-describedby={reason ? `backup-board-reason-${mission.id}` : `backup-board-${mission.id}`} onClick={() => {
                              if (choice === undefined) return
                              pendingFocusIdRef.current = `backup-status-${mission.id}`
                              onAssignMission(mission.id, choice)
                            }}>
                              {visit ? 'Send again' : 'Send upstairs'} <ArrowUpRight size={14} aria-hidden="true" />
                            </button>
                            {reason && <small className="backup-reason" id={`backup-board-reason-${mission.id}`}>{reason}</small>}
                          </>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
            <footer>
              <span>Demo visits only. No real analysis or hiring takes place.</span>
              {upstairs.length > 0 && <button type="button" className="backup-link" onClick={watchUpstairs}>Watch upstairs <ArrowUpRight size={14} aria-hidden="true" /></button>}
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </section>

    <aside className="operations-sidebar backup-sidebar" aria-label="Backup team details">
      <section className="agent-detail-card">
        <div className="sidebar-heading"><span className="panel-kicker">SELECTED RESERVE</span><span className="agent-id">{selectedVisit ? 'ON A MISSION' : 'OPEN TO WORK'}</span></div>
        <div className="selected-agent">
          {sprite(selectedIndex, 'portrait')}
          <div aria-live="polite" aria-atomic="true"><h2>{selected.name}</h2><p>{selected.role}</p><small className="backup-selected-collection">{selected.collection}</small></div>
        </div>
        <div className={`agent-status backup-status${selectedVisit ? ' is-away' : selectedLastDone ? ' is-done' : ''}`}><span className="status-pulse" />{selectedStatus.toUpperCase()}</div>
        <p className="task-label">{selectedVisit ? 'GUEST MISSION' : selectedLastDone ? 'LAST MISSION' : 'ELEVATOR PITCH'}</p>
        <p className="backup-card-quote">{selectedVisit ? missionById(selectedVisit.missionId).title : selectedLastDone ? missionById(selectedLastDone.missionId).result : `“${selected.pitch}”`}</p>
        {selectedVisit && (
          <>
            <div className="progress-heading"><span>ROUND TRIP</span><strong>{visitProgress(selectedVisit, time)}%</strong></div>
            {progressBar(visitProgress(selectedVisit, time))}
          </>
        )}
        {selectedVisit
          ? <button type="button" className="backup-secondary backup-card-action" onClick={onViewOffice}>Watch upstairs <ArrowUpRight size={14} aria-hidden="true" /></button>
          : <button type="button" className="backup-primary backup-card-action" aria-haspopup="dialog" onClick={() => setIsBoardOpen(true)}>Choose a mission for {selected.name} <ArrowRight size={14} aria-hidden="true" /></button>}
      </section>

      <section className="agent-detail-card">
        <div className="sidebar-heading"><span className="panel-kicker">NEXT DEPARTURES</span><span className="task-count">{upstairs.length}/{RESERVE_MISSIONS.length} IN PROGRESS</span></div>
        <button type="button" className="backup-departures" aria-haspopup="dialog" aria-label={`Open mission board: ${RESERVE_MISSIONS.length} briefs, ${upstairs.length} in progress`} onClick={() => setIsBoardOpen(true)}>
          <span className="backup-departures-kicker">NOW BOARDING</span>
          <strong>Mission board <ArrowRight size={15} aria-hidden="true" /></strong>
          <small>{RESERVE_MISSIONS.length} short briefs · one guest each</small>
        </button>
        <p className="task-label">UPSTAIRS NOW</p>
        <div className="backup-upstairs" aria-live="polite">
          {upstairs.length === 0 && <p className="backup-upstairs-empty">Nobody upstairs yet. The coffee corner is winning.</p>}
          {upstairs.length > 0 && (
            <ul>
              {upstairs.map((visit) => (
                <li key={visit.missionId}>
                  <button type="button" className="backup-guest-chip" aria-pressed={selectedIndex === visit.memberIndex} aria-label={`${RESERVE_TEAM[visit.memberIndex].name}, ${MISSION_PHASE_LABELS[missionPhase(visit, time)]}`} onClick={() => setSelectedIndex(visit.memberIndex)}>
                    {sprite(visit.memberIndex, 'face')}
                    <strong>{RESERVE_TEAM[visit.memberIndex].name}</strong>
                    <span>{MISSION_PHASE_LABELS[missionPhase(visit, time)]}</span>
                    <i aria-hidden="true" style={{ width: `${visitProgress(visit, time)}%` }} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {upstairs.length > 0 && !selectedVisit && <button type="button" className="backup-link" onClick={onViewOffice}>Watch upstairs <ArrowUpRight size={14} aria-hidden="true" /></button>}
        </div>
      </section>
      <p className="simulation-note">Fictional reserve crew · Not live hiring data · Main team metrics unaffected.</p>
    </aside>
    </>
  )
}
