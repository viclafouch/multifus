import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Character, Gender } from '@/@types/roster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { strings } from '@/constants/strings'
import { characterOf } from '@/test-doubles'

const bridge = {
  refresh: vi.fn(),
  removeCharacter: vi.fn(),
  setClass: vi.fn(),
  setGender: vi.fn(),
  setGenderExcluded: vi.fn(),
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

const rows = () => {
  return screen.getAllByRole('listitem')
}

const toggleOf = (gender: Gender) => {
  return screen.getByRole('button', {
    name: strings.characters.groupLabel[gender]
  })
}

describe('l’écran des personnages', () => {
  it('invite à connecter un personnage quand le roster est vide', () => {
    show([])

    expect(screen.getByText(strings.characters.emptyTitle)).not.toBeNull()
    expect(screen.queryByRole('listitem')).toBeNull()
  })

  it('cherche les clients ouverts à la demande', () => {
    show([])

    fireEvent.click(screen.getByRole('button', { name: /Chercher/u }))

    expect(bridge.refresh).toHaveBeenCalledWith()
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
        name: strings.characters.includeToggle('Alpha')
      })
    )

    expect(bridge.toggleExcluded).toHaveBeenCalledWith('Alpha')
  })

  it('laisse l’interrupteur d’un personnage déconnecté hors d’atteinte', () => {
    show([characterOf({ nickname: 'Alpha', online: false })])

    const toggle = screen.getByRole('switch', {
      name: strings.characters.includeToggle('Alpha')
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
      screen.queryByRole('button', { name: strings.characters.remove('Alpha') })
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: strings.characters.remove('Bravo') })
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
          name: strings.characters.includeToggle(nickname)
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
        name: strings.characters.classPick('Alpha')
      })
    ).not.toBeNull()
    expect(
      screen.getByRole('button', {
        name: strings.characters.portraitChange('Bravo')
      })
    ).not.toBeNull()
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
