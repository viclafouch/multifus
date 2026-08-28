import type { Character } from '@/@types/roster'
import type { Binding, QuickReply } from '@/@types/shortcuts'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { strings } from '@/constants/strings'
import { characterShortcutStatusLine } from '@/helpers/wording'
import type { CharacterShortcutActions } from '@/screens/shortcuts/character-shortcut-row'
import { CharacterShortcutRow } from '@/screens/shortcuts/character-shortcut-row'

type CharactersPanelProps = Readonly<{
  characters: readonly Character[]
  quickReplies: readonly QuickReply[]
  editing: Binding | null
  actions: CharacterShortcutActions
}>

export const CharactersPanel = ({
  characters,
  quickReplies,
  editing,
  actions
}: CharactersPanelProps) => {
  const words = strings.shortcuts

  return (
    <Panel className="mt-6">
      <PanelHeader
        title={words.charactersTitle}
        description={words.charactersDescription}
      />
      {characters.length === 0 ? (
        <p className="px-4 py-5 text-note text-muted-foreground">
          {words.charactersEmpty}
        </p>
      ) : (
        <ul className="flex flex-col">
          {characters.map((character) => {
            return (
              <CharacterShortcutRow
                key={character.nickname}
                character={character}
                statusLine={characterShortcutStatusLine(
                  character.shortcutStatus,
                  quickReplies
                )}
                editing={editing}
                actions={actions}
              />
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
