import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, render, screen } from '@testing-library/react'
import { ProvenanceList } from '@/components/provenance-list'
import { PROVENANCE_IDS, PROVENANCES } from '@/constants/provenance'
import { SPEAKERS } from '@/lib/i18n'

const PROVENANCE_NAMES = [
  'Les décors des fenêtres',
  'Les portraits des douze classes',
  'Les boucles vidéo',
  'L’image posée sur une vidéo',
  'Les deux messages d’Ankama',
  'La fenêtre Options du client'
] as const satisfies readonly string[]

const show = () => {
  return render(
    <I18nProvider i18n={SPEAKERS.fr}>
      <ProvenanceList />
    </I18nProvider>
  )
}

describe('la liste des provenances', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(PROVENANCE_NAMES)('nomme %s', (family) => {
    show()

    expect(screen.getByText(family)).toBeDefined()
  })

  it('pose les six familles dans l’ordre de la source, et pas une de plus', () => {
    const { container } = show()

    const shown = [...container.querySelectorAll('dt')].map((term) => {
      return term.textContent
    })

    expect(shown).toStrictEqual([...PROVENANCE_NAMES])
  })

  it('pose l’origine de chaque famille sous son nom', () => {
    const { container } = show()

    const origins = [...container.querySelectorAll('dd')].map((cell) => {
      return cell.textContent
    })

    expect(origins).toStrictEqual(
      PROVENANCE_IDS.map((provenance) => {
        return SPEAKERS.fr._(PROVENANCES[provenance].origin)
      })
    )
  })

  it('dit que les décors viennent du site de Dofus Retro', () => {
    show()

    expect(screen.getByText(/dofus-retro\.com, recadrés/u)).toBeDefined()
  })
})
