import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Character } from '@/@types/roster'
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

const { ClearingScreen } = await import('@/screens/clearing')

const show = (characters: readonly Character[]) => {
  return render(
    <ClearingScreen
      characters={characters}
      authorization={{ granted: true, listening: true }}
      paintPortraits
      onGo={() => {}}
      run={() => {}}
    />
  )
}

describe('the home screen', () => {
  it('says under the title that Multifus comes from the community', () => {
    show([])

    expect(
      screen.getByText('Logiciel communautaire pour Dofus Retro')
    ).not.toBeNull()
  })

  it('lays on the standing stone one head per character', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', online: false })
    ])

    expect(screen.getByRole('button', { name: /^Alpha ·/u })).not.toBeNull()
    expect(screen.getByRole('button', { name: /^Bravo ·/u })).not.toBeNull()
  })

  it('offers to remove only the offline heads', () => {
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

  it('counts, under the standing stone, only the online characters', () => {
    show([
      characterOf({ nickname: 'Alpha' }),
      characterOf({ nickname: 'Bravo', online: false }),
      characterOf({ nickname: 'Charlie' })
    ])

    expect(screen.getByText('2 connectés')).not.toBeNull()
  })

  it('removes from the roster without asking anything, and without opening the card', () => {
    show([characterOf({ nickname: 'Bravo', online: false })])

    fireEvent.click(
      screen.getByRole('button', { name: 'Retirer Bravo du roster' })
    )

    expect(bridge.removeCharacter).toHaveBeenCalledWith('Bravo')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
