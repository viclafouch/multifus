import type { Character, Color } from '@/@types/roster'

export type ColorHolders = Readonly<Partial<Record<Color, readonly string[]>>>

export const colorHolders = (
  characters: readonly Character[]
): ColorHolders => {
  const holders: Partial<Record<Color, readonly string[]>> = {}

  for (const character of characters) {
    if (character.color !== null) {
      holders[character.color] = [
        ...(holders[character.color] ?? []),
        character.nickname
      ]
    }
  }

  return holders
}

type HolderOfParams = Readonly<{
  color: Color
  besides: string
}>

export const holderOf = (
  holders: ColorHolders,
  { color, besides }: HolderOfParams
) => {
  const named = holders[color] ?? []

  return (
    named.find((nickname) => {
      return nickname !== besides
    }) ?? null
  )
}
