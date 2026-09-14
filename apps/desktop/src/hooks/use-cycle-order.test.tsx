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
    color: null,
    main: false,
    excluded: false,
    online: true,
    relayed: true,
    shortcut: null,
    shortcutStatus: { kind: 'unbound' }
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

  it('shows the roster in the order Rust gives', () => {
    const { result } = cycleOrder(ROSTER)

    expect(result.current.rows).toBe(ROSTER)
  })

  it('moves the dragged row and tells Rust about it', () => {
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

  it('moves nothing when the drag is given up', () => {
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

  it('moves nothing when the row is put back where it was', () => {
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

  it('moves nothing when what is dragged is not a row of the roster', () => {
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

  it('holds the dragged order while the snapshot has not caught up with it', () => {
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

  it('hands back to Rust once it says the same thing', () => {
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

  it('lets a character who comes online during a drag arrive afterwards', () => {
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

  it('lets go a character who goes offline after the drag', () => {
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
