import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { Button, Panel } from '@multifus/retro'
import type { QuickReply } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { MAP_NAMES } from '@/constants/world'
import { shortcutStatusLine } from '@/helpers/wording'
import { useShortcutEditing } from '@/hooks/use-shortcut-editing'
import {
  addQuickReply,
  removeQuickReply,
  setQuickReplyShortcut,
  setQuickReplyText
} from '@/lib/multifus'
import { EmptyReplies } from '@/screens/quick-replies/empty-replies'
import type { ReplyRowActions } from '@/screens/quick-replies/reply-row'
import { ReplyRow } from '@/screens/quick-replies/reply-row'

type QuickRepliesScreenProps = Readonly<{
  quickReplies: readonly QuickReply[]
  run: (action: Promise<Snapshot>) => void
}>

export const QuickRepliesScreen = ({
  quickReplies,
  run
}: QuickRepliesScreenProps) => {
  const editing = useShortcutEditing()

  const handleAdd = () => {
    run(addQuickReply())
  }

  const actions: ReplyRowActions = {
    handleText: (id, text) => {
      run(setQuickReplyText(id, text))
    },
    handleShortcut: (id, accelerator) => {
      editing.close()
      run(setQuickReplyShortcut(id, accelerator))
    },
    handleRemove: (id) => {
      run(removeQuickReply(id))
    },
    handleOpen: (id) => {
      editing.open({ kind: 'quickReply', id })
    },
    handleClose: editing.close
  }

  return (
    <Screen
      title={i18n._(MAP_NAMES.quickReplies)}
      subtitle={t`Les phrases que vous retapez tous les soirs, rangées sous une touche. Multifus les colle dans le jeu.`}
    >
      {quickReplies.length === 0 ? (
        <EmptyReplies handleAdd={handleAdd} />
      ) : (
        <Panel>
          <ul>
            {quickReplies.map((quickReply, index) => {
              return (
                <ReplyRow
                  key={quickReply.id}
                  quickReply={quickReply}
                  rank={index + 1}
                  statusLine={shortcutStatusLine(
                    quickReply.status,
                    quickReplies
                  )}
                  editing={editing.binding}
                  actions={actions}
                />
              )
            })}
          </ul>
          <div className="flex justify-center border-t border-band/25 px-4 py-3">
            <Button variant="slate" size="sm" onClick={handleAdd}>
              {t`Ajouter une réponse`}
            </Button>
          </div>
        </Panel>
      )}
      <Note>{t`Multifus colle, c’est vous qui appuyez sur Entrée. Le temps du collage, il emprunte votre presse-papiers, puis vous le rend.`}</Note>
    </Screen>
  )
}
