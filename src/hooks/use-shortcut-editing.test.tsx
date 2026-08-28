import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { pending } from '@/test-doubles'

const bridge = {
  suspendShortcuts: vi.fn(pending),
  resumeShortcuts: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { useShortcutEditing } = await import('@/hooks/use-shortcut-editing')

describe('la saisie d’une combinaison', () => {
  it('rend les touches au système tant qu’un champ est ouvert', () => {
    const { result } = renderHook(() => {
      return useShortcutEditing()
    })

    act(() => {
      result.current.open({ kind: 'character', nickname: 'Alpha' })
    })

    expect(bridge.suspendShortcuts).toHaveBeenCalledWith()
    expect(result.current.binding).toStrictEqual({
      kind: 'character',
      nickname: 'Alpha'
    })
  })

  it('les reprend même si l’écran disparaît le champ ouvert', () => {
    const { result, unmount } = renderHook(() => {
      return useShortcutEditing()
    })

    act(() => {
      result.current.open({ kind: 'action', action: 'next' })
    })
    unmount()

    expect(bridge.resumeShortcuts).toHaveBeenCalledWith()
  })

  it('les reprend dès que le champ se referme sans rien poser', () => {
    const { result } = renderHook(() => {
      return useShortcutEditing()
    })

    act(() => {
      result.current.open({ kind: 'action', action: 'next' })
    })
    act(() => {
      result.current.close()
    })

    expect(bridge.resumeShortcuts).toHaveBeenCalledWith()
    expect(result.current.binding).toBeNull()
  })
})
