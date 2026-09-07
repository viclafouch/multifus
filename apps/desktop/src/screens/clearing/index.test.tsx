import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { characterOf, onboardingOf } from '@/test-doubles'

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

const { ClearingScreen } = await import('@/screens/clearing')

const show = (characters: readonly Character[]) => {
  return render(
    <ClearingScreen
      characters={characters}
      authorization={{ granted: true, listening: true }}
      onboarding={onboardingOf()}
      paintPortraits
      onGo={() => {}}
      run={() => {}}
    />
  )
}

describe('l’accueil', () => {
  it('dit sous le titre que Multifus vient de la communauté', () => {
    show([])

    expect(
      screen.getByText('Logiciel communautaire pour Dofus Retro')
    ).not.toBeNull()
  })

  it('pose sur le dolmen une tête par personnage', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', online: false })
    ])

    expect(screen.getByRole('button', { name: /^Alpha ·/u })).not.toBeNull()
    expect(screen.getByRole('button', { name: /^Bravo ·/u })).not.toBeNull()
  })

  it('n’offre de retirer que les têtes déconnectées', () => {
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

  it('ne compte, sous le dolmen, que les personnages connectés', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', online: false }),
      characterOf({ nickname: 'Charlie' })
    ])

    expect(screen.getByText('2 connectés')).not.toBeNull()
  })

  it('retire du roster sans rien demander, et sans ouvrir la fiche', () => {
    show([characterOf({ nickname: 'Bravo', online: false })])

    fireEvent.click(
      screen.getByRole('button', { name: 'Retirer Bravo du roster' })
    )

    expect(bridge.removeCharacter).toHaveBeenCalledWith('Bravo')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
