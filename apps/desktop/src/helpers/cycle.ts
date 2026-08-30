import type { Character, Gender } from '@/@types/roster'

export const nicknamesOf = (characters: readonly Character[]) => {
  return characters.map((character) => {
    return character.nickname
  })
}

export const matchIsInCycle = (character: Character) => {
  return character.online && !character.excluded
}

type GenderGroupParams = {
  readonly characters: readonly Character[]
  readonly gender: Gender
}

export const genderGroupOf = ({ characters, gender }: GenderGroupParams) => {
  const connected = characters.filter((character) => {
    return character.online && character.gender === gender
  })

  return {
    isEmpty: connected.length === 0,
    isIncluded: connected.some(matchIsInCycle)
  }
}

export const genderlessNicknames = (characters: readonly Character[]) => {
  const genderless = characters.filter((character) => {
    return character.online && character.gender === null
  })

  return nicknamesOf(genderless)
}

type ArrangeParams = {
  readonly characters: readonly Character[]
  readonly order: readonly string[] | null
}

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

type MatchIsArrangedParams = {
  readonly characters: readonly Character[]
  readonly order: readonly string[] | null
}

export const matchIsArranged = ({
  characters,
  order
}: MatchIsArrangedParams) => {
  if (order === null) {
    return true
  }

  const known = nicknamesOf(characters)

  const wanted = order.filter((nickname) => {
    return known.includes(nickname)
  })

  const actual = known.filter((nickname) => {
    return order.includes(nickname)
  })

  return wanted.every((nickname, index) => {
    return nickname === actual[index]
  })
}
