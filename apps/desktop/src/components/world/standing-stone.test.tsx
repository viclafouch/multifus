import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { StandingStone, LEAVE_MS } from '@/components/world/standing-stone'
import { characterOf } from '@/test-doubles'

const ALPHA = characterOf({ nickname: 'Alpha' })
const BRAVO = characterOf({ nickname: 'Bravo', online: false })

const seat = (characters: readonly Character[]) => {
  return (
    <StandingStone
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

describe('the standing stone', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the removed head while it fades away', () => {
    const { rerender } = render(seat([ALPHA, BRAVO]))

    rerender(seat([ALPHA]))

    expect(headOf('Bravo')).not.toBeNull()
  })

  it('removes it once it has faded away', () => {
    const { rerender } = render(seat([ALPHA, BRAVO]))

    rerender(seat([ALPHA]))
    act(() => {
      vi.advanceTimersByTime(LEAVE_MS)
    })

    expect(headOf('Bravo')).toBeNull()
  })

  it('stops counting the head that leaves', () => {
    const { rerender } = render(
      seat([ALPHA, characterOf({ nickname: 'Charlie' })])
    )

    rerender(seat([ALPHA]))

    expect(screen.getByText('1 connecté')).not.toBeNull()
  })

  it('waits for the last head to leave before inviting to open a client', () => {
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
