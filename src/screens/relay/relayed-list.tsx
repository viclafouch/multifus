import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { CharacterMedallion } from '@/components/character-medallion'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { portraitFor } from '@/helpers/portrait'
import { characterPresence, characterPresenceSubLine } from '@/helpers/wording'
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
          <li
            key={character.nickname}
            data-offline={character.online ? undefined : ''}
            className="group flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0 data-offline:dimmed"
          >
            <CharacterMedallion
              nickname={character.nickname}
              portrait={portraitFor(character)}
              state={characterPresence(character)}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="selectable truncate text-row font-medium group-data-offline:text-muted-foreground">
                {character.nickname}
              </p>
              <p className="text-micro font-medium tracking-micro text-muted-foreground/65 uppercase">
                {characterPresenceSubLine(character)}
              </p>
            </div>
            <Switch
              checked={character.relayed}
              aria-label={strings.relay.characterToggle(character.nickname)}
              onCheckedChange={(relayed) => {
                run(setRelayed(character.nickname, relayed))
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}
