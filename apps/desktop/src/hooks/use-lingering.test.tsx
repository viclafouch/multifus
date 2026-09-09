import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const motion = vi.hoisted(() => {
  return { isStill: false }
})

vi.mock(import('@/lib/motion'), async (importOriginal) => {
  return {
    ...(await importOriginal()),
    matchIsStill: () => {
      return motion.isStill
    }
  }
})

const { useLingering } = await import('@/hooks/use-lingering')

const WAIT_MS = 300

type Member = { name: string }

const nameOf = (member: Member) => {
  return member.name
}

const ALPHA: Member = { name: 'Alpha' }
const BRAVO: Member = { name: 'Bravo' }
const CHARLIE: Member = { name: 'Charlie' }

const watch = (items: readonly Member[]) => {
  return renderHook(
    (list: readonly Member[]) => {
      return useLingering({ items: list, keyOf: nameOf, wait: WAIT_MS })
    },
    { initialProps: items }
  )
}

const namesOf = (places: readonly { item: Member }[]) => {
  return places.map(({ item }) => {
    return item.name
  })
}

describe('useLingering', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    motion.isStill = false
  })

  it('rend la liste telle quelle tant que personne ne s’en va', () => {
    const { result } = watch([ALPHA, BRAVO])

    expect(namesOf(result.current)).toStrictEqual(['Alpha', 'Bravo'])
    expect(
      result.current.every(({ isLeaving }) => {
        return !isLeaving
      })
    ).toBe(true)
  })

  it('garde à sa place celui qui s’en va, et le dit partant', () => {
    const { result, rerender } = watch([ALPHA, BRAVO, CHARLIE])

    rerender([ALPHA, CHARLIE])

    expect(namesOf(result.current)).toStrictEqual(['Alpha', 'Bravo', 'Charlie'])
    expect(
      result.current.map(({ isLeaving }) => {
        return isLeaving
      })
    ).toStrictEqual([false, true, false])
  })

  it('le lâche une fois le temps passé', () => {
    const { result, rerender } = watch([ALPHA, BRAVO])

    rerender([ALPHA])
    act(() => {
      vi.advanceTimersByTime(WAIT_MS)
    })

    expect(namesOf(result.current)).toStrictEqual(['Alpha'])
  })

  it('le garde tant que le temps n’est pas passé', () => {
    const { result, rerender } = watch([ALPHA, BRAVO])

    rerender([ALPHA])
    act(() => {
      vi.advanceTimersByTime(WAIT_MS - 1)
    })

    expect(namesOf(result.current)).toStrictEqual(['Alpha', 'Bravo'])
  })

  it('rend sa place à celui qui revient avant la fin', () => {
    const { result, rerender } = watch([ALPHA, BRAVO])

    rerender([ALPHA])
    rerender([ALPHA, BRAVO])

    expect(namesOf(result.current)).toStrictEqual(['Alpha', 'Bravo'])
    expect(
      result.current.every(({ isLeaving }) => {
        return !isLeaving
      })
    ).toBe(true)
  })

  it('pose le nouveau venu à la suite', () => {
    const { result, rerender } = watch([ALPHA])

    rerender([ALPHA, BRAVO])

    expect(namesOf(result.current)).toStrictEqual(['Alpha', 'Bravo'])
  })

  it('ne retient personne quand le mouvement est refusé', () => {
    motion.isStill = true

    const { result, rerender } = watch([ALPHA, BRAVO])

    rerender([ALPHA])

    expect(namesOf(result.current)).toStrictEqual(['Alpha'])
  })
})
