import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { Button, Panel } from '@multifus/retro'
import type { QuickText } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { MAP_NAMES } from '@/constants/world'
import { shortcutStatusLine } from '@/helpers/wording'
import { useShortcutEditing } from '@/hooks/use-shortcut-editing'
import {
  addQuickText,
  removeQuickText,
  setQuickTextShortcut,
  setQuickTextText
} from '@/lib/multifus'
import { EmptyTexts } from '@/screens/quick-texts/empty-texts'
import type { TextRowActions } from '@/screens/quick-texts/text-row'
import { TextRow } from '@/screens/quick-texts/text-row'

type QuickTextsScreenProps = Readonly<{
  quickTexts: readonly QuickText[]
  run: (action: Promise<Snapshot>) => void
}>

export const QuickTextsScreen = ({
  quickTexts,
  run
}: QuickTextsScreenProps) => {
  const editing = useShortcutEditing()

  const handleAdd = () => {
    run(addQuickText())
  }

  const actions: TextRowActions = {
    handleText: (id, text) => {
      run(setQuickTextText(id, text))
    },
    handleShortcut: (id, accelerator) => {
      editing.close()
      run(setQuickTextShortcut(id, accelerator))
    },
    handleRemove: (id) => {
      run(removeQuickText(id))
    },
    handleOpen: (id) => {
      editing.open({ kind: 'quickText', id })
    },
    handleClose: editing.close
  }

  return (
    <Screen
      title={i18n._(MAP_NAMES.quickTexts)}
      subtitle={t`Les phrases que vous retapez tous les soirs, rangées sous une touche. Multifus les colle dans le jeu.`}
    >
      {quickTexts.length === 0 ? (
        <EmptyTexts handleAdd={handleAdd} />
      ) : (
        <Panel>
          <ul>
            {quickTexts.map((quickText, index) => {
              return (
                <TextRow
                  key={quickText.id}
                  quickText={quickText}
                  rank={index + 1}
                  statusLine={shortcutStatusLine(quickText.status, quickTexts)}
                  editing={editing.binding}
                  actions={actions}
                />
              )
            })}
          </ul>
          <div className="flex justify-center border-t border-band/25 px-4 py-3">
            <Button variant="slate" size="sm" onClick={handleAdd}>
              {t`Ajouter un texte`}
            </Button>
          </div>
        </Panel>
      )}
      <Note>{t`Multifus colle, c’est vous qui appuyez sur Entrée. Le temps du collage, il emprunte votre presse-papiers, puis vous le rend.`}</Note>
    </Screen>
  )
}
