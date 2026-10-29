import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BackupTeam } from './BackupTeam'
import { assignReserveMission } from './backupSimulation'

const defaults = () => ({ isRunning: true, onToggleRunning: vi.fn(), time: 0, visits: [], onAssignMission: vi.fn(), onViewOffice: vi.fn() })
const openBoard = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Open mission board/ }))
  return screen.getByRole('dialog', { name: 'Mission board' })
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('backup team lounge', () => {
  it('shows all twenty characters across activities, each selectable inline without a popup', async () => {
    const user = userEvent.setup()
    const { container } = render(<BackupTeam {...defaults()} />)
    expect(screen.getByRole('region', { name: 'NEXT MISSION / DEPARTURE LOUNGE' })).toBeTruthy()
    const characters = screen.getAllByRole('button', { name: /^Meet / })
    expect(characters).toHaveLength(20)
    expect(container.querySelectorAll('.backup-reserve img')).toHaveLength(20)
    expect(container.querySelectorAll('.backup-collection')).toHaveLength(20)
    expect(screen.getAllByText('ACTION · COMBAT')).toHaveLength(5)
    expect(screen.getAllByText('SUPERHERO')).toHaveLength(5)
    for (const button of characters) {
      await user.click(button)
      expect(button.getAttribute('aria-pressed')).toBe('true')
      expect(screen.getAllByRole('button', { name: /^Meet / }).filter((item) => item.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
      const name = button.getAttribute('aria-label')!.replace('Meet ', '').split(',')[0]
      expect(screen.getByRole('heading', { level: 2, name })).toBeTruthy()
      expect(screen.queryByRole('dialog')).toBeNull()
    }
    expect(screen.getByText(/Quiet help counts, too/)).toBeTruthy()
  })

  it('keeps mission text out of the page until the board is requested', async () => {
    const user = userEvent.setup()
    render(<BackupTeam {...defaults()} />)
    expect(screen.queryByText('Rescue the mystery dataset')).toBeNull()
    const board = await openBoard(user)
    expect(within(board).getAllByRole('listitem')).toHaveLength(3)
    expect(document.activeElement).toBe(within(board).getByRole('button', { name: 'Close mission board' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Open mission board/ }))
  })

  it('preselects the chosen character and assigns them from the board', async () => {
    const user = userEvent.setup()
    const onAssignMission = vi.fn()
    render(<BackupTeam {...defaults()} onAssignMission={onAssignMission} />)
    await user.click(screen.getByRole('button', { name: 'Meet Cleo, Map whisperer' }))
    await user.click(screen.getByRole('button', { name: 'Choose a mission for Cleo' }))
    const board = screen.getByRole('dialog', { name: 'Mission board' })
    const selects = within(board).getAllByRole<HTMLSelectElement>('combobox')
    expect(selects.map((select) => select.selectedOptions[0].textContent)).toEqual(Array(3).fill('Cleo · Map whisperer'))
    await user.selectOptions(selects[1], 'Bruno · Workflow mechanic')
    await user.click(within(board).getAllByRole('button', { name: 'Send upstairs' })[1])
    expect(onAssignMission).toHaveBeenCalledWith('seismic-clue', 1)
  })

  it('shows travelling guests, hides them from the lounge, and offers distinct defaults for remaining briefs', async () => {
    const user = userEvent.setup()
    const visits = assignReserveMission([], 'data-rescue', 2, 0)
    const { container } = render(<BackupTeam {...defaults()} visits={visits} />)
    expect(container.querySelectorAll('.backup-reserve')).toHaveLength(19)
    expect(screen.getByText('19 READY · 1 UPSTAIRS')).toBeTruthy()
    const chip = screen.getByRole('button', { name: 'Cleo, Heading upstairs' })
    await user.click(chip)
    expect(screen.getByText('GUEST MISSION')).toBeTruthy()
    expect(screen.getByText('Rescue the mystery dataset')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Watch upstairs/ })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Watch Cleo upstairs' })).toBeTruthy()
    const board = await openBoard(user)
    expect(within(board).getByText(/Cleo/).closest('p')?.textContent).toContain('Heading upstairs')
    const selects = within(board).getAllByRole<HTMLSelectElement>('combobox')
    expect(selects.map((select) => select.value)).toEqual(['1', '3'])
    expect(within(selects[0]).queryByText(/Cleo/)).toBeNull()
  })

  it('reports completed missions and allows the brief to run again', async () => {
    const user = userEvent.setup()
    const visits = assignReserveMission([], 'decision-brief', 0, 0)
    const { container } = render(<BackupTeam {...defaults()} visits={visits} time={100_000} />)
    expect(container.querySelectorAll('.backup-reserve')).toHaveLength(20)
    expect(screen.getByText('MISSION COMPLETE · CV UPDATED')).toBeTruthy()
    expect(screen.getByText(/Thirteen calendar invites rescued/)).toBeTruthy()
    const board = await openBoard(user)
    expect(within(board).getByText(/Thirteen calendar invites rescued/)).toBeTruthy()
    expect(within(board).getByRole<HTMLButtonElement>('button', { name: 'Send again' }).disabled).toBe(false)
  })

  it('explains why sending is blocked when paused or when the office scene is unavailable', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<BackupTeam {...defaults()} isRunning={false} />)
    let board = await openBoard(user)
    expect(within(board).getAllByRole<HTMLButtonElement>('button', { name: 'Send upstairs' }).every((button) => button.disabled)).toBe(true)
    expect(within(board).getAllByText('Resume the simulation to send a guest upstairs.')).toHaveLength(3)
    rerender(<BackupTeam {...defaults()} assignmentBlockedReason="The office scene must load before a guest can visit." />)
    board = screen.getByRole('dialog', { name: 'Mission board' })
    expect(within(board).getAllByText('The office scene must load before a guest can visit.')).toHaveLength(3)
  })

  it('watches upstairs only after the board closes, so focus restoration does not undo the scroll', async () => {
    const user = userEvent.setup()
    const onViewOffice = vi.fn(() => expect(screen.queryByRole('dialog')).toBeNull())
    const visits = assignReserveMission([], 'data-rescue', 2, 0)
    render(<BackupTeam {...defaults()} visits={visits} onViewOffice={onViewOffice} />)
    const board = await openBoard(user)
    await user.click(within(board).getByRole('button', { name: /Watch upstairs/ }))
    expect(onViewOffice).toHaveBeenCalledOnce()
  })

  it('uses the shared pause control and reflects the simulation state', async () => {
    const user = userEvent.setup()
    const onToggleRunning = vi.fn()
    const { container, rerender } = render(<BackupTeam {...defaults()} onToggleRunning={onToggleRunning} />)
    await user.click(screen.getByRole('button', { name: 'Pause lounge and simulation' }))
    expect(onToggleRunning).toHaveBeenCalledOnce()
    rerender(<BackupTeam {...defaults()} isRunning={false} onToggleRunning={onToggleRunning} />)
    expect(container.querySelector('.backup-team.is-paused')).toBeTruthy()
    expect(screen.getByText('LOUNGE PAUSED')).toBeTruthy()
  })

  it('offers a compact phone action that opens the same board for the selected character', async () => {
    const user = userEvent.setup()
    render(<BackupTeam {...defaults()} />)
    await user.click(screen.getByRole('button', { name: 'Meet Gia, Signal spotter' }))
    await user.click(screen.getByRole('button', { name: 'Send Gia on a mission' }))
    const board = screen.getByRole('dialog', { name: 'Mission board' })
    expect(within(board).getAllByRole<HTMLSelectElement>('combobox').every((select) => select.selectedOptions[0].textContent === 'Gia · Signal spotter')).toBe(true)
  })

  it('rotates pairs between activities', () => {
    const { container, rerender } = render(<BackupTeam {...defaults()} />)
    expect(container.querySelector('.backup-station-coffee')?.textContent).toContain('Ada')
    rerender(<BackupTeam {...defaults()} time={12_000} />)
    expect(container.querySelector('.backup-station-cv')?.textContent).toContain('Ada')
  })

  it('distributes resting marchers across the space remaining after their own width', () => {
    const { container, rerender } = render(<BackupTeam {...defaults()} />)
    const fractions = () => [...container.querySelectorAll<HTMLElement>('.backup-marcher')]
      .map((marcher) => Number(marcher.style.getPropertyValue('--rest-fraction')))
    expect(fractions()).toEqual([0, 1 / 3, 2 / 3, 1])
    const visits = assignReserveMission([], 'data-rescue', 8, 0)
    rerender(<BackupTeam {...defaults()} visits={visits} />)
    expect(fractions()).toEqual([0, 0.5, 1])
  })

  it('reports missing sprite assets and blocks sending', async () => {
    const user = userEvent.setup()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<BackupTeam {...defaults()} />)
    const image = container.querySelector('img')!
    fireEvent.error(image)
    expect(screen.getByRole('alert').textContent).toContain('Some reserve characters could not load')
    expect(error).toHaveBeenCalledWith('Backup Team could not load its local spare sprite sheet.', image.src)
    const board = await openBoard(user)
    expect(within(board).getAllByRole<HTMLButtonElement>('button', { name: 'Send upstairs' }).every((button) => button.disabled)).toBe(true)
  })
})
