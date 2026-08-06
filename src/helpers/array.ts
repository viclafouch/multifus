/** Moving things around in a list, with no word of the domain in it. */

type MovedParams = {
  readonly list: readonly string[]
  readonly item: string
  readonly delta: number
}

/** The same list with one item moved, or `null` when it cannot move. */
export const moved = ({
  list,
  item,
  delta
}: MovedParams): readonly string[] | null => {
  const from = list.indexOf(item)
  const to = from + delta

  if (from === -1 || to < 0 || to >= list.length || delta === 0) {
    return null
  }

  const without = list.filter((_, index) => {
    return index !== from
  })

  return [...without.slice(0, to), item, ...without.slice(to)]
}
