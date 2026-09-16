import { t } from '@lingui/core/macro'
import { Panel } from '@multifus/retro'
import type { Character } from '@/@types/roster'
import type { Binding, QuickText } from '@/@types/shortcuts'
import { PanelHeader } from '@/components/layout/panel-header'
import { IS_APPLE } from '@/constants/keyboard'
import { characterShortcutStatusLine } from '@/helpers/wording'
import type { CharacterShortcutActions } from '@/screens/shortcuts/character-shortcut-row'
import { CharacterShortcutRow } from '@/screens/shortcuts/character-shortcut-row'

type CharactersPanelProps = Readonly<{
  characters: readonly Character[]
  quickTexts: readonly QuickText[]
  editing: Binding | null
  actions: CharacterShortcutActions
}>

export const CharactersPanel = ({
  characters,
  quickTexts,
  editing,
  actions
}: CharactersPanelProps) => {
  return (
    <Panel>
      <PanelHeader
        title={t`Un personnage, une touche`}
        description={
          IS_APPLE
            ? t`Ctrl+Maj+1 sur l’Eniripsa, Ctrl+Maj+2 sur le Sacrieur : il passe devant, d’où que vous veniez dans le jeu.`
            : t`F1 sur l’Eniripsa, F2 sur le Sacrieur : il passe devant, d’où que vous veniez dans le jeu.`
        }
      />
      {characters.length === 0 ? (
        <p className="px-4 py-5 text-aside text-muted-foreground">
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
                  quickTexts
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
