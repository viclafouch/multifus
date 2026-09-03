import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Character, Gender } from '@/@types/roster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { characterOf } from '@/test-doubles'

const bridge = {
  removeCharacter: vi.fn(),
  setClass: vi.fn(),
  setColor: vi.fn(),
  setGender: vi.fn(),
  setGenderExcluded: vi.fn(),
  setMain: vi.fn(),
  toggleExcluded: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { CharactersScreen } = await import('@/screens/characters-screen')

const show = (characters: readonly Character[]) => {
  return render(
    <TooltipProvider>
      <CharactersScreen characters={characters} paintPortraits run={() => {}} />
    </TooltipProvider>
  )
}

const GROUP_LABELS = {
  male: 'Hommes dans le défilement et l’AutoFocus',
  female: 'Femmes dans le défilement et l’AutoFocus'
} as const satisfies Record<Gender, string>

const rows = () => {
  return screen.getAllByRole('listitem')
}

const mainToggleOf = (nickname: string) => {
  return screen.getByRole('button', {
    name: `${nickname} comme personnage principal`
  })
}

const toggleOf = (gender: Gender) => {
  return screen.getByRole('button', {
    name: GROUP_LABELS[gender]
  })
}

describe('l’écran des personnages', () => {
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

    const titles = rows().map((row) => {
      return within(row).getByText(/^(Lancez|Entrez|Il arrive)/u).textContent
    })

    expect(titles).toStrictEqual([
      'Lancez le jeu',
      'Entrez en jeu',
      'Il arrive ici'
    ])
  })

  it('ne laisse aucun bouton à cliquer quand le roster est vide', () => {
    show([])

    expect(screen.queryAllByRole('button')).toStrictEqual([])
  })

  it('montre une ligne par personnage, dans l’ordre du défilement', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo' }),
      characterOf({ nickname: 'Charlie' })
    ])

    const nicknames = rows().map((row) => {
      return within(row).getByText(/^(Alpha|Bravo|Charlie)$/u).textContent
    })

    expect(nicknames).toStrictEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('numérote les personnages du défilement, et eux seuls', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', excluded: true }),
      characterOf({ nickname: 'Charlie' }),
      characterOf({ nickname: 'Delta', online: false })
    ])

    const ranks = rows().map((row) => {
      return within(row).getByText(/^(0\d|·)$/u).textContent
    })

    expect(ranks).toStrictEqual(['01', '·', '02', '·'])
  })

  it('exclut le personnage dont on bouge l’interrupteur', () => {
    show([characterOf({ nickname: 'Alpha' })])

    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Alpha dans le défilement et l’AutoFocus'
      })
    )

    expect(bridge.toggleExcluded).toHaveBeenCalledWith('Alpha')
  })

  it('laisse l’interrupteur d’un personnage déconnecté hors d’atteinte', () => {
    show([characterOf({ nickname: 'Alpha', online: false })])

    const toggle = screen.getByRole('switch', {
      name: 'Alpha dans le défilement et l’AutoFocus'
    })

    fireEvent.click(toggle)

    expect(toggle.getAttribute('aria-disabled')).toBe('true')
    expect(bridge.toggleExcluded).not.toHaveBeenCalled()
  })

  it('n’offre de retirer du roster que les personnages déconnectés', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', online: false })
    ])

    expect(
      screen.queryByRole('button', { name: 'Retirer Alpha du roster' })
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Retirer Bravo du roster' })
    ).not.toBeNull()
  })

  it('montre les deux sexes allumés quand tout le monde défile', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', gender: 'female' })
    ])

    expect(toggleOf('male').getAttribute('aria-pressed')).toBe('true')
    expect(toggleOf('female').getAttribute('aria-pressed')).toBe('true')
  })

  it('éteint le sexe dont tous les connectés sont exclus', () => {
    show([
      characterOf({ nickname: 'Alpha', excluded: true }),
      characterOf({ nickname: 'Bravo', gender: 'female' })
    ])

    expect(toggleOf('male').getAttribute('aria-pressed')).toBe('false')
    expect(toggleOf('female').getAttribute('aria-pressed')).toBe('true')
  })

  it('exclut tout un sexe encore dans le défilement', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', gender: 'female' })
    ])

    fireEvent.click(toggleOf('male'))

    expect(bridge.setGenderExcluded).toHaveBeenCalledWith('male', true)
  })

  it('réintègre un sexe entièrement exclu', () => {
    show([characterOf({ nickname: 'Alpha', gender: 'female', excluded: true })])

    fireEvent.click(toggleOf('female'))

    expect(bridge.setGenderExcluded).toHaveBeenCalledWith('female', false)
  })

  it('laisse les deux sexes sous la main quand un connecté n’a pas de sexe', () => {
    show([characterOf({ nickname: 'Alpha', gender: null })])

    fireEvent.click(toggleOf('male'))

    expect(bridge.setGenderExcluded).toHaveBeenCalledWith('male', false)
  })

  it('ne compte pas un déconnecté sans sexe comme un manque', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', gender: null, online: false })
    ])

    fireEvent.click(toggleOf('male'))

    expect(bridge.setGenderExcluded).toHaveBeenCalledWith('male', true)
  })

  it('éteint l’interrupteur d’un personnage exclu, et lui seul', () => {
    show([
      characterOf({ nickname: 'Alpha', excluded: true }),
      characterOf({ nickname: 'Bravo' })
    ])

    const states = ['Alpha', 'Bravo'].map((nickname) => {
      return screen
        .getByRole('switch', {
          name: `${nickname} dans le défilement et l’AutoFocus`
        })
        .getAttribute('aria-checked')
    })

    expect(states).toStrictEqual(['false', 'true'])
  })

  it('dit sous chaque pseudo ce qui manque à son portrait', () => {
    show([
      characterOf({ nickname: 'Alpha', class: null }),
      characterOf({ nickname: 'Bravo', gender: null }),
      characterOf({ nickname: 'Charlie' })
    ])

    const subLines = rows().map((row) => {
      return within(row).getByText(/Connecté$/u).textContent
    })

    expect(subLines).toStrictEqual([
      'Classe à choisir · Connecté',
      'Sexe à choisir · Connecté',
      'Iop · Connecté'
    ])
  })

  it('mène du portrait vers ce qu’il reste à choisir', () => {
    show([
      characterOf({ nickname: 'Alpha', class: null }),
      characterOf({ nickname: 'Bravo' })
    ])

    expect(
      screen.getByRole('button', {
        name: 'Choisir la classe de Alpha'
      })
    ).not.toBeNull()
    expect(
      screen.getByRole('button', {
        name: 'Changer la classe, le sexe ou la couleur de Bravo'
      })
    ).not.toBeNull()
  })

  it('fait de ce personnage le principal', () => {
    show([characterOf({ nickname: 'Alpha' })])

    fireEvent.click(mainToggleOf('Alpha'))

    expect(bridge.setMain).toHaveBeenCalledWith('Alpha', true)
  })
})

describe('la couleur, dans l’écran des personnages', () => {
  it('montre la couleur du personnage, sans jamais la nommer', () => {
    show([
      characterOf({ nickname: 'Alpha', class: 'iop', color: 'turquoise' }),
      characterOf({ nickname: 'Bravo', class: 'iop', color: null })
    ])

    expect(rows()[0].querySelector('.stripe')?.classList).toContain(
      'tint-turquoise'
    )
    expect(rows()[1].querySelector('.stripe')).toBeNull()
    expect(within(rows()[0]).getByText(`Iop · Connecté`)).not.toBeNull()
    expect(within(rows()[0]).queryByText(/Turquoise/u)).toBeNull()
  })

  it('pose la couleur choisie dans la modale', () => {
    show([characterOf({ nickname: 'Alpha' })])

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Changer la classe, le sexe ou la couleur de Alpha'
      })
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Marquer Alpha en Ciel'
      })
    )

    expect(bridge.setColor).toHaveBeenCalledWith('Alpha', 'sky')
  })

  it('montre à chacun les couleurs que les autres portent déjà', () => {
    show([
      characterOf({ nickname: 'Alpha', color: null }),
      characterOf({ nickname: 'Bravo', color: 'sky' })
    ])

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Changer la classe, le sexe ou la couleur de Alpha'
      })
    )

    expect(
      screen.getByRole('button', {
        name: 'Marquer Alpha en Ciel, déjà pris par Bravo'
      })
    ).not.toBeNull()
  })
})

describe('le personnage principal', () => {
  it('reprend le principal à celui qui l’est', () => {
    show([characterOf({ nickname: 'Alpha', main: true })])

    fireEvent.click(mainToggleOf('Alpha'))

    expect(bridge.setMain).toHaveBeenCalledWith('Alpha', false)
  })

  it('n’allume le bouton que sur le personnage principal', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', main: true })
    ])

    const lit = ['Alpha', 'Bravo'].map((nickname) => {
      return mainToggleOf(nickname).getAttribute('aria-pressed')
    })

    expect(lit).toStrictEqual(['false', 'true'])
  })

  it('offre le principal à un déconnecté et à un exclu comme aux autres', () => {
    show([
      characterOf({ nickname: 'Alpha', online: false }),
      characterOf({ nickname: 'Bravo', excluded: true, main: true })
    ])

    fireEvent.click(mainToggleOf('Alpha'))

    expect(bridge.setMain).toHaveBeenCalledWith('Alpha', true)
    expect(mainToggleOf('Bravo').getAttribute('aria-pressed')).toBe('true')
  })

  it('dit d’un personnage exclu qu’il est exclu', () => {
    show([
      characterOf({ nickname: 'Alpha', excluded: true }),
      characterOf({ nickname: 'Bravo', online: false })
    ])

    const subLines = rows().map((row) => {
      return within(row).getByText(/^Iop · /u).textContent
    })

    expect(subLines).toStrictEqual(['Iop · Exclu', 'Iop · Déconnecté'])
  })
})
