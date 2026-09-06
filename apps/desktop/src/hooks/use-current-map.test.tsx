import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCurrentMap } from '@/hooks/use-current-map'

const openMultifus = () => {
  return renderHook(() => {
    return useCurrentMap()
  })
}

describe('useCurrentMap', () => {
  it('ouvre sur la clairière tant que rien n’a été visité', () => {
    const { result } = openMultifus()

    expect(result.current[0]).toBe('clearing')
  })

  it('garde la map visitée quand la fenêtre se recharge', () => {
    const first = openMultifus()

    act(() => {
      first.result.current[1]('relay')
    })
    first.unmount()

    const { result } = openMultifus()

    expect(result.current[0]).toBe('relay')
  })
})
