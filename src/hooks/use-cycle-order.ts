import React from 'react'
import type { Character, Snapshot } from '@/lib/multifus'
import { reorder } from '@/lib/multifus'

type UseCycleOrderParams = {
  readonly characters: readonly Character[]
  readonly run: (action: Promise<Snapshot>) => void
}

/**
 * The cycle order while it is being rearranged.
 *
 * The roster the interface draws is the one the Rust side stored, except while a
 * row is being dragged: then it comes from a local copy that follows the pointer,
 * and the copy is dropped as soon as an answer comes back.
 */
export const useCycleOrder = ({ characters, run }: UseCycleOrderParams) => {
  const [order, setOrder] = React.useState<readonly string[] | null>(null)
  const [dragged, setDragged] = React.useState<string | null>(null)
  const [known, setKnown] = React.useState(characters)

  // A new roster drops the local copy, and this is React's own answer to
  // resetting state when a prop changes where a `key` does not fit: adjust
  // during render rather than in an effect. An effect would clear the order in a
  // second pass, so the frame between the two would draw the roster in its
  // previous order and the list would visibly jump back before settling.
  //
  // A scan landing mid-drag is the one case that keeps the copy: pulling a row
  // out from under the pointer is worse than being one scan behind.
  if (known !== characters) {
    setKnown(characters)

    if (dragged === null) {
      setOrder(null)
    }
  }

  const rows = arrange({ characters, order })

  const commit = (next: readonly string[]) => {
    setOrder(next)
    run(reorder(next))
  }

  return {
    rows,
    dragged,
    handleMove: (nickname: string, delta: number) => {
      const next = moved({ list: nicknamesOf(rows), nickname, delta })

      if (next !== null) {
        commit(next)
      }
    },
    handleDragStart: (nickname: string) => {
      setDragged(nickname)
      setOrder(nicknamesOf(rows))
    },
    handleDragOver: (nickname: string) => {
      if (dragged === null || dragged === nickname) {
        return
      }

      setOrder((current) => {
        const list = current ?? nicknamesOf(characters)
        const delta = list.indexOf(nickname) - list.indexOf(dragged)

        return moved({ list, nickname: dragged, delta }) ?? list
      })
    },
    handleDragEnd: () => {
      setDragged(null)

      if (order !== null) {
        run(reorder(order))
      }
    }
  }
}

const nicknamesOf = (characters: readonly Character[]) => {
  return characters.map((character) => {
    return character.nickname
  })
}

type ArrangeParams = {
  readonly characters: readonly Character[]
  readonly order: readonly string[] | null
}

/** The roster as it is drawn: the stored order, or the one being dragged. */
const arrange = ({
  characters,
  order
}: ArrangeParams): readonly Character[] => {
  if (order === null) {
    return characters
  }

  const known = new Map(
    characters.map((character) => {
      return [character.nickname, character]
    })
  )

  const ordered = order.flatMap((nickname) => {
    const character = known.get(nickname)

    return character === undefined ? [] : [character]
  })

  const rest = characters.filter((character) => {
    return !order.includes(character.nickname)
  })

  return [...ordered, ...rest]
}

type MovedParams = {
  readonly list: readonly string[]
  readonly nickname: string
  readonly delta: number
}

/** The same list with one nickname moved, or `null` when it cannot move. */
const moved = ({
  list,
  nickname,
  delta
}: MovedParams): readonly string[] | null => {
  const from = list.indexOf(nickname)
  const to = from + delta

  if (from === -1 || to < 0 || to >= list.length || delta === 0) {
    return null
  }

  const without = list.filter((_, index) => {
    return index !== from
  })

  return [...without.slice(0, to), nickname, ...without.slice(to)]
}
