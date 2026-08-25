type MovedParams = {
  readonly list: readonly string[]
  readonly item: string
  readonly delta: number
}

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
