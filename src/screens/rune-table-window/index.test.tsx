import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PLATE_DRAWN_WIDTH, RUNE_FAMILIES } from '@/constants/runes'
import { strings } from '@/constants/strings'
import { pending } from '@/test-doubles'

const bridge = {
  moveRuneTable: vi.fn(pending),
  runeTableLook: vi.fn(async () => {
    return LOOK
  }),
  onRuneTableLook: vi.fn(async () => {
    return () => {}
  }),
  runeTableSettled: vi.fn(pending),
  runeTableMeasured: vi.fn(pending),
  closeRuneTable: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { RuneTableWindow } = await import('@/screens/rune-table-window')

const POINTER = 3

const words = strings.runeTable.sheet

const PLATE_HEIGHT = 647.4

const LOOK = 0.4

const standing = (height: number) => {
  return vi
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockReturnValue(new DOMRect(0, 0, PLATE_DRAWN_WIDTH, height))
}

const show = () => {
  render(<RuneTableWindow />)
}

const plate = () => {
  return screen.getByRole('group', { name: words.title })
}

const takenAt = (element: Element, screenX: number, screenY: number) => {
  fireEvent.pointerDown(element, {
    button: 0,
    pointerId: POINTER,
    screenX,
    screenY
  })
}

const moveTo = (screenX: number, screenY: number) => {
  fireEvent.pointerMove(plate(), { pointerId: POINTER, screenX, screenY })
}

const letGo = (screenX: number, screenY: number) => {
  fireEvent.pointerUp(plate(), { pointerId: POINTER, screenX, screenY })
}

describe('le tableau des runes posé sur le jeu', () => {
  it('porte son titre et les cinq familles', () => {
    show()

    expect(screen.getByText(words.title)).not.toBeNull()

    for (const family of RUNE_FAMILIES) {
      expect(
        screen.getByRole('columnheader', {
          name: words.families[family.name]
        })
      ).not.toBeNull()
    }
  })

  it('écrit chaque stat de la source, et son poids', () => {
    show()

    expect(screen.getByRole('rowheader', { name: 'Vitalité' })).not.toBeNull()
    expect(screen.getByRole('rowheader', { name: 'Pods' })).not.toBeNull()
    expect(
      screen.getByRole('rowheader', { name: 'Ine / Fo / Age / Cha' })
    ).not.toBeNull()
    expect(screen.getAllByText('100')).not.toHaveLength(0)
  })

  it('dit sa forme à Rust, qui en tire la hauteur de la fenêtre', () => {
    const measured = standing(PLATE_HEIGHT)

    show()
    measured.mockRestore()

    expect(bridge.runeTableMeasured).toHaveBeenCalledWith(
      PLATE_HEIGHT / PLATE_DRAWN_WIDTH
    )
  })

  it('se prend par un chiffre du tableau comme par un bord', async () => {
    show()

    const weight = screen.getAllByText('100')[0]

    takenAt(weight, 200, 200)
    moveTo(260, 240)

    await waitFor(() => {
      expect(bridge.moveRuneTable).toHaveBeenCalledWith(60, 40)
    })
  })

  it('n’écrit rien sur un clic net, sans un pixel de dérive', () => {
    show()

    takenAt(plate(), 200, 200)
    moveTo(201, 200)
    letGo(201, 200)

    expect(bridge.moveRuneTable).not.toHaveBeenCalled()
    expect(bridge.runeTableSettled).not.toHaveBeenCalled()
  })

  it('enregistre la place une fois la plaque lâchée', async () => {
    show()

    takenAt(plate(), 200, 200)
    moveTo(300, 200)
    letGo(300, 200)

    await waitFor(() => {
      expect(bridge.runeTableSettled).toHaveBeenCalledExactlyOnceWith()
    })
  })

  it('se ferme à la croix, et la croix ne déplace jamais', () => {
    show()

    const cross = screen.getByRole('button', { name: words.close })

    takenAt(cross, 200, 200)
    moveTo(400, 400)
    fireEvent.click(cross)

    expect(bridge.moveRuneTable).not.toHaveBeenCalled()
    expect(bridge.closeRuneTable).toHaveBeenCalledExactlyOnceWith()
  })

  it('porte le voile que Rust lui donne, sans rien changer d’autre', async () => {
    show()

    await waitFor(() => {
      expect(plate().getAttribute('style')).toContain(`opacity: ${LOOK}`)
    })
  })

  it('dit qu’une case vide est une rune qui n’existe pas', () => {
    show()

    expect(screen.getAllByText(words.emptyLabel)).not.toHaveLength(0)
  })
})
