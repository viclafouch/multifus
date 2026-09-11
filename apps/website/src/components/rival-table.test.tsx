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

describe('le tableau du comparatif', () => {
  afterEach(() => {
    cleanup()
  })

  it('donne sa colonne à Multifus', () => {
    show()

    expect(screen.getByRole('columnheader', { name: 'Multifus' })).toBeDefined()
  })

  it.each(RIVAL_IDS)('mène au code de %s', (rival) => {
    show()

    const { name, code } = RIVALS[rival]
    const link = screen.getByRole('link', { name })

    expect(link.getAttribute('href')).toBe(code)
  })

  it.each(TRAIT_IDS)('pose la ligne %s', (trait) => {
    show()

    expect(
      screen.getByRole('rowheader', {
        name: SPEAKERS.fr._(TRAIT_NAMES[trait])
      })
    ).toBeDefined()
  })

  it('dit non sous Multifus là où Multifus ne fait rien', () => {
    show()

    const row = screen.getByRole('row', {
      name: /Fenêtres rangées côte à côte/u
    })
    const [mine] = within(row).getAllByRole('img')

    expect(mine.getAttribute('aria-label')).toBe('non')
  })

  it('dit chaque case en toutes lettres', () => {
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

  it('livre la raison d’une case à moitié sans qu’on la survole', () => {
    show()

    expect(screen.getByText('Code publié, sans licence libre.')).toBeDefined()
  })

  it('lève la bulle quand le curseur se pose sur une case à moitié', () => {
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

  it('date son relevé en français', () => {
    show()

    expect(screen.getByText(/31 août 2026/u)).toBeDefined()
  })
})
