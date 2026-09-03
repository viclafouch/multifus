import { t } from '@lingui/core/macro'
import { KeyCap } from '@/components/key-cap'
import { acceleratorParts } from '@/helpers/accelerator'

type ShortcutRecallProps = Readonly<{
  accelerator: string | null
  mention?: string
}>

export const ShortcutRecall = ({
  accelerator,
  mention
}: ShortcutRecallProps) => {
  if (accelerator === null) {
    return <span className="text-note text-muted-foreground">{t`Aucune`}</span>
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-center gap-1">
        {acceleratorParts(accelerator).map((token) => {
          return <KeyCap key={token} token={token} />
        })}
      </span>
      {mention === undefined ? null : (
        <span className="text-mini text-muted-foreground/80">{mention}</span>
      )}
    </span>
  )
}
