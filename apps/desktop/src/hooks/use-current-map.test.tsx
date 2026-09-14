import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCurrentMap } from '@/hooks/use-current-map'

const openMultifus = () => {
  return renderHook(() => {
    return useCurrentMap()
  })
}

describe('useCurrentMap', () => {
  it('opens on the clearing while nothing has been visited', () => {
    const { result } = openMultifus()

    expect(result.current[0]).toBe('clearing')
  })

  it('keeps the visited map when the window reloads', () => {
    const first = openMultifus()

    act(() => {
      first.result.current[1]('relay')
    })
    first.unmount()

    const { result } = openMultifus()

    expect(result.current[0]).toBe('relay')
  })
})
