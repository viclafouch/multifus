import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { JournalEntry } from '@/@types/journal'
import { strings } from '@/constants/strings'
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

describe('le journal', () => {
  it('reste replié à l’ouverture de la fenêtre', () => {
    show(ENTRIES)

    expect(toggle()).not.toBeNull()
    expect(screen.queryByText(LINES[0])).toBeNull()
  })

  it('compte ce qu’il a à dire, replié', () => {
    show(ENTRIES)

    expect(screen.getByText(strings.journal.entries(2))).not.toBeNull()
  })

  it('compte une entrée au singulier', () => {
    show([ENTRIES[0]])

    expect(screen.getByText(strings.journal.entries(1))).not.toBeNull()
  })

  it('déroule les lignes et leur heure quand on l’ouvre', () => {
    show(ENTRIES)

    fireEvent.click(toggle())

    for (const [rank, entry] of ENTRIES.entries()) {
      expect(screen.getByText(LINES[rank])).not.toBeNull()
      expect(screen.getByText(journalTime(entry.at))).not.toBeNull()
    }
  })

  it('se replie quand on le reclique', () => {
    show(ENTRIES)

    fireEvent.click(toggle())
    fireEvent.click(screen.getByRole('button', { expanded: true }))

    expect(screen.queryByText(LINES[0])).toBeNull()
  })

  it('dit qu’il n’a rien à signaler quand il est vide', () => {
    show([])

    fireEvent.click(toggle())

    expect(screen.getByText(strings.journal.empty)).not.toBeNull()
  })

  it('n’offre de copier que lorsqu’il a quelque chose à dire', () => {
    show([])

    expect(
      screen.queryByRole('button', { name: strings.journal.copy })
    ).toBeNull()
  })

  it('offre de copier dès la première ligne, même replié', () => {
    show(ENTRIES)

    expect(
      screen.getByRole('button', { name: strings.journal.copy })
    ).not.toBeNull()
  })

  it('mène au fichier du journal', () => {
    show([])

    fireEvent.click(
      screen.getByRole('button', { name: strings.journal.reveal })
    )

    expect(bridge.revealJournal).toHaveBeenCalledWith()
  })
})
