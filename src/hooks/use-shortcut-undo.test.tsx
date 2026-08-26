import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ShortcutBinding } from '@/@types/shortcuts'
import { useShortcutUndo } from '@/hooks/use-shortcut-undo'

const NEXT = {
  action: 'next',
  accelerator: 'Control+Shift+Right',
  status: { kind: 'registered' },
  isDefault: true
} as const satisfies ShortcutBinding

const PREVIOUS = {
  ...NEXT,
  action: 'previous',
  accelerator: 'Control+Shift+Left'
} as const satisfies ShortcutBinding

const rebound = (
  shortcut: ShortcutBinding,
  accelerator: string | null
): ShortcutBinding => {
  return { ...shortcut, accelerator, isDefault: false }
}

describe('useShortcutUndo', () => {
  it('n’offre rien tant qu’aucune combinaison n’a bougé', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    expect(result.current.undoFor(NEXT)).toBeNull()
  })

  it('offre de reprendre la combinaison d’avant', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT])
    })

    const undo = result.current.undoFor(rebound(NEXT, 'Alt+KeyN'))

    expect(undo?.accelerator).toBe('Control+Shift+Right')
    expect(undo?.label).toBe(
      'Remettre les touches d’avant pour Fenêtre suivante'
    )
  })

  it('repose la combinaison d’avant et retire l’offre', () => {
    const apply = vi.fn()
    const { result } = renderHook(() => {
      return useShortcutUndo(apply)
    })

    act(() => {
      result.current.remember([NEXT])
    })
    act(() => {
      result.current.undoFor(rebound(NEXT, 'Alt+KeyN'))?.handleUndo()
    })

    expect(apply).toHaveBeenCalledWith('next', 'Control+Shift+Right')
    expect(result.current.undoFor(rebound(NEXT, 'Alt+KeyN'))).toBeNull()
  })

  it('n’offre rien quand la combinaison est revenue toute seule', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT])
    })

    expect(result.current.undoFor(NEXT)).toBeNull()
  })

  it('offre de reprendre une combinaison qui vient d’être effacée', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT])
    })

    expect(result.current.undoFor(rebound(NEXT, null))?.accelerator).toBe(
      'Control+Shift+Right'
    )
  })

  it('offre de reprendre une absence, quand il n’y avait rien avant', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([rebound(NEXT, null)])
    })

    expect(
      result.current.undoFor(rebound(NEXT, 'Alt+KeyN'))?.accelerator
    ).toBeNull()
  })

  it('tient une mémoire par action', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT])
    })

    expect(result.current.undoFor(rebound(PREVIOUS, 'Alt+KeyP'))).toBeNull()
    expect(result.current.undoFor(rebound(NEXT, 'Alt+KeyN'))).not.toBeNull()
  })

  it('oublie tout quand les cinq touches du premier jour reviennent', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT, PREVIOUS])
    })
    act(() => {
      result.current.forgetAll()
    })

    expect(result.current.undoFor(rebound(NEXT, 'Alt+KeyN'))).toBeNull()
    expect(result.current.undoFor(rebound(PREVIOUS, 'Alt+KeyP'))).toBeNull()
  })

  it('ne remonte que d’un cran après deux changements de suite', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT])
    })
    act(() => {
      result.current.remember([rebound(NEXT, 'Alt+KeyN')])
    })

    expect(result.current.undoFor(rebound(NEXT, 'Alt+KeyZ'))?.accelerator).toBe(
      'Alt+KeyN'
    )
  })
})
