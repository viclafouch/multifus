import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { OPENING_WAIT_MS } from '@/hooks/use-late-opening'
import {
  characterOf,
  displayOf,
  findLateDialog,
  pending,
  wheelSizeOf
} from '@/test-doubles'

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

vi.mock(import('@/lib/motion'), () => {
  return motion
})

const { CharactersScreen } = await import('@/screens/characters')

const PAST_THE_WAIT_MS = OPENING_WAIT_MS + 100

const LOOP_CAPTION =
  'Les touches maintenues dans le jeu : la roue s’ouvre au milieu de l’écran, la tête visée s’allume, et sa fenêtre passe devant.'

type ShowParams = {
  readonly characters?: readonly Character[]
  readonly isLoopSeen?: boolean
  readonly isStill?: boolean
}

const show = ({
  characters = [],
  isLoopSeen = true,
  isStill = false
}: ShowParams = {}) => {
  motion.matchIsStill.mockReturnValue(isStill)
  bridge.wheelDisplay.mockResolvedValue(displayOf())

  return render(
    <TooltipProvider>
      <CharactersScreen
        characters={characters}
        paintPortraits
        wheel={wheelSizeOf()}
        shortcuts={[]}
        isLoopSeen={isLoopSeen}
        run={() => {}}
      />
    </TooltipProvider>
  )
}

const loop = () => {
  return screen.queryByAltText(LOOP_CAPTION)
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

    expect(offered).toStrictEqual(['Revoir la vidéo', 'Voir en vrai'])
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

describe('la vidéo de la roue', () => {
  it('vient d’elle-même à la première arrivée, et ne revient plus', async () => {
    show({ isLoopSeen: false })

    expect(loop()).toBeNull()

    await findLateDialog()

    expect(loop()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))

    expect(bridge.setLoopSeen).toHaveBeenCalledExactlyOnceWith('wheel')
  })

  it('ne s’ouvre jamais toute seule une fois vue', async () => {
    show()

    await new Promise((resolve) => {
      setTimeout(resolve, PAST_THE_WAIT_MS)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('se rouvre au bouton, sans plus rien enregistrer', async () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Revoir la vidéo' }))

    await findLateDialog()

    expect(loop()).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))

    expect(bridge.setLoopSeen).not.toHaveBeenCalled()
  })

  it('laisse la plaque entière derrière elle', () => {
    show({ isLoopSeen: false })

    expect(screen.getAllByRole('slider', { hidden: true })).toHaveLength(2)
  })

  it('n’enregistre qu’une fois, même rouverte avant que Rust ait répondu', async () => {
    show({ isLoopSeen: false })
    await findLateDialog()

    fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))
    fireEvent.click(screen.getByRole('button', { name: 'Revoir la vidéo' }))

    await findLateDialog()
    fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))

    expect(bridge.setLoopSeen).toHaveBeenCalledTimes(1)
  })

  it('ne revient pas toute seule quand on l’a déjà ouverte à la main', async () => {
    show({ isLoopSeen: false })

    fireEvent.click(screen.getByRole('button', { name: 'Revoir la vidéo' }))
    await findLateDialog()
    fireEvent.click(screen.getByRole('button', { name: 'J’ai compris' }))

    await new Promise((resolve) => {
      setTimeout(resolve, PAST_THE_WAIT_MS)
    })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('arrive sans attendre pour qui a demandé moins de mouvement', () => {
    show({ isLoopSeen: false, isStill: true })

    expect(loop()).not.toBeNull()
  })
})
