import { t } from '@lingui/core/macro'
import type { KeyLabels } from '@/@types/system'
import { KeyLabelsProvider } from '@/components/key-labels-provider'
import { ShortcutRecall } from '@/components/shortcut-recall'

type NotesFootProps = Readonly<{
  accelerator: string | null
  labels: KeyLabels
}>

export const NotesFoot = ({ accelerator, labels }: NotesFootProps) => {
  return (
    <footer className="notes-foot">
      <KeyLabelsProvider labels={labels}>
        {accelerator === null ? null : (
          <ShortcutRecall
            accelerator={accelerator}
            mention={t`ouvrir, fermer`}
          />
        )}
        <span className="notes-escape">
          <ShortcutRecall
            accelerator="Escape"
            mention={t({
              message: 'fermer',
              comment: 'Footer hint of the notes: Escape closes them'
            })}
          />
        </span>
      </KeyLabelsProvider>
    </footer>
  )
}
