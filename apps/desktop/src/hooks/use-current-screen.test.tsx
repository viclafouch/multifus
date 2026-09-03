import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCurrentScreen } from '@/hooks/use-current-screen'

const openMultifus = () => {
  return renderHook(() => {
    return useCurrentScreen()
  })
}

describe('useCurrentScreen', () => {
  it('ouvre sur les personnages tant que rien n’a été visité', () => {
    const { result } = openMultifus()

    expect(result.current[0]).toBe('characters')
  })

  it('garde l’écran visité quand la fenêtre se recharge', () => {
    const first = openMultifus()

    act(() => {
      first.result.current[1]('relay')
    })
    first.unmount()

    const { result } = openMultifus()

    expect(result.current[0]).toBe('relay')
  })
})
