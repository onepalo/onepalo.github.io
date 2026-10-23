import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Download, FileSearch, RotateCcw, X } from 'lucide-react'

const dataset = [
  { id: 'SYN-001', depthM: 2100, porosity: 0.24 },
  { id: 'SYN-002', depthM: 2110, porosity: 0.22 },
  { id: 'SYN-003', depthM: 2120, porosity: 24 },
  { id: 'SYN-004', depthM: 2130, porosity: 0.20 },
  { id: 'SYN-005', depthM: 2140, porosity: 0.18 },
]

const qualityRule = 'Porosity must be a finite fraction greater than 0 and less than 0.45.'
const acceptedRows = dataset.filter((row) => Number.isFinite(row.porosity) && row.porosity > 0 && row.porosity < 0.45)
const excludedRows = dataset.filter((row) => !acceptedRows.includes(row))
const meanPorosity = acceptedRows.reduce((sum, row) => sum + row.porosity, 0) / acceptedRows.length
const threshold = 0.20
const proposedOutcome = meanPorosity >= threshold ? 'Advance to further reservoir review' : 'Hold for further characterization'
const steps = ['Source', 'Quality review', 'Agent proposal', "Rafael's decision", 'Artifact']

interface ReviewEvent {
  actor: string
  action: string
  recordedAt: string
}

interface WorkflowDemoProps {
  onVisitDesk: (roomId: string) => void
}

export function WorkflowDemo({ onVisitDesk }: WorkflowDemoProps) {
  const [step, setStep] = useState(0)
  const [events, setEvents] = useState<ReviewEvent[]>([])
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [rationale, setRationale] = useState('')
  const reviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step > 0) reviewRef.current?.focus({ preventScroll: true })
  }, [step])

  const record = (actor: string, action: string) => {
    setEvents((current) => [...current, { actor, action, recordedAt: new Date().toISOString() }])
  }

  const advance = (next: number, roomId: string, actor: string, action: string) => {
    record(actor, action)
    setStep(next)
    onVisitDesk(roomId)
  }

  const conclude = (outcome: 'approved' | 'rejected') => {
    if (!rationale.trim()) return
    setDecision(outcome)
    record('Visitor acting as Rafael', `${outcome}: ${rationale.trim()}`)
    setStep(4)
  }

  const artifact = {
    schemaVersion: '1.0',
    caseId: 'SYN-POR-001',
    datasetVersion: 'synthetic-porosity-v1',
    source: 'Five fixed fictional samples authored for this local browser demo; no real well data.',
    execution: 'Deterministic browser calculation; no model, API, or Python script is executed.',
    input: { depthUnit: 'm', porosityUnit: 'fraction', rows: dataset },
    quality: { rule: qualityRule, action: 'Exclude the flagged row without changing the source.', acceptedRows, excludedRows },
    interpretation: {
      author: 'Igor / Petrophysics (simulated agent)',
      method: 'Arithmetic mean of accepted porosity samples; not thickness-weighted or a fitted trend.',
      meanPorosity,
      screeningThreshold: threshold,
      proposedOutcome,
      limitations: 'Four accepted samples, one missing interval. No permeability, saturation, net thickness, or economic evidence. Not a reserves or investment recommendation.',
    },
    review: { actor: 'Visitor acting as Rafael; not an authenticated sign-off', decision, rationale: rationale.trim() },
    outcome: decision === 'approved' ? 'Released for further reservoir review only' : 'Withheld; return for additional evidence',
    provenance: events,
  }

  return (
    <section className="workflow-demo" aria-labelledby="workflow-title">
      <header className="workflow-header">
        <div><p className="panel-kicker">CASE SYN-POR-001 / SYNTHETIC DATA</p><h2 id="workflow-title" tabIndex={-1}>From well logs to a human decision</h2></div>
        <button type="button" className="workflow-icon-button" title="Restart workflow case" aria-label="Restart workflow case" onClick={() => { setStep(0); setEvents([]); setDecision(null); setRationale(''); onVisitDesk('ingestion') }}><RotateCcw size={17} /></button>
      </header>
      <ol className="workflow-steps" aria-label="Case progress">
        {steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={index < step ? 'is-complete' : ''}><span>{index < step ? <Check size={13} /> : index + 1}</span>{label}</li>)}
      </ol>
      <div className="workflow-body">
        <div className="workflow-evidence">
          <h3>Source ledger <span>Joel / Ingestion</span></h3>
          <div className="workflow-table-scroll"><table><caption>synthetic-porosity-v1 / Depth: m / Porosity: fraction</caption><thead><tr><th scope="col">Sample</th><th scope="col">Depth</th><th scope="col">Porosity</th><th scope="col">QC</th></tr></thead><tbody>
            {dataset.map((row) => <tr key={row.id} className={excludedRows.includes(row) ? 'workflow-flagged' : ''}><th scope="row">{row.id}</th><td>{row.depthM}</td><td>{row.porosity}</td><td>{excludedRows.includes(row) ? (step >= 2 ? 'Excluded' : 'Flagged') : 'Pass'}</td></tr>)}
          </tbody></table></div>
          <p className="workflow-disclaimer">Fictional samples. Local, deterministic demonstration, not a live AI model or an execution of the downloadable Python tools.</p>
        </div>
        <div className="workflow-review" key={step} ref={reviewRef} tabIndex={-1} role="group" aria-label={steps[step]}>
          {step === 0 && <>
            <p className="panel-kicker">01 / JOEL / INGESTION</p><h3>Five samples. One decision trail.</h3><p>Case SYN-POR-001 follows a small porosity screening task. The original measurements remain visible throughout the review.</p>
            <button type="button" onClick={() => advance(1, 'logs', 'Joel / Ingestion', 'Registered synthetic-porosity-v1: five samples; original values preserved.')}><FileSearch size={16} /> Inspect quality issue</button>
          </>}
          {step === 1 && <>
            <p className="panel-kicker">02 / PALO / WELL LOGS</p><h3>A fraction, or a percentage?</h3><p><strong>SYN-003 reports porosity 24.</strong> {qualityRule} A value of 24 might mean 24%, but the source does not establish that. Palo will not silently convert it.</p><p>Proposed QC action: quarantine SYN-003 and retain four samples. The missing interval stays an explicit limitation.</p>
            <button type="button" onClick={() => advance(2, 'petrophysics', 'Visitor / quality reviewer', "Accepted Palo's QC proposal: exclude SYN-003 (24 is outside the fraction range); no unit correction inferred.")}><Check size={16} /> Accept exclusion</button>
            <button type="button" className="workflow-secondary" onClick={() => { setStep(0); record('Visitor / quality reviewer', 'QC proposal declined; returned to the unchanged source.'); onVisitDesk('ingestion') }}><X size={16} /> Return to source</button>
          </>}
          {step === 2 && <>
            <p className="panel-kicker">03 / IGOR / PETROPHYSICS</p><h3>Proposal, not permission.</h3>
            <dl className="workflow-calculation"><div><dt>Accepted samples</dt><dd>{acceptedRows.length} / {dataset.length}</dd></div><div><dt>Mean porosity</dt><dd>{(meanPorosity * 100).toFixed(1)}%</dd></div><div><dt>Demo screening threshold</dt><dd>{(threshold * 100).toFixed(0)}%</dd></div></dl>
            <p><strong>{proposedOutcome}.</strong> Arithmetic mean: (0.24 + 0.22 + 0.20 + 0.18) / 4 = 0.21. This is not a thickness-weighted estimate or a fitted porosity trend.</p><p>Four accepted samples and a missing interval do not establish reservoir quality. Permeability, saturation, net thickness, and economics remain unassessed.</p>
            <button type="button" onClick={() => advance(3, 'director', 'Igor / Petrophysics (simulated)', 'Proposed further reservoir review: accepted-sample arithmetic mean 0.21 meets demo threshold 0.20; limitations retained.')}><ArrowRight size={16} /> Send to Rafael's desk</button>
          </>}
          {step === 3 && <>
            <p className="panel-kicker">04 / RAFAEL / HUMAN REVIEW</p><h3>The decision stays here.</h3><p>Approve a limited handoff to Luke for further reservoir review, or reject the proposal and request more evidence. Neither choice authorizes development.</p>
            <label htmlFor="workflow-rationale">Decision rationale (required)</label><textarea id="workflow-rationale" rows={3} value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Record the evidence and limitations behind your decision" maxLength={2000} />
            <div className="workflow-actions"><button type="button" disabled={!rationale.trim()} onClick={() => conclude('approved')}><Check size={16} /> Approve handoff</button><button type="button" className="workflow-secondary" disabled={!rationale.trim()} onClick={() => conclude('rejected')}><X size={16} /> Reject proposal</button></div>
          </>}
          {step === 4 && <>
            <p className="panel-kicker">05 / DECISION RECORD</p><h3>{decision === 'approved' ? 'Released for further review' : 'Proposal withheld'}</h3><p>{decision === 'approved' ? 'Luke receives a limited screening brief with the excluded interval and uncertainty intact.' : 'The proposal returns for additional evidence. It is not released to Luke.'}</p><blockquote>{rationale.trim()}</blockquote>
            <a className="workflow-download" href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(artifact, null, 2))}`} download={`SYN-POR-001-${decision}.json`}><Download size={16} /> Download decision record</a>
            <details><summary>Inspect artifact and provenance</summary><pre>{JSON.stringify(artifact, null, 2)}</pre></details>
          </>}
        </div>
      </div>
      <p className="workflow-status" role="status">{steps[step]}{step === 4 ? `: ${decision}. Visitor review only; no authenticated sign-off.` : ` / Step ${step + 1} of ${steps.length}`}</p>
    </section>
  )
}