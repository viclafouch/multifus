import { Plus } from 'lucide-react'
import type { QuickReply } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
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
  const words = strings.quickReplies

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
    <Screen title={words.title} subtitle={words.subtitle}>
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
          <Button
            variant="ghost"
            onClick={handleAdd}
            className="h-11 w-full justify-start gap-2 rounded-none rounded-b-xl border-t border-border/70 px-4 text-note font-normal text-muted-foreground"
          >
            <Plus aria-hidden />
            {words.add}
          </Button>
        </Panel>
      )}
      <Note className="mt-4">{words.clipboard}</Note>
    </Screen>
  )
}
