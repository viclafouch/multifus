import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { characterOf, displayOf, pending, wheelSizeOf } from '@/test-doubles'

const bridge = {
  wheelDisplay: vi.fn(),
  setWheelDiameter: vi.fn(pending),
  setWheelLoopSeen: vi.fn(pending),
  previewWheel: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { CharactersScreen } = await import('@/screens/characters')

const show = (characters: readonly Character[]) => {
  bridge.wheelDisplay.mockResolvedValue(displayOf())

  return render(
    <TooltipProvider>
      <CharactersScreen
        characters={characters}
        paintPortraits
        wheel={wheelSizeOf()}
        shortcuts={[]}
        run={() => {}}
      />
    </TooltipProvider>
  )
}

describe('la map des personnages', () => {
  it('invite à entrer en jeu quand le roster est vide', () => {
    show([])

    expect(screen.getByText('Votre roster est vide')).not.toBeNull()
    expect(
      screen.getByText('Multifus regarde vos fenêtres, une fois par seconde.')
    ).not.toBeNull()
    expect(
      screen.queryByRole('switch', {
        name: 'Alpha dans le défilement et l’AutoFocus'
      })
    ).toBeNull()
  })

  it('déroule les trois temps du joueur quand le roster est vide', () => {
    show([])

    const titles = screen.getAllByRole('listitem').map((row) => {
      return within(row).getByText(/^(Lancez|Entrez|Il arrive)/u).textContent
    })

    expect(titles).toStrictEqual([
      'Lancez le jeu',
      'Entrez en jeu',
      'Il arrive ici'
    ])
  })

  it('n’offre rien à cliquer d’autre que la roue quand le roster est vide', () => {
    show([])

    const offered = screen.getAllByRole('button').map((button) => {
      return button.textContent
    })

    expect(offered).toStrictEqual(['Revoir la vidéo', 'Voir en vrai'])
  })

  it('porte la roue des personnages sous le roster', () => {
    show([characterOf({ nickname: 'Alpha' })])

    expect(
      screen.getByRole('heading', { name: 'Roue des personnages' })
    ).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Voir en vrai' })).not.toBeNull()
  })

  it('montre la roue à qui n’a pas encore un seul personnage', () => {
    show([])

    expect(
      screen.getByRole('heading', { name: 'Roue des personnages' })
    ).not.toBeNull()
  })
})
