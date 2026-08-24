import { Plus } from 'lucide-react'
import type { Binding, QuickReply } from '@/@types/shortcuts'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { SectionRow } from '@/components/layout/section-row'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { shortcutStatusLine } from '@/helpers/wording'
import type { QuickReplyRowActions } from '@/screens/shortcuts/quick-reply-row'
import { QuickReplyRow } from '@/screens/shortcuts/quick-reply-row'

type QuickRepliesPanelProps = Readonly<{
  quickReplies: readonly QuickReply[]
  /** The one capture in flight for the whole screen, `null` when there is none.
   * It can belong to an action, which is why it is a `Binding` and not an id. */
  editing: Binding | null
  handleAdd: () => void
  actions: QuickReplyRowActions
}>

/**
 * The second panel of this screen: a ready-made line, filed under a combination.
 * No `EmptyState` when there is none, that component replaces a whole screen.
 */
export const QuickRepliesPanel = ({
  quickReplies,
  editing,
  handleAdd,
  actions
}: QuickRepliesPanelProps) => {
  const words = strings.shortcuts.quickReplies

  return (
    <>
      <Panel className="mt-5">
        <SectionRow title={words.title} description={words.description}>
          <Button variant="secondary" size="sm" onClick={handleAdd}>
            <Plus aria-hidden />
            {words.add}
          </Button>
        </SectionRow>
        {quickReplies.length === 0 ? (
          <p className="border-t border-border/70 px-4 py-3.5 text-note text-muted-foreground/70">
            {words.empty}
          </p>
        ) : (
          <ul className="border-t border-border/70">
            {quickReplies.map((quickReply) => {
              return (
                <QuickReplyRow
                  key={quickReply.id}
                  quickReply={quickReply}
                  statusLine={shortcutStatusLine(
                    quickReply.status,
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
      <Note>{words.clipboard}</Note>
    </>
  )
}
