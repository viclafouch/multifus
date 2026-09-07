import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoopDialog } from '@/components/loop-dialog'

const CAPTION = 'Ce que la vidéo montre'

const show = (source: string | null) => {
  render(
    <LoopDialog
      title="La roue des personnages"
      description="Ce que la vidéo raconte"
      caption={CAPTION}
      source={source}
      isOpen
      onOpenChange={() => {}}
    />
  )
}

describe('le dialogue d’une vidéo', () => {
  it('se pose au-dessus de la page, jamais dans le flux', () => {
    show('/faux.gif')

    expect([...screen.getByRole('dialog').classList]).toContain('fixed')
  })

  it('montre la vidéo, et son titre par-dessus', () => {
    show('/faux.gif')

    expect(screen.getByAltText(CAPTION)).not.toBeNull()
    expect(
      screen.getByRole('heading', { name: 'La roue des personnages' })
    ).not.toBeNull()
  })

  it('ne montre que la légende tant qu’aucune vidéo n’est enregistrée', () => {
    show(null)

    expect(screen.queryByAltText(CAPTION)).toBeNull()
    expect(screen.getByText(CAPTION)).not.toBeNull()
  })
})
