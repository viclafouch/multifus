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
  it('offers nothing while no combination has moved', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    expect(result.current.undoFor(NEXT)).toBeNull()
  })

  it('offers to take back the combination from before', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT])
    })

    const undo = result.current.undoFor(rebound(NEXT, 'Alt+KeyN'))

    expect(undo?.accelerator).toBe('Control+Shift+Right')
    expect(undo?.label).toBe(
      'Remettre les touches d’avant pour Personnage suivant'
    )
  })

  it('sets the combination from before back and removes the offer', () => {
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

  it('offers nothing when the combination came back on its own', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT])
    })

    expect(result.current.undoFor(NEXT)).toBeNull()
  })

  it('offers to take back a combination that has just been cleared', () => {
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

  it('offers to take back an absence, when there was nothing before', () => {
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

  it('holds one memory per action', () => {
    const { result } = renderHook(() => {
      return useShortcutUndo(vi.fn())
    })

    act(() => {
      result.current.remember([NEXT])
    })

    expect(result.current.undoFor(rebound(PREVIOUS, 'Alt+KeyP'))).toBeNull()
    expect(result.current.undoFor(rebound(NEXT, 'Alt+KeyN'))).not.toBeNull()
  })

  it('forgets everything when the five keys of the first day come back', () => {
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

  it('goes back only one notch after two changes in a row', () => {
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
