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

const { RosterPanel } = await import('@/screens/characters/roster-panel')

const show = (characters: readonly Character[]) => {
  return render(
    <TooltipProvider>
      <RosterPanel characters={characters} paintPortraits run={() => {}} />
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

describe('the roster of the characters', () => {
  it('shows one row per character, in the order of the cycle', () => {
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

  it('numbers the characters of the cycle, and only them', () => {
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

  it('excludes the character whose switch is moved', () => {
    show([characterOf({ nickname: 'Alpha' })])

    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Alpha dans le défilement et l’AutoFocus'
      })
    )

    expect(bridge.toggleExcluded).toHaveBeenCalledWith('Alpha')
  })

  it('leaves the switch of an offline character out of reach', () => {
    show([characterOf({ nickname: 'Alpha', online: false })])

    const toggle = screen.getByRole('switch', {
      name: 'Alpha dans le défilement et l’AutoFocus'
    })

    fireEvent.click(toggle)

    expect(toggle.getAttribute('aria-disabled')).toBe('true')
    expect(bridge.toggleExcluded).not.toHaveBeenCalled()
  })

  it('offers to remove from the roster only the offline characters', () => {
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

  it('removes from the roster without asking anything', () => {
    show([characterOf({ nickname: 'Bravo', online: false })])

    fireEvent.click(
      screen.getByRole('button', { name: 'Retirer Bravo du roster' })
    )

    expect(bridge.removeCharacter).toHaveBeenCalledWith('Bravo')
  })

  it('shows the two genders lit when everybody cycles', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', gender: 'female' })
    ])

    expect(toggleOf('male').getAttribute('aria-pressed')).toBe('true')
    expect(toggleOf('female').getAttribute('aria-pressed')).toBe('true')
  })

  it('turns off the gender every online one of which is excluded', () => {
    show([
      characterOf({ nickname: 'Alpha', excluded: true }),
      characterOf({ nickname: 'Bravo', gender: 'female' })
    ])

    expect(toggleOf('male').getAttribute('aria-pressed')).toBe('false')
    expect(toggleOf('female').getAttribute('aria-pressed')).toBe('true')
  })

  it('excludes a whole gender still in the cycle', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', gender: 'female' })
    ])

    fireEvent.click(toggleOf('male'))

    expect(bridge.setGenderExcluded).toHaveBeenCalledWith('male', true)
  })

  it('brings back a gender that is entirely excluded', () => {
    show([characterOf({ nickname: 'Alpha', gender: 'female', excluded: true })])

    fireEvent.click(toggleOf('female'))

    expect(bridge.setGenderExcluded).toHaveBeenCalledWith('female', false)
  })

  it('leaves the two genders at hand when an online one has no gender', () => {
    show([characterOf({ nickname: 'Alpha', gender: null })])

    fireEvent.click(toggleOf('male'))

    expect(bridge.setGenderExcluded).toHaveBeenCalledWith('male', false)
  })

  it('does not count an offline one without a gender as a missing one', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', gender: null, online: false })
    ])

    fireEvent.click(toggleOf('male'))

    expect(bridge.setGenderExcluded).toHaveBeenCalledWith('male', true)
  })

  it('turns off the switch of an excluded character, and only it', () => {
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

  it('says under each nickname what is missing from its portrait', () => {
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

  it('leads from the portrait to what is left to choose', () => {
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

  it('makes that character the main one', () => {
    show([characterOf({ nickname: 'Alpha' })])

    fireEvent.click(mainToggleOf('Alpha'))

    expect(bridge.setMain).toHaveBeenCalledWith('Alpha', true)
  })
})

describe('the color, in the characters screen', () => {
  it('shows the character color, without ever naming it', () => {
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

  it('sets the color chosen in the dialog', () => {
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

  it('shows to each one the colors the others already wear', () => {
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

describe('the main character', () => {
  it('takes the main back from the one who is main', () => {
    show([characterOf({ nickname: 'Alpha', main: true })])

    fireEvent.click(mainToggleOf('Alpha'))

    expect(bridge.setMain).toHaveBeenCalledWith('Alpha', false)
  })

  it('lights the button only on the main character', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', main: true })
    ])

    const lit = ['Alpha', 'Bravo'].map((nickname) => {
      return mainToggleOf(nickname).getAttribute('aria-pressed')
    })

    expect(lit).toStrictEqual(['false', 'true'])
  })

  it('offers the main to an offline one and to an excluded one like to the others', () => {
    show([
      characterOf({ nickname: 'Alpha', online: false }),
      characterOf({ nickname: 'Bravo', excluded: true, main: true })
    ])

    fireEvent.click(mainToggleOf('Alpha'))

    expect(bridge.setMain).toHaveBeenCalledWith('Alpha', true)
    expect(mainToggleOf('Bravo').getAttribute('aria-pressed')).toBe('true')
  })

  it('says of an excluded character that it is excluded', () => {
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
