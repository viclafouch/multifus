import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { WheelSize } from '@/@types/wheel'
import { DEMO_FEWEST, DEMO_USUAL } from '@/constants/wheel'
import {
  APPLE_AGENT,
  WINDOWS_AGENT,
  displayOf,
  pending,
  speakFrench,
  wheelSizeOf
} from '@/test-doubles'

const bridge = {
  setWheelDiameter: vi.fn(pending),
  previewWheel: vi.fn(pending),
  wheelDisplay: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const SIZE = wheelSizeOf()

const HEADER_LINE =
  'Maintenez vos touches dans le jeu, et nulle part ailleurs. Visez une tête au milieu de l’écran, lâchez : ce personnage s’affiche.'

const FULL_SCREEN_LINE =
  'La roue ne s’affiche pas sur un client en plein écran. Jouez en fenêtre agrandie.'

const wheelShortcut = (accelerator: string | null): ShortcutBinding => {
  return {
    action: 'wheel',
    accelerator,
    status: accelerator === null ? { kind: 'unbound' } : { kind: 'registered' },
    isDefault: true
  }
}

type ShowParams = {
  readonly size?: WheelSize
  readonly shortcuts?: readonly ShortcutBinding[]
  readonly agent?: string
}

const show = async ({
  size = SIZE,
  shortcuts = [wheelShortcut('Control+Shift+KeyW')],
  agent = WINDOWS_AGENT
}: ShowParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  await speakFrench()

  bridge.wheelDisplay.mockResolvedValue(displayOf())

  const { WheelPanel } = await import('@/screens/characters/wheel-panel')

  render(<WheelPanel wheel={size} shortcuts={shortcuts} run={() => {}} />)

  await screen.findByText(HEADER_LINE)
}

const namesOf = () => {
  return [...document.querySelectorAll('.wheel-name')].map((name) => {
    return name.textContent
  })
}

const gaugeUnder = (label: string) => {
  const named = screen.getByText(label)
  const found = screen
    .getAllByRole('slider', { hidden: true })
    .find((slider) => {
      return slider.getAttribute('aria-labelledby') === named.id
    })

  if (found === undefined) {
    throw new Error(`No gauge named ${label}`)
  }

  return found
}

const gauge = () => {
  return gaugeUnder('Taille')
}

const crowd = () => {
  return gaugeUnder('Personnages')
}

describe('the plate of the characters wheel', () => {
  it('recalls the combination, and says it is held down', async () => {
    await show()

    expect(screen.getByText('au maintien')).not.toBeNull()
    expect(
      screen.queryByText(
        'Sans touches, la roue n’existe pas. Posez-en dans l’écran Raccourcis.'
      )
    ).toBeNull()
  })

  it('says at the top that the wheel no longer exists without a combination', async () => {
    await show({ shortcuts: [wheelShortcut(null)] })

    expect(
      screen.getByText(
        'Sans touches, la roue n’existe pas. Posez-en dans l’écran Raccourcis.'
      )
    ).not.toBeNull()
  })

  it('carries the size gauge, its bounds and the current value', async () => {
    await show()

    expect(gauge().getAttribute('min')).toBe('280')
    expect(gauge().getAttribute('max')).toBe('720')
    expect(gauge().getAttribute('step')).toBe('20')
    expect(gauge().getAttribute('aria-valuenow')).toBe('400')
    expect(screen.getByText('400 px')).not.toBeNull()
  })

  it('follows the gauge while it is touched, and records only once released', async () => {
    await show()

    gauge().focus()
    fireEvent.keyDown(gauge(), { key: 'ArrowRight' })

    await screen.findByText('420 px')

    expect(bridge.setWheelDiameter).toHaveBeenCalledWith(420)
  })

  it('draws six example characters, the way it is most often played', async () => {
    await show()

    expect(namesOf()).toStrictEqual(
      SIZE.demo.slice(0, DEMO_USUAL).map((slice) => {
        return slice.nickname
      })
    )
  })

  it('brings the preview down to the player alone', async () => {
    await show()

    crowd().focus()

    for (let step = DEMO_USUAL; step > DEMO_FEWEST; step -= 1) {
      fireEvent.keyDown(crowd(), { key: 'ArrowLeft' })
    }

    await screen.findByText(String(DEMO_FEWEST))

    expect(namesOf()).toStrictEqual([SIZE.demo[0].nickname])
    expect(bridge.setWheelDiameter).not.toHaveBeenCalled()
  })

  it('brings the preview up to the team of eight', async () => {
    await show()

    crowd().focus()

    for (let step = DEMO_USUAL; step < SIZE.demo.length; step += 1) {
      fireEvent.keyDown(crowd(), { key: 'ArrowRight' })
    }

    await screen.findByText(String(SIZE.demo.length))

    expect(namesOf()).toHaveLength(SIZE.demo.length)
  })

  it('lights the slice the mouse hovers', async () => {
    await show()

    const slices = [...document.querySelectorAll('.wheel-slice')]

    fireEvent.pointerEnter(slices[1])

    expect(slices[1].hasAttribute('data-hovered')).toBe(true)
    expect(slices[0].hasAttribute('data-hovered')).toBe(false)
  })

  it('lays the real wheel on the button, with the world of the gauge', async () => {
    await show()

    fireEvent.click(screen.getByRole('button', { name: 'Voir en vrai' }))

    expect(bridge.previewWheel).toHaveBeenCalledWith(DEMO_USUAL)
  })

  it('takes into the real wheel the number the gauge shows', async () => {
    await show()

    crowd().focus()
    fireEvent.keyDown(crowd(), { key: 'ArrowRight' })

    await screen.findByText(String(DEMO_USUAL + 1))
    fireEvent.click(screen.getByRole('button', { name: 'Voir en vrai' }))

    expect(bridge.previewWheel).toHaveBeenCalledWith(DEMO_USUAL + 1)
  })

  describe('the warning about full screen', () => {
    it('says the wheel stays hidden there, on a Mac', async () => {
      await show({ agent: APPLE_AGENT })

      expect(
        screen.getByText(FULL_SCREEN_LINE).closest('.note-warning')
      ).not.toBeNull()
    })

    it('says nothing on Windows', async () => {
      await show({ agent: WINDOWS_AGENT })

      expect(screen.queryByText(FULL_SCREEN_LINE)).toBeNull()
    })
  })
})
