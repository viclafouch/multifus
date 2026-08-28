import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { CharacterLine } from '@/components/character-line'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { setRelayed } from '@/lib/multifus'

type RelayedListProps = Readonly<{
  characters: readonly Character[]
  run: (action: Promise<Snapshot>) => void
}>

export const RelayedList = ({ characters, run }: RelayedListProps) => {
  return (
    <ul className="flex flex-col">
      {characters.map((character) => {
        return (
          <CharacterLine key={character.nickname} character={character}>
            <Switch
              checked={character.relayed}
              aria-label={strings.relay.characterToggle(character.nickname)}
              onCheckedChange={(relayed) => {
                run(setRelayed(character.nickname, relayed))
              }}
            />
          </CharacterLine>
        )
      })}
    </ul>
  )
}
