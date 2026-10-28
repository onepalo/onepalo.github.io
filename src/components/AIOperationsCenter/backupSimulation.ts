import { pathLength, positionAlongPath, roomById, VERTICAL_CORRIDOR_X, WALK_SPEED, WORLD_HEIGHT } from './simulation'
import type { Point } from './simulation'

export const RESERVE_TEAM = [
  { name: 'Ada', role: 'Data detective', collection: 'ORIGINAL', line: 'Will work for clean data.', pitch: 'I find missing values. Still looking for whoever named a column "final_final_2".' },
  { name: 'Bruno', role: 'Workflow mechanic', collection: 'ORIGINAL', line: 'Have CV. Will travel.', pitch: 'If your workflow needs seventeen manual steps, I have a few polite questions.' },
  { name: 'Cleo', role: 'Map whisperer', collection: 'ORIGINAL', line: 'Plot twist: I am available.', pitch: 'I can put the opportunity on the map. The coffee machine is already mapped.' },
  { name: 'Diego', role: 'Quality-check enthusiast', collection: 'ORIGINAL', line: 'References? Ask my tests.', pitch: 'I brought a CV, a checklist, and a spare checklist in case the first one fails QA.' },
  { name: 'Emi', role: 'Reservoir daydreamer', collection: 'ORIGINAL', line: 'Seeking a deeper role.', pitch: 'Comfortable with uncertainty. Less comfortable with meetings that have no agenda.' },
  { name: 'Felix', role: 'Automation optimist', collection: 'ORIGINAL', line: 'Less clicking. More thinking.', pitch: 'Happy to do the repetitive task once. After that, we should probably talk automation.' },
  { name: 'Gia', role: 'Signal spotter', collection: 'ORIGINAL', line: 'Open to work. And snacks.', pitch: 'I separate signal from noise. Except at the snack table, where I keep an open mind.' },
  { name: 'Hugo', role: 'Scenario explorer', collection: 'ORIGINAL', line: 'My next scenario: hired.', pitch: 'Base case: a useful project. Upside case: a useful project with biscuits.' },
  { name: 'Iris', role: 'Insight translator', collection: 'ORIGINAL', line: 'Fluent in charts and humans.', pitch: 'I turn a wall of plots into a conversation. Ideally one that ends with a decision.' },
  { name: 'Jules', role: 'Delivery wrangler', collection: 'ORIGINAL', line: 'Ready when the brief is.', pitch: 'Looking for a clear brief, a good team, and a folder that is not called "misc".' },
  { name: 'Arin', role: 'Aura sparring partner', collection: 'ACTION · COMBAT', line: 'Focus up. Then leap.', pitch: 'I train for the tough round, keep my cool, and never skip the recovery day.' },
  { name: 'Jade', role: 'Tournament tactician', collection: 'ACTION · COMBAT', line: 'Every move has a reason.', pitch: 'I study the field before the bell. Strategy is a strength, not a shortcut.' },
  { name: 'Indigo', role: 'Precision martial artist', collection: 'ACTION · COMBAT', line: 'Calm mind. Clean form.', pitch: 'Discipline beats drama. I save the big entrance for the right moment.' },
  { name: 'Sora', role: 'Sky-step striker', collection: 'ACTION · COMBAT', line: 'Find your footing. Fly.', pitch: 'Fast on my feet, steady under pressure, and always ready for the next challenge.' },
  { name: 'Ren', role: 'Mountain-style grappler', collection: 'ACTION · COMBAT', line: 'Strong roots. Clear aim.', pitch: 'Patience builds power. I bring persistence, not a shortcut to victory.' },
  { name: 'Beacon', role: 'Rescue flight lead', collection: 'SUPERHERO', line: 'A brighter way through.', pitch: 'I make a clear path, bring people together, and leave the spotlight to the team.' },
  { name: 'Aegis', role: 'Shield-field specialist', collection: 'SUPERHERO', line: 'Cover first. Then advance.', pitch: 'Protecting people starts with listening. The dramatic cape is optional.' },
  { name: 'Prism', role: 'Light-bending designer', collection: 'SUPERHERO', line: 'See every side of it.', pitch: 'I turn a complicated picture into a new perspective and a practical next step.' },
  { name: 'Current', role: 'Electrokinetic responder', collection: 'SUPERHERO', line: 'Quick charge. Steady hands.', pitch: 'I bring a spark to the hard problems, without short-circuiting the plan.' },
  { name: 'Umbra', role: 'Night-shift protector', collection: 'SUPERHERO', line: 'Quiet help counts, too.', pitch: 'I keep watch, stay grounded, and make sure no one has to handle the hard part alone.' },
]

export const RESERVE_ACTIVITIES = [
  { id: 'coffee', title: 'Coffee corner', line: 'Brewing my next career move.' },
  { id: 'cv', title: 'CV repair shop', line: 'CV_final_FINAL_really.pdf' },
  { id: 'interview', title: 'Interview rehearsal', line: 'My weakness? Free biscuits.' },
  { id: 'board', title: 'Opportunity board', line: 'Wanted: a worthwhile problem.' },
  { id: 'networking', title: 'Networking loop', line: 'Networking counts as cardio.' },
] as const

export function activityForReserve(index: number, time: number) {
  // Pairs rotate together, so interview rehearsals always have a partner.
  const activity = (Math.floor(index / 2) + Math.floor(time / 12_000)) % RESERVE_ACTIVITIES.length
  return RESERVE_ACTIVITIES[activity]
}

export const RESERVE_MISSIONS = [
  { id: 'data-rescue', title: 'Rescue the mystery dataset', roomId: 'ingestion', skills: 'Data cleanup + QA', brief: 'Find the units, check the gaps, and leave a trail the next person can follow.', result: 'Dataset labelled. "Misc" has been gently retired.', workMs: 8_000 },
  { id: 'seismic-clue', title: 'Investigate a seismic anomaly', roomId: 'geophysics', skills: 'Pattern spotting + geoscience judgment', brief: 'Compare the suspicious reflector with a second interpretation before anyone gets too excited.', result: 'Clues documented. Geoscientists still get the final say.', workMs: 10_000 },
  { id: 'decision-brief', title: 'Turn 14 meetings into one decision', roomId: 'economics', skills: 'Synthesis + scenario thinking', brief: 'Summarize the choices, assumptions, and trade-offs in a short decision brief.', result: 'One brief delivered. Thirteen calendar invites rescued.', workMs: 9_000 },
] as const

export type ReserveMissionId = typeof RESERVE_MISSIONS[number]['id']
export type MissionPhase = 'outbound' | 'working' | 'returning' | 'complete'

export interface ReserveVisit {
  missionId: ReserveMissionId
  memberIndex: number
  startedAt: number
  path: Point[]
  travelMs: number
  workMs: number
}

export const RESERVE_ENTRANCE = { x: VERTICAL_CORRIDOR_X[1], y: WORLD_HEIGHT - 12 }

export const MISSION_PHASE_LABELS: Record<MissionPhase, string> = {
  outbound: 'Heading upstairs',
  working: 'On a guest mission',
  returning: 'Returning to the lounge',
  complete: 'Back with a story',
}

export function missionPhase(visit: ReserveVisit, time: number): MissionPhase {
  const elapsed = time - visit.startedAt
  if (elapsed < visit.travelMs) return 'outbound'
  if (elapsed < visit.travelMs + visit.workMs) return 'working'
  if (elapsed < visit.travelMs * 2 + visit.workMs) return 'returning'
  return 'complete'
}

export function activeVisitForMember(visits: ReserveVisit[], memberIndex: number, time: number) {
  return visits.find((visit) => visit.memberIndex === memberIndex && missionPhase(visit, time) !== 'complete')
}

export function missionUnavailableReason(visits: ReserveVisit[], missionId: ReserveMissionId, memberIndex: number, time: number) {
  if (activeVisitForMember(visits, memberIndex, time)) return `${RESERVE_TEAM[memberIndex].name} is already on a mission.`
  if (visits.some((visit) => visit.missionId === missionId && missionPhase(visit, time) !== 'complete')) return 'This mission already has a guest.'
  return undefined
}

export function assignReserveMission(visits: ReserveVisit[], missionId: ReserveMissionId, memberIndex: number, time: number): ReserveVisit[] {
  if (!Number.isInteger(memberIndex) || !RESERVE_TEAM[memberIndex]) throw new Error(`Unknown reserve member: ${memberIndex}`)
  const mission = RESERVE_MISSIONS.find((item) => item.id === missionId)
  if (!mission) throw new Error(`Unknown reserve mission: ${missionId}`)
  const unavailable = missionUnavailableReason(visits, missionId, memberIndex, time)
  if (unavailable) throw new Error(unavailable)
  const room = roomById.get(mission.roomId)
  if (!room) throw new Error(`Unknown mission workstation: ${mission.roomId}`)
  const entryY = room.door.y + (room.door.y === room.y ? 18 : -18)
  const guest = { x: room.desk.x + 46, y: room.visitor.y }
  const path = [
    RESERVE_ENTRANCE,
    { x: RESERVE_ENTRANCE.x, y: room.corridorY },
    { x: room.door.x, y: room.corridorY },
    room.door,
    { x: room.door.x, y: entryY },
    { x: guest.x, y: entryY },
    guest,
  ].filter((point, index, points) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y)
  const visit = { missionId, memberIndex, startedAt: time, path, travelMs: pathLength(path) / (WALK_SPEED * 1.4) * 1000, workMs: mission.workMs }
  return [...visits.filter((item) => item.missionId !== missionId), visit]
}

export function positionForReserveVisit(visit: ReserveVisit, time: number, reducedMotion = false) {
  const phase = missionPhase(visit, time)
  if (phase === 'outbound') return positionAlongPath(visit.path, reducedMotion ? 1 : (time - visit.startedAt) / visit.travelMs)
  if (phase === 'returning') {
    return positionAlongPath([...visit.path].reverse(), reducedMotion ? 1 : (time - visit.startedAt - visit.travelMs - visit.workMs) / visit.travelMs)
  }
  return { ...visit.path[phase === 'complete' ? 0 : visit.path.length - 1], direction: 'left' as const }
}

export function spareSheetUrl(index: number) {
  return `${import.meta.env.BASE_URL}assets/agent-office/characters/spares/spare_${String(index + 1).padStart(2, '0')}.png`
}
