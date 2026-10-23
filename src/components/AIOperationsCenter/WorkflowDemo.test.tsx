import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WorkflowDemo } from './WorkflowDemo'

afterEach(cleanup)

async function reachDecision() {
  const user = userEvent.setup()
  const onVisitDesk = vi.fn()
  render(<WorkflowDemo onVisitDesk={onVisitDesk} />)
  await user.click(screen.getByRole('button', { name: 'Inspect quality issue' }))
  expect(screen.getByText(/will not silently convert/)).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Accept exclusion' }))
  expect(screen.getByText('21.0%')).toBeTruthy()
  expect(screen.getByText('Excluded')).toBeTruthy()
  await user.click(screen.getByRole('button', { name: "Send to Rafael's desk" }))
  return { user, onVisitDesk }
}

describe('inspectable workflow case', () => {
  it.each(['approved', 'rejected'] as const)('requires human rationale and preserves provenance for an %s decision', async (decision) => {
    const { user, onVisitDesk } = await reachDecision()
    const approve = screen.getByRole<HTMLButtonElement>('button', { name: 'Approve handoff' })
    const reject = screen.getByRole<HTMLButtonElement>('button', { name: 'Reject proposal' })
    expect(approve.disabled).toBe(true)
    expect(reject.disabled).toBe(true)
    await user.type(screen.getByRole('textbox', { name: 'Decision rationale (required)' }), '  ')
    expect(approve.disabled).toBe(true)
    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'Retain the missing interval as an uncertainty.')
    await user.click(decision === 'approved' ? approve : reject)
    const link = screen.getByRole<HTMLAnchorElement>('link', { name: 'Download decision record' })
    const artifact = JSON.parse(decodeURIComponent(link.href.split(',').slice(1).join(',')))
    expect(artifact.review.decision).toBe(decision)
    expect(artifact.review.rationale).toBe('Retain the missing interval as an uncertainty.')
    expect(artifact.input.rows).toHaveLength(5)
    expect(artifact.input.rows[2].porosity).toBe(24)
    expect(artifact.quality.acceptedRows).toHaveLength(4)
    expect(artifact.quality.excludedRows[0].id).toBe('SYN-003')
    expect(artifact.interpretation.meanPorosity).toBeCloseTo(0.21)
    expect(artifact.provenance).toHaveLength(4)
    expect(artifact.provenance[3].actor).toBe('Visitor acting as Rafael')
    expect(onVisitDesk.mock.calls.map(([room]) => room)).toEqual(['logs', 'petrophysics', 'director'])
    expect(link.download).toBe(`SYN-POR-001-${decision}.json`)
  })

  it('can decline the QC proposal without changing the source or advancing to interpretation', async () => {
    const user = userEvent.setup()
    render(<WorkflowDemo onVisitDesk={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Inspect quality issue' }))
    await user.click(screen.getByRole('button', { name: 'Return to source' }))
    expect(screen.getByRole('button', { name: 'Inspect quality issue' })).toBeTruthy()
    expect(screen.queryByText('Excluded')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Download decision record' })).toBeNull()
  })

  it('restarts without retaining a decision or rationale', async () => {
    const { user, onVisitDesk } = await reachDecision()
    await user.type(screen.getByRole('textbox'), 'Need more evidence.')
    await user.click(screen.getByRole('button', { name: 'Reject proposal' }))
    await user.click(screen.getByRole('button', { name: 'Restart workflow case' }))
    expect(screen.queryByRole('link', { name: 'Download decision record' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Inspect quality issue' })).toBeTruthy()
    expect(onVisitDesk).toHaveBeenLastCalledWith('ingestion')
    expect(screen.queryByText('Need more evidence.')).toBeNull()
  })
})