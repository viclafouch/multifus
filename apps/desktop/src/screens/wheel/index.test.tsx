import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ShortcutBinding } from '@/@types/shortcuts'
import type { WheelSize } from '@/@types/wheel'
import { DEMO_FEWEST, DEMO_USUAL } from '@/constants/wheel'
import { displayOf, pending, wheelSliceOf } from '@/test-doubles'

const bridge = {
  setWheelDiameter: vi.fn(pending),
  previewWheel: vi.fn(pending),
  wheelDisplay: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { WheelScreen } = await import('@/screens/wheel')

const DEMO_TEAM = Array.from({ length: 8 }, (_, rank) => {
  return wheelSliceOf({ nickname: `Faux ${rank + 1}`, here: rank === 0 })
})

const SIZE: WheelSize = {
  diameter: 400,
  smallest: 280,
  widest: 720,
  step: 20,
  deadZone: 0.32,
  demo: DEMO_TEAM
}

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
}

const show = async ({
  size = SIZE,
  shortcuts = [wheelShortcut('Control+Shift+KeyW')]
}: ShowParams = {}) => {
  bridge.wheelDisplay.mockResolvedValue(displayOf())

  render(<WheelScreen wheel={size} shortcuts={shortcuts} run={() => {}} />)

  await screen.findByText(
    'De faux personnages ici comme à l’essai, les vôtres en jeu. Une jauge pour la taille, une pour le monde qu’il y a dessus.'
  )
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
    throw new Error(`Aucune jauge nommée ${label}`)
  }

  return found
}

const gauge = () => {
  return gaugeUnder('Taille')
}

const crowd = () => {
  return gaugeUnder('Personnages')
}

describe('l’écran de la roue des personnages', () => {
  it('rappelle la combinaison, et dit qu’elle se maintient', async () => {
    await show()

    expect(screen.getByText('au maintien')).not.toBeNull()
    expect(
      screen.queryByText(
        'Sans touches, la roue n’existe pas. Posez-en dans l’écran Raccourcis.'
      )
    ).toBeNull()
  })

  it('dit en tête que la roue n’existe plus sans combinaison', async () => {
    await show({ shortcuts: [wheelShortcut(null)] })

    expect(
      screen.getByText(
        'Sans touches, la roue n’existe pas. Posez-en dans l’écran Raccourcis.'
      )
    ).not.toBeNull()
  })

  it('porte la jauge de taille, ses bornes et la valeur du moment', async () => {
    await show()

    expect(gauge().getAttribute('min')).toBe('280')
    expect(gauge().getAttribute('max')).toBe('720')
    expect(gauge().getAttribute('step')).toBe('20')
    expect(gauge().getAttribute('aria-valuenow')).toBe('400')
    expect(screen.getByText('400 px')).not.toBeNull()
  })

  it('suit la jauge à la touche, et n’enregistre qu’une fois lâchée', async () => {
    await show()

    gauge().focus()
    fireEvent.keyDown(gauge(), { key: 'ArrowRight' })

    await screen.findByText('420 px')

    expect(bridge.setWheelDiameter).toHaveBeenCalledWith(420)
  })

  it('dessine six personnages d’exemple, comme on joue le plus souvent', async () => {
    await show()

    expect(namesOf()).toStrictEqual(
      DEMO_TEAM.slice(0, DEMO_USUAL).map((slice) => {
        return slice.nickname
      })
    )
  })

  it('descend l’aperçu jusqu’au joueur tout seul', async () => {
    await show()

    crowd().focus()

    for (let step = DEMO_USUAL; step > DEMO_FEWEST; step -= 1) {
      fireEvent.keyDown(crowd(), { key: 'ArrowLeft' })
    }

    await screen.findByText('Tout seul')

    expect(namesOf()).toStrictEqual([DEMO_TEAM[0].nickname])
    expect(bridge.setWheelDiameter).not.toHaveBeenCalled()
  })

  it('monte l’aperçu jusqu’à la team de huit', async () => {
    await show()

    crowd().focus()

    for (let step = DEMO_USUAL; step < DEMO_TEAM.length; step += 1) {
      fireEvent.keyDown(crowd(), { key: 'ArrowRight' })
    }

    await screen.findByText(`À ${DEMO_TEAM.length}`)

    expect(namesOf()).toHaveLength(DEMO_TEAM.length)
  })

  it('allume la part que la souris survole', async () => {
    await show()

    const slices = [...document.querySelectorAll('.wheel-slice')]

    fireEvent.pointerEnter(slices[1])

    expect(slices[1].hasAttribute('data-hovered')).toBe(true)
    expect(slices[0].hasAttribute('data-hovered')).toBe(false)
  })

  it('pose la vraie roue au bouton, avec le monde de la jauge', async () => {
    await show()

    fireEvent.click(screen.getByRole('button', { name: 'Voir en vrai' }))

    expect(bridge.previewWheel).toHaveBeenCalledWith(DEMO_USUAL)
  })

  it('emmène dans la vraie roue le nombre que la jauge montre', async () => {
    await show()

    crowd().focus()
    fireEvent.keyDown(crowd(), { key: 'ArrowRight' })

    await screen.findByText(`À ${DEMO_USUAL + 1}`)
    fireEvent.click(screen.getByRole('button', { name: 'Voir en vrai' }))

    expect(bridge.previewWheel).toHaveBeenCalledWith(DEMO_USUAL + 1)
  })
})
