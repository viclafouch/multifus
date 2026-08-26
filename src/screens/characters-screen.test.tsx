import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { strings } from '@/constants/strings'

function pending(): Promise<never> {
  return new Promise(() => {})
}

const bridge = vi.hoisted(() => {
  return {
    refresh: vi.fn(pending),
    removeCharacter: vi.fn(pending),
    setClass: vi.fn(pending),
    setGender: vi.fn(pending),
    setGenderAsleep: vi.fn(pending),
    toggleAsleep: vi.fn(pending)
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { CharactersScreen } = await import('@/screens/characters-screen')

const character = (
  nickname: string,
  fields: Partial<Character> = {}
): Character => {
  return {
    nickname,
    gender: 'male',
    class: 'iop',
    asleep: false,
    online: true,
    relayed: true,
    ...fields
  }
}

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

describe('l’écran des personnages', () => {
  beforeEach(() => {
    for (const call of Object.values(bridge)) {
      call.mockClear()
    }
  })

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
    show([character('Alpha'), character('Bravo'), character('Charlie')])

    const nicknames = rows().map((row) => {
      return within(row).getByText(/^(Alpha|Bravo|Charlie)$/u).textContent
    })

    expect(nicknames).toStrictEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('numérote les personnages du défilement, et eux seuls', () => {
    show([
      character('Alpha'),
      character('Bravo', { asleep: true }),
      character('Charlie'),
      character('Delta', { online: false })
    ])

    const ranks = rows().map((row) => {
      return within(row).getByText(/^(0\d|·)$/u).textContent
    })

    expect(ranks).toStrictEqual(['01', '·', '02', '·'])
  })

  it('sort du défilement le personnage dont on bouge l’interrupteur', () => {
    show([character('Alpha')])

    fireEvent.click(
      screen.getByRole('switch', {
        name: strings.characters.cycleToggle('Alpha')
      })
    )

    expect(bridge.toggleAsleep).toHaveBeenCalledWith('Alpha')
  })

  it('laisse l’interrupteur d’un personnage déconnecté hors d’atteinte', () => {
    show([character('Alpha', { online: false })])

    const toggle = screen.getByRole('switch', {
      name: strings.characters.cycleToggle('Alpha')
    })

    fireEvent.click(toggle)

    expect(toggle.getAttribute('aria-disabled')).toBe('true')
    expect(bridge.toggleAsleep).not.toHaveBeenCalled()
  })

  it('n’offre de retirer du roster que les personnages déconnectés', () => {
    show([character('Alpha'), character('Bravo', { online: false })])

    expect(
      screen.queryByRole('button', { name: strings.characters.remove('Alpha') })
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: strings.characters.remove('Bravo') })
    ).not.toBeNull()
  })

  it('met de côté tous les personnages d’un sexe', () => {
    show([character('Alpha'), character('Bravo', { gender: 'female' })])

    fireEvent.click(
      screen.getByRole('button', {
        name: strings.characters.sleepGroupLabel.male
      })
    )

    expect(bridge.setGenderAsleep).toHaveBeenCalledWith('male', true)
  })

  it('remet dans le défilement tous les personnages d’un sexe', () => {
    show([character('Alpha', { gender: 'female', asleep: true })])

    fireEvent.click(
      screen.getByRole('button', {
        name: strings.characters.wakeGroupLabel.female
      })
    )

    expect(bridge.setGenderAsleep).toHaveBeenCalledWith('female', false)
  })

  it('coupe les actions groupées tant qu’un connecté n’a pas de sexe', () => {
    show([character('Alpha', { gender: null })])

    expect(
      screen.queryByRole('button', {
        name: strings.characters.sleepGroupLabel.male
      })
    ).toBeNull()
    expect(
      screen
        .getByRole('button', {
          name: strings.characters.sleepGroupLabel.male,
          hidden: true
        })
        .getAttribute('tabindex')
    ).toBe('-1')
    expect(
      screen
        .getByLabelText(strings.characters.groupLabel.male)
        .getAttribute('aria-disabled')
    ).toBe('true')
  })

  it('ne compte pas un déconnecté sans sexe comme un manque', () => {
    show([
      character('Alpha'),
      character('Bravo', { gender: null, online: false })
    ])

    fireEvent.click(
      screen.getByRole('button', {
        name: strings.characters.sleepGroupLabel.male
      })
    )

    expect(bridge.setGenderAsleep).toHaveBeenCalledWith('male', true)
  })

  it('dit sous chaque pseudo ce qui manque à son portrait', () => {
    show([
      character('Alpha', { class: null }),
      character('Bravo', { gender: null }),
      character('Charlie')
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
    show([character('Alpha', { class: null }), character('Bravo')])

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

  it('dit d’un personnage mis de côté qu’il est de côté', () => {
    show([
      character('Alpha', { asleep: true }),
      character('Bravo', { online: false })
    ])

    const subLines = rows().map((row) => {
      return within(row).getByText(/^Iop · /u).textContent
    })

    expect(subLines).toStrictEqual(['Iop · De côté', 'Iop · Déconnecté'])
  })
})
