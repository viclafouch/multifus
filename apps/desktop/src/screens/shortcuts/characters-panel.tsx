import { t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import type { Binding, QuickReply } from '@/@types/shortcuts'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { IS_APPLE } from '@/constants/keyboard'
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
  return (
    <Panel className="mt-6">
      <PanelHeader
        title={t`Un personnage, une touche`}
        description={
          IS_APPLE
            ? t`Ctrl+Maj+1 sur l’Eniripsa, Ctrl+Maj+2 sur le Sacrieur : sa fenêtre passe devant, d’où que vous veniez dans le jeu.`
            : t`F1 sur l’Eniripsa, F2 sur le Sacrieur : sa fenêtre passe devant, d’où que vous veniez dans le jeu.`
        }
      />
      {characters.length === 0 ? (
        <p className="px-4 py-5 text-note text-muted-foreground">
          {t`Entrez en jeu, et vos personnages se posent ici tout seuls.`}
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
