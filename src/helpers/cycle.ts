/** The cycle order, as the interface draws it. */

import type { Character } from '@/@types/roster'

type ArrangeParams = {
  readonly characters: readonly Character[]
  readonly order: readonly string[] | null
}

/** The roster as it is drawn: the stored order, or the one being dragged. */
export const arrange = ({
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
