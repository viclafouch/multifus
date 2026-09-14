import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { RuneTableStatus } from '@/@types/rune'
import type { ShortcutBinding } from '@/@types/shortcuts'
import { pending, snapshotOf } from '@/test-doubles'

const bridge = {
  sizeRuneTable: vi.fn(pending),
  fadeRuneTable: vi.fn(pending),
  setRuneTableTransparency: vi.fn(pending),
  setRuneTableWidth: vi.fn(pending),
  setRuneTableEverywhere: vi.fn(pending),
  previewRuneTable: vi.fn(pending),
  recallRuneTable: vi.fn(pending),
  setLoopSeen: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { RuneTableScreen } = await import('@/screens/rune-table')

const RUNE_TABLE: RuneTableStatus = snapshotOf().runeTable

const runeTableShortcut = (accelerator: string | null): ShortcutBinding => {
  return {
    action: 'runeTable',
    accelerator,
    status: accelerator === null ? { kind: 'unbound' } : { kind: 'registered' },
    isDefault: true
  }
}

type ShowParams = {
  readonly runeTable?: RuneTableStatus
  readonly shortcuts?: readonly ShortcutBinding[]
}

const show = ({
  runeTable = RUNE_TABLE,
  shortcuts = [runeTableShortcut('Control+Shift+KeyR')]
}: ShowParams = {}) => {
  render(
    <RuneTableScreen
      runeTable={runeTable}
      shortcuts={shortcuts}
      run={() => {}}
    />
  )
}

const gaugeNamed = (label: string) => {
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
  return gaugeNamed('Taille')
}

const veil = () => {
  return gaugeNamed('Transparence')
}

describe('the rune table screen', () => {
  it('recalls the combination, without saying anything more than it', () => {
    show()

    expect(screen.getByText('Ctrl')).not.toBeNull()
    expect(screen.queryByText('au maintien')).toBeNull()
    expect(
      screen.queryByText(
        'Sans touches, le tableau ne s’affiche plus. Posez-en dans l’écran Raccourcis.'
      )
    ).toBeNull()
  })

  it('says at the top that the table no longer shows without a combination', () => {
    show({ shortcuts: [runeTableShortcut(null)] })

    expect(
      screen.getByText(
        'Sans touches, le tableau ne s’affiche plus. Posez-en dans l’écran Raccourcis.'
      )
    ).not.toBeNull()
  })

  it('carries the width gauge, its bounds and the current value', () => {
    show()

    expect(gauge().getAttribute('min')).toBe('320')
    expect(gauge().getAttribute('max')).toBe('560')
    expect(gauge().getAttribute('step')).toBe('20')
    expect(gauge().getAttribute('aria-valuenow')).toBe('420')
    expect(screen.getByText('420 px')).not.toBeNull()
  })

  it('pushes the size to the preview while it is touched, and records it once released', async () => {
    show()

    gauge().focus()
    fireEvent.keyDown(gauge(), { key: 'ArrowRight' })

    await screen.findByText('440 px')

    expect(bridge.sizeRuneTable).toHaveBeenCalledWith(440)
    expect(bridge.setRuneTableWidth).toHaveBeenCalledWith(440)
  })

  it('carries the transparency gauge, from the full table to the ghost table', () => {
    show()

    expect(veil().getAttribute('min')).toBe('0')
    expect(veil().getAttribute('max')).toBe('100')
    expect(veil().getAttribute('step')).toBe('5')
    expect(veil().getAttribute('aria-valuenow')).toBe('0')
  })

  it('lightens the table while it is touched, and records it only once released', async () => {
    show()

    veil().focus()
    fireEvent.keyDown(veil(), { key: 'ArrowRight' })

    await screen.findByText('5 %')

    expect(bridge.fadeRuneTable).toHaveBeenCalledWith(5)
    expect(bridge.setRuneTableTransparency).toHaveBeenCalledWith(5)
  })

  it('carries the switch of the other characters, off at the start', () => {
    show()

    const everywhere = screen.getByRole('switch', {
      name: 'Afficher sur tous les personnages connectés'
    })

    expect(everywhere.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(everywhere)

    expect(bridge.setRuneTableEverywhere).toHaveBeenCalledWith(true)
  })

  it('turns off the switch that is on', () => {
    show({ runeTable: { ...RUNE_TABLE, everywhere: true } })

    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Afficher sur tous les personnages connectés'
      })
    )

    expect(bridge.setRuneTableEverywhere).toHaveBeenCalledWith(false)
  })

  it('lays the real table on the button, and does not offer a second one', () => {
    show()

    const posers = screen.getAllByRole('button', { name: 'Voir en vrai' })

    fireEvent.click(posers[0])

    expect(bridge.previewRuneTable).toHaveBeenCalledExactlyOnceWith()
    expect(posers).toHaveLength(1)
  })

  it('brings back the table pushed off the screen to the corner of the client', () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Remettre' }))

    expect(bridge.recallRuneTable).toHaveBeenCalledExactlyOnceWith()
  })
})
