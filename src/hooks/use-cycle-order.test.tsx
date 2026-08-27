import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DragEndEvent } from '@dnd-kit/react'
import { act, renderHook } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { nicknamesOf } from '@/helpers/cycle'

const dnd = vi.hoisted(() => {
  return {
    isSortable: (source: unknown) => {
      return (
        source !== null &&
        typeof source === 'object' &&
        'index' in source &&
        'initialIndex' in source
      )
    }
  }
})

const bridge = vi.hoisted(() => {
  return {
    reorder: vi.fn(() => {
      return new Promise<Snapshot>(() => {})
    })
  }
})

// oxlint-disable-next-line prefer-import-in-mock -- dnd-kit types isSortable as an overloaded instanceof predicate no fake can satisfy
vi.mock('@dnd-kit/react/sortable', () => {
  return { isSortable: dnd.isSortable }
})

vi.mock(import('@/lib/multifus'), () => {
  return { reorder: bridge.reorder }
})

const { useCycleOrder } = await import('@/hooks/use-cycle-order')

const character = (nickname: string): Character => {
  return {
    nickname,
    gender: 'male',
    class: 'iop',
    excluded: false,
    online: true,
    relayed: true
  }
}

const ROSTER = ['Alpha', 'Bravo', 'Charlie'].map(character)

const drag = (source: unknown, canceled: boolean) => {
  // oxlint-disable-next-line no-unsafe-type-assertion -- dnd-kit only builds a real DragEndEvent from a live drag
  return { canceled, operation: { source } } as unknown as DragEndEvent
}

const dragged = (nickname: string, from: number, to: number) => {
  return drag({ id: nickname, index: to, initialIndex: from }, false)
}

const canceled = (nickname: string, from: number, to: number) => {
  return drag({ id: nickname, index: to, initialIndex: from }, true)
}

const cycleOrder = (characters: readonly Character[]) => {
  return renderHook(
    ({ roster }) => {
      return useCycleOrder({ characters: roster, run: () => {} })
    },
    { initialProps: { roster: characters } }
  )
}

describe('useCycleOrder', () => {
  beforeEach(() => {
    bridge.reorder.mockClear()
  })

  it('montre le roster dans l’ordre que Rust donne', () => {
    const { result } = cycleOrder(ROSTER)

    expect(result.current.rows).toBe(ROSTER)
  })

  it('déplace la ligne tirée et le dit à Rust', () => {
    const { result } = cycleOrder(ROSTER)

    act(() => {
      result.current.handleDragStart()
    })
    act(() => {
      result.current.handleDragEnd(dragged('Charlie', 2, 0))
    })

    expect(nicknamesOf(result.current.rows)).toStrictEqual([
      'Charlie',
      'Alpha',
      'Bravo'
    ])
    expect(bridge.reorder).toHaveBeenCalledWith(['Charlie', 'Alpha', 'Bravo'])
  })

  it('ne bouge rien quand le tirage est abandonné', () => {
    const { result } = cycleOrder(ROSTER)

    act(() => {
      result.current.handleDragStart()
    })
    act(() => {
      result.current.handleDragEnd(canceled('Charlie', 2, 0))
    })

    expect(nicknamesOf(result.current.rows)).toStrictEqual([
      'Alpha',
      'Bravo',
      'Charlie'
    ])
    expect(bridge.reorder).not.toHaveBeenCalled()
  })

  it('ne bouge rien quand la ligne est reposée là où elle était', () => {
    const { result } = cycleOrder(ROSTER)

    act(() => {
      result.current.handleDragStart()
    })
    act(() => {
      result.current.handleDragEnd(dragged('Charlie', 2, 2))
    })

    expect(nicknamesOf(result.current.rows)).toStrictEqual([
      'Alpha',
      'Bravo',
      'Charlie'
    ])
    expect(bridge.reorder).not.toHaveBeenCalled()
  })

  it('ne bouge rien quand ce qui est tiré n’est pas une ligne du roster', () => {
    const { result } = cycleOrder(ROSTER)

    act(() => {
      result.current.handleDragStart()
    })
    act(() => {
      result.current.handleDragEnd(drag({ id: 'Charlie' }, false))
    })

    expect(nicknamesOf(result.current.rows)).toStrictEqual([
      'Alpha',
      'Bravo',
      'Charlie'
    ])
    expect(bridge.reorder).not.toHaveBeenCalled()
  })

  it('tient l’ordre tiré tant que l’instantané ne l’a pas rattrapé', () => {
    const { result, rerender } = cycleOrder(ROSTER)

    act(() => {
      result.current.handleDragStart()
    })
    act(() => {
      result.current.handleDragEnd(dragged('Charlie', 2, 0))
    })
    rerender({ roster: [...ROSTER] })

    expect(nicknamesOf(result.current.rows)).toStrictEqual([
      'Charlie',
      'Alpha',
      'Bravo'
    ])
  })

  it('rend la main à Rust une fois qu’il dit la même chose', () => {
    const { result, rerender } = cycleOrder(ROSTER)

    act(() => {
      result.current.handleDragStart()
    })
    act(() => {
      result.current.handleDragEnd(dragged('Charlie', 2, 0))
    })

    const settled = ['Charlie', 'Alpha', 'Bravo'].map(character)

    rerender({ roster: settled })

    expect(result.current.rows).toBe(settled)
  })

  it('laisse un personnage qui se connecte pendant un tirage arriver ensuite', () => {
    const { result, rerender } = cycleOrder(ROSTER)

    act(() => {
      result.current.handleDragStart()
    })
    rerender({ roster: [...ROSTER, character('Delta')] })

    expect(nicknamesOf(result.current.rows)).toStrictEqual([
      'Alpha',
      'Bravo',
      'Charlie',
      'Delta'
    ])
  })

  it('laisse partir un personnage qui se déconnecte après le tirage', () => {
    const { result, rerender } = cycleOrder(ROSTER)

    act(() => {
      result.current.handleDragStart()
    })
    act(() => {
      result.current.handleDragEnd(dragged('Charlie', 2, 0))
    })
    rerender({ roster: ['Charlie', 'Alpha'].map(character) })

    expect(nicknamesOf(result.current.rows)).toStrictEqual(['Charlie', 'Alpha'])
  })
})
