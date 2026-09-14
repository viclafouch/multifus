import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { JournalEntry } from '@/@types/journal'
import { journalTime } from '@/helpers/journal'
import { pending, snapshotOf } from '@/test-doubles'

const bridge = {
  revealJournal: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { JournalPanel } = await import('@/components/journal-panel')

const NOON = Date.UTC(2026, 7, 26, 12, 0, 0)

const ENTRIES = [
  {
    id: 1,
    at: NOON,
    event: {
      kind: 'started',
      version: '1.4.2',
      system: 'macOS 15.3',
      launch: 'byHand'
    }
  },
  {
    id: 2,
    at: NOON + 1000,
    event: { kind: 'relaySent', nickname: 'Alpha' }
  }
] as const satisfies readonly JournalEntry[]

const LINES = [
  'Multifus 1.4.2 a démarré sur macOS 15.3, lancé à la main.',
  'Alpha : message privé relayé sur le téléphone.'
]

const show = (journal: readonly JournalEntry[]) => {
  render(<JournalPanel snapshot={snapshotOf({ journal })} />)
}

const toggle = () => {
  return screen.getByRole('button', { expanded: false })
}

describe('the journal', () => {
  it('stays folded when the window opens', () => {
    show(ENTRIES)

    expect(toggle()).not.toBeNull()
    expect(screen.queryByText(LINES[0])).toBeNull()
  })

  it('counts what it has to say, folded', () => {
    show(ENTRIES)

    expect(screen.getByText('2 entrées')).not.toBeNull()
  })

  it('counts one entry in the singular', () => {
    show([ENTRIES[0]])

    expect(screen.getByText('1 entrée')).not.toBeNull()
  })

  it('unfolds the lines and their time when it is opened', () => {
    show(ENTRIES)

    fireEvent.click(toggle())

    for (const [rank, entry] of ENTRIES.entries()) {
      expect(screen.getByText(LINES[rank])).not.toBeNull()
      expect(screen.getByText(journalTime(entry.at))).not.toBeNull()
    }
  })

  it('folds back when it is clicked again', () => {
    show(ENTRIES)

    fireEvent.click(toggle())
    fireEvent.click(screen.getByRole('button', { expanded: true }))

    expect(screen.queryByText(LINES[0])).toBeNull()
  })

  it('says it has nothing to report when it is empty', () => {
    show([])

    fireEvent.click(toggle())

    expect(screen.getByText('Rien à signaler pour l’instant.')).not.toBeNull()
  })

  it('offers to copy only when it has something to say', () => {
    show([])

    expect(
      screen.queryByRole('button', { name: 'Copier le journal' })
    ).toBeNull()
  })

  it('offers to copy from the first line, even folded', () => {
    show(ENTRIES)

    expect(
      screen.getByRole('button', { name: 'Copier le journal' })
    ).not.toBeNull()
  })

  it('leads to the journal file', () => {
    show([])

    fireEvent.click(
      screen.getByRole('button', { name: 'Montrer le fichier du journal' })
    )

    expect(bridge.revealJournal).toHaveBeenCalledWith()
  })
})
