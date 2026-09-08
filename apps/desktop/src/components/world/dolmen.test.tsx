import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { Dolmen, LEAVE_MS } from '@/components/world/dolmen'
import { characterOf } from '@/test-doubles'

const ALPHA = characterOf({ nickname: 'Alpha' })
const BRAVO = characterOf({ nickname: 'Bravo', online: false })

const seat = (characters: readonly Character[]) => {
  return (
    <Dolmen
      characters={characters}
      onOpenCharacter={() => {}}
      onRemoveCharacter={() => {}}
    />
  )
}

const headOf = (nickname: string) => {
  return screen.queryByRole('button', {
    name: new RegExp(`^${nickname} ·`, 'u')
  })
}

describe('le dolmen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('garde la tête retirée le temps qu’elle s’efface', () => {
    const { rerender } = render(seat([ALPHA, BRAVO]))

    rerender(seat([ALPHA]))

    expect(headOf('Bravo')).not.toBeNull()
  })

  it('la retire une fois qu’elle s’est effacée', () => {
    const { rerender } = render(seat([ALPHA, BRAVO]))

    rerender(seat([ALPHA]))
    act(() => {
      vi.advanceTimersByTime(LEAVE_MS)
    })

    expect(headOf('Bravo')).toBeNull()
  })

  it('ne compte plus la tête qui s’en va', () => {
    const { rerender } = render(
      seat([ALPHA, characterOf({ nickname: 'Charlie' })])
    )

    rerender(seat([ALPHA]))

    expect(screen.getByText('1 connecté')).not.toBeNull()
  })

  it('attend que la dernière tête soit partie pour inviter à ouvrir un client', () => {
    const { rerender } = render(seat([BRAVO]))

    rerender(seat([]))

    expect(
      screen.queryByText(
        'Ouvrez un client Dofus : votre personnage viendra se poser ici.'
      )
    ).toBeNull()

    act(() => {
      vi.advanceTimersByTime(LEAVE_MS)
    })

    expect(
      screen.getByText(
        'Ouvrez un client Dofus : votre personnage viendra se poser ici.'
      )
    ).not.toBeNull()
  })
})
