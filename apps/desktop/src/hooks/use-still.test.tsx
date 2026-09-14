import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useStill } from '@/hooks/use-still'
import { ignore } from '@/lib/utils'

class SwitchableMediaQueryList extends EventTarget implements MediaQueryList {
  matches = false
  onchange = null

  constructor(readonly media: string) {
    super()
  }

  addListener = ignore
  removeListener = ignore
}

const system = () => {
  const query = new SwitchableMediaQueryList('(prefers-reduced-motion: reduce)')

  vi.stubGlobal('matchMedia', () => {
    return query
  })

  return {
    ask: (isStill: boolean) => {
      query.matches = isStill

      act(() => {
        query.dispatchEvent(new Event('change'))
      })
    }
  }
}

describe('useStill', () => {
  it('reads the setting of the system on opening', () => {
    const reduced = system()

    reduced.ask(true)

    const { result } = renderHook(() => {
      return useStill()
    })

    expect(result.current).toBe(true)
  })

  it('follows the setting without the window being reloaded', () => {
    const reduced = system()

    const { result } = renderHook(() => {
      return useStill()
    })

    expect(result.current).toBe(false)

    reduced.ask(true)

    expect(result.current).toBe(true)
  })
})
