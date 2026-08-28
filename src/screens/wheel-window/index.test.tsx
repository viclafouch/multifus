import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { WheelStep } from '@/@types/wheel'
import { strings } from '@/constants/strings'
import { pending, wheelSliceOf } from '@/test-doubles'

const bridge = {
  wheelStep: vi.fn(),
  onWheelStep: vi.fn(),
  onWheelAim: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { WheelWindow } = await import('@/screens/wheel-window')

const stepOf = (fields: Partial<WheelStep> = {}): WheelStep => {
  return {
    diameter: 400,
    deadZone: 0.32,
    slices: [],
    hovered: null,
    previewing: false,
    ...fields
  }
}

const stopListening = () => {}

const namesOf = () => {
  return [...document.querySelectorAll('.wheel-name')].map((name) => {
    return name.textContent
  })
}

const show = async (step: WheelStep) => {
  bridge.wheelStep.mockResolvedValue(step)
  bridge.onWheelStep.mockResolvedValue(stopListening)
  bridge.onWheelAim.mockResolvedValue(stopListening)

  render(<WheelWindow />)

  await waitFor(() => {
    expect(document.querySelector('svg')).not.toBeNull()
  })
}

const TEAM = [
  wheelSliceOf({ nickname: 'Alpha', here: true }),
  wheelSliceOf({ nickname: 'Bravo', class: 'cra', gender: 'female' }),
  wheelSliceOf({ nickname: 'Charlie', class: null, gender: null, main: true })
]

describe('la roue', () => {
  it('ne dessine rien tant que Rust n’a pas parlé', () => {
    bridge.wheelStep.mockImplementation(pending)
    bridge.onWheelStep.mockImplementation(pending)
    bridge.onWheelAim.mockImplementation(pending)

    const { container } = render(<WheelWindow />)

    expect(container.textContent).toBe('')
  })

  it('porte une part par personnage connecté, pseudo compris', async () => {
    await show(stepOf({ slices: TEAM }))

    expect(namesOf()).toStrictEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('allume la part visée', async () => {
    await show(stepOf({ slices: TEAM, hovered: 1 }))

    const lit = [...document.querySelectorAll('.wheel-slice')].map((slice) => {
      return slice.hasAttribute('data-hovered')
    })

    expect(lit).toStrictEqual([false, true, false])
  })

  it('n’écrit rien au centre tant qu’il reste un personnage', async () => {
    await show(stepOf({ slices: TEAM }))

    expect(document.querySelector('p')).toBeNull()
  })

  it('s’ouvre en le disant quand personne n’est connecté', async () => {
    await show(stepOf({ slices: [] }))

    expect(screen.getByText(strings.wheel.nobody)).not.toBeNull()
  })

  it('pose ce que la roue lui donne, aperçu comme vraie roue', async () => {
    await show(stepOf({ slices: TEAM, previewing: true }))

    expect(namesOf()).toStrictEqual(
      TEAM.map((slice) => {
        return slice.nickname
      })
    )
  })

  it('rend l’étoile au principal, et à lui seul', async () => {
    await show(stepOf({ slices: TEAM }))

    expect(screen.getAllByText(strings.characters.mainMark)).toHaveLength(1)
  })
})
