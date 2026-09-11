import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { RUNE_STAT_IDS } from '@multifus/runes'
import { cleanup, render, screen, within } from '@testing-library/react'
import { RuneTable } from '@/components/rune-table'
import { RUNE_FAMILY_NAMES, RUNE_STAT_NAMES } from '@/constants/runes'
import { SPEAKERS } from '@/lib/i18n'

const FAMILY_NAMES = [
  'Les lourdes',
  'Dommages',
  'Résistances',
  'Secondaires',
  'Les légères'
] as const satisfies readonly string[]

const show = () => {
  return render(
    <I18nProvider i18n={SPEAKERS.fr}>
      <RuneTable />
    </I18nProvider>
  )
}

const lineOf = (stat: string) => {
  const line = screen.getByRole('rowheader', { name: stat }).closest('tr')

  if (line === null) {
    throw new Error(`Aucune ligne nommée ${stat}`)
  }

  return line
}

describe('la table des poids de runes', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(FAMILY_NAMES)('annonce la famille %s', (family) => {
    show()

    expect(screen.getByRole('columnheader', { name: family })).toBeDefined()
  })

  it('nomme les cinq familles de la source, et pas une de plus', () => {
    show()

    const named = Object.values(RUNE_FAMILY_NAMES).map((family) => {
      return SPEAKERS.fr._(family)
    })

    expect(named).toStrictEqual([...FAMILY_NAMES])
  })

  it.each(RUNE_STAT_IDS)('pose la ligne de %s', (stat) => {
    show()

    expect(
      screen.getByRole('rowheader', {
        name: SPEAKERS.fr._(RUNE_STAT_NAMES[stat])
      })
    ).toBeDefined()
  })

  it('écrit les quatre poids de la Sagesse', () => {
    show()

    const cells = within(lineOf('Sagesse')).getAllByRole('cell')

    expect(
      cells.map((cell) => {
        return cell.textContent
      })
    ).toStrictEqual(['3', '9', '30', '3'])
  })

  it('écrit le quart de point de la vitalité avec la virgule du français', () => {
    show()

    const cells = within(lineOf('Vitalité')).getAllByRole('cell')

    expect(cells.at(-1)?.textContent).toBe('0,25')
  })

  it('dit au lecteur d’écran la rune qui n’existe pas', () => {
    show()

    expect(
      within(lineOf('PA')).getAllByText('Cette rune n’existe pas')
    ).toHaveLength(2)
  })

  it('pose une ligne par stat, une par famille, et son en-tête', () => {
    show()

    expect(screen.getAllByRole('row')).toHaveLength(
      RUNE_STAT_IDS.length + FAMILY_NAMES.length + 1
    )
  })
})
