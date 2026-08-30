import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { RuneTableStatus } from '@/@types/rune'
import type { ShortcutBinding } from '@/@types/shortcuts'
import { strings } from '@/constants/strings'
import { pending, snapshotOf } from '@/test-doubles'

const bridge = {
  sizeRuneTable: vi.fn(pending),
  fadeRuneTable: vi.fn(pending),
  setRuneTableTransparency: vi.fn(pending),
  setRuneTableWidth: vi.fn(pending),
  setRuneTableEverywhere: vi.fn(pending),
  previewRuneTable: vi.fn(pending),
  recallRuneTable: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { RuneTableScreen } = await import('@/screens/rune-table')

const words = strings.runeTable

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
    throw new Error(`Aucune jauge nommée ${label}`)
  }

  return found
}

const gauge = () => {
  return gaugeNamed(words.sizeLabel)
}

const veil = () => {
  return gaugeNamed(words.veilLabel)
}

describe('l’écran du tableau des runes', () => {
  it('rappelle la combinaison, sans rien dire de plus qu’elle', () => {
    show()

    expect(screen.getByText('Ctrl')).not.toBeNull()
    expect(screen.queryByText(strings.shortcuts.held)).toBeNull()
    expect(screen.queryByText(words.unbound)).toBeNull()
  })

  it('dit en tête que le tableau ne s’affiche plus sans combinaison', () => {
    show({ shortcuts: [runeTableShortcut(null)] })

    expect(screen.getByText(words.unbound)).not.toBeNull()
  })

  it('porte la jauge de largeur, ses bornes et la valeur du moment', () => {
    show()

    expect(gauge().getAttribute('min')).toBe('320')
    expect(gauge().getAttribute('max')).toBe('560')
    expect(gauge().getAttribute('step')).toBe('20')
    expect(gauge().getAttribute('aria-valuenow')).toBe('420')
    expect(screen.getByText(words.sizeValue(420))).not.toBeNull()
  })

  it('pousse la taille à l’aperçu à la touche, et l’enregistre une fois lâchée', async () => {
    show()

    gauge().focus()
    fireEvent.keyDown(gauge(), { key: 'ArrowRight' })

    await screen.findByText(words.sizeValue(440))

    expect(bridge.sizeRuneTable).toHaveBeenCalledWith(440)
    expect(bridge.setRuneTableWidth).toHaveBeenCalledWith(440)
  })

  it('porte la jauge de transparence, du tableau plein au tableau fantôme', () => {
    show()

    expect(veil().getAttribute('min')).toBe('0')
    expect(veil().getAttribute('max')).toBe('100')
    expect(veil().getAttribute('step')).toBe('5')
    expect(veil().getAttribute('aria-valuenow')).toBe('0')
  })

  it('éclaircit le tableau à la touche, et ne l’enregistre qu’une fois lâché', async () => {
    show()

    veil().focus()
    fireEvent.keyDown(veil(), { key: 'ArrowRight' })

    await screen.findByText(words.veilValue(5))

    expect(bridge.fadeRuneTable).toHaveBeenCalledWith(5)
    expect(bridge.setRuneTableTransparency).toHaveBeenCalledWith(5)
  })

  it('porte l’interrupteur des autres personnages, éteint au départ', () => {
    show()

    const everywhere = screen.getByRole('switch', {
      name: words.everywhereLabel
    })

    expect(everywhere.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(everywhere)

    expect(bridge.setRuneTableEverywhere).toHaveBeenCalledWith(true)
  })

  it('éteint l’interrupteur allumé', () => {
    show({ runeTable: { ...RUNE_TABLE, everywhere: true } })

    fireEvent.click(screen.getByRole('switch', { name: words.everywhereLabel }))

    expect(bridge.setRuneTableEverywhere).toHaveBeenCalledWith(false)
  })

  it('pose le vrai tableau au bouton, et n’en offre pas un second', () => {
    show()

    const posers = screen.getAllByRole('button', { name: words.tryIt })

    fireEvent.click(posers[0])

    expect(bridge.previewRuneTable).toHaveBeenCalledExactlyOnceWith()
    expect(posers).toHaveLength(1)
  })

  it('rappelle le tableau poussé hors de l’écran au coin du client', () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: words.recall }))

    expect(bridge.recallRuneTable).toHaveBeenCalledExactlyOnceWith()
  })
})
