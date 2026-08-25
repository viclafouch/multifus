import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
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
          <li
            key={character.nickname}
            data-offline={character.online ? undefined : ''}
            className="flex items-center gap-4 border-b border-border/70 px-4 py-3 last:border-b-0 data-offline:dimmed"
          >
            <p className="selectable min-w-0 flex-1 truncate text-row font-medium">
              {character.nickname}
            </p>
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
