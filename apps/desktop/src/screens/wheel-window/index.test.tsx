import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { WheelStep } from '@/@types/wheel'
import { pending, wheelSliceOf } from '@/test-doubles'

const bridge = {
  wheelStep: vi.fn(),
  onWheelStep: vi.fn(),
  onWheelAim: vi.fn(),
  onWheelWipe: vi.fn(),
  wheelWiped: vi.fn()
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
  bridge.onWheelWipe.mockResolvedValue(stopListening)

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

describe('the wheel', () => {
  it('draws nothing while Rust has not spoken', () => {
    bridge.wheelStep.mockImplementation(pending)
    bridge.onWheelStep.mockImplementation(pending)
    bridge.onWheelAim.mockImplementation(pending)
    bridge.onWheelWipe.mockImplementation(pending)

    const { container } = render(<WheelWindow />)

    expect(container.textContent).toBe('')
  })

  it('carries one slice per online character, nickname included', async () => {
    await show(stepOf({ slices: TEAM }))

    expect(namesOf()).toStrictEqual(['Alpha', 'Bravo', 'Charlie'])
  })

  it('lights the aimed slice', async () => {
    await show(stepOf({ slices: TEAM, hovered: 1 }))

    const lit = [...document.querySelectorAll('.wheel-slice')].map((slice) => {
      return slice.hasAttribute('data-hovered')
    })

    expect(lit).toStrictEqual([false, true, false])
  })

  it('writes nothing at the center while one character is left', async () => {
    await show(stepOf({ slices: TEAM }))

    expect(document.querySelector('p')).toBeNull()
  })

  it('opens saying so when nobody is online', async () => {
    await show(stepOf({ slices: [] }))

    expect(screen.getByText('Personne de connecté')).not.toBeNull()
  })

  it('lays what the wheel gives it, preview as well as real wheel', async () => {
    await show(stepOf({ slices: TEAM, previewing: true }))

    expect(namesOf()).toStrictEqual(
      TEAM.map((slice) => {
        return slice.nickname
      })
    )
  })

  it('gives the star back to the main one, and to it alone', async () => {
    await show(stepOf({ slices: TEAM }))

    expect(screen.getAllByText('Personnage principal')).toHaveLength(1)
  })
})
