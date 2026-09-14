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

describe('the capture of a combination', () => {
  it('hands the keys back to the system while a field is open', () => {
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

  it('takes them back even if the screen disappears with the field open', () => {
    const { result, unmount } = renderHook(() => {
      return useShortcutEditing()
    })

    act(() => {
      result.current.open({ kind: 'action', action: 'next' })
    })
    unmount()

    expect(bridge.resumeShortcuts).toHaveBeenCalledWith()
  })

  it('takes them back as soon as the field closes without setting anything', () => {
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
