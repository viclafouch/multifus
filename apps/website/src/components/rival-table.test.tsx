import { afterEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '@lingui/react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from '@testing-library/react'
import { RivalTable } from '@/components/rival-table'
import { RIVAL_IDS, RIVALS, TRAIT_IDS, TRAIT_NAMES } from '@/constants/rivals'
import { SPEAKERS } from '@/lib/i18n'

const show = () => {
  return render(
    <I18nProvider i18n={SPEAKERS.fr}>
      <RivalTable />
    </I18nProvider>
  )
}

describe('the table of the comparison', () => {
  afterEach(() => {
    cleanup()
  })

  it('gives its column to Multifus', () => {
    show()

    expect(screen.getByRole('columnheader', { name: 'Multifus' })).toBeDefined()
  })

  it.each(RIVAL_IDS)('leads to the code of %s', (rival) => {
    show()

    const { name, code } = RIVALS[rival]
    const link = screen.getByRole('link', { name })

    expect(link.getAttribute('href')).toBe(code)
  })

  it.each(TRAIT_IDS)('lays the %s row', (trait) => {
    show()

    expect(
      screen.getByRole('rowheader', {
        name: SPEAKERS.fr._(TRAIT_NAMES[trait])
      })
    ).toBeDefined()
  })

  it('says no under Multifus where Multifus does nothing', () => {
    show()

    const row = screen.getByRole('row', {
      name: /Fenêtres rangées côte à côte/u
    })
    const [mine] = within(row).getAllByRole('img')

    expect(mine.getAttribute('aria-label')).toBe('non')
  })

  it('says each cell in full words', () => {
    show()

    expect(screen.getAllByRole('img', { name: 'oui' }).length).toBeGreaterThan(
      0
    )
    expect(screen.getAllByRole('img', { name: 'non' }).length).toBeGreaterThan(
      0
    )
    expect(
      screen.getAllByRole('img', { name: 'à moitié' }).length
    ).toBeGreaterThan(0)
  })

  it('delivers the reason of a half cell without it being hovered', () => {
    show()

    expect(screen.getByText('Code publié, sans licence libre.')).toBeDefined()
  })

  it('raises the bubble when the cursor lands on a half cell', () => {
    show()

    const asked = screen.getAllByRole('button')[0]

    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.mouseEnter(asked)

    expect(screen.getByRole('tooltip').textContent).toBe(
      'Dans sa fenêtre à lui, pas par-dessus le jeu.'
    )

    vi.useFakeTimers()
    fireEvent.mouseLeave(asked)
    act(() => {
      vi.runAllTimers()
    })
    vi.useRealTimers()

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('dates its record in French', () => {
    show()

    expect(screen.getByText(/14 septembre 2026/u)).toBeDefined()
  })
})
