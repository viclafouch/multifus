import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { characterOf, displayOf, pending, wheelSizeOf } from '@/test-doubles'

const bridge = {
  wheelDisplay: vi.fn(),
  setWheelDiameter: vi.fn(pending),
  setLoopSeen: vi.fn(pending),
  previewWheel: vi.fn(pending)
}

const motion = vi.hoisted(() => {
  return { matchIsStill: vi.fn() }
})

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

vi.mock(import('@/lib/motion'), async (importOriginal) => {
  return { ...(await importOriginal()), ...motion }
})

const { CharactersScreen } = await import('@/screens/characters')

type ShowParams = {
  readonly characters?: readonly Character[]
  readonly isStill?: boolean
}

const show = ({ characters = [], isStill = false }: ShowParams = {}) => {
  motion.matchIsStill.mockReturnValue(isStill)
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
    show()

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
    show()

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
    show()

    const offered = screen.getAllByRole('button').map((button) => {
      return button.textContent
    })

    expect(offered).toStrictEqual(['Voir en vrai'])
  })

  it('porte la roue des personnages sous le roster', () => {
    show({ characters: [characterOf({ nickname: 'Alpha' })] })

    expect(
      screen.getByRole('heading', { name: 'Roue des personnages' })
    ).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Voir en vrai' })).not.toBeNull()
  })

  it('montre la roue à qui n’a pas encore un seul personnage', () => {
    show()

    expect(
      screen.getByRole('heading', { name: 'Roue des personnages' })
    ).not.toBeNull()
  })
})
