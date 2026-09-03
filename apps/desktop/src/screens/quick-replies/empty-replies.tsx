import { Plus } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { KeyCap } from '@/components/key-cap'
import { EmptyState } from '@/components/layout/empty-state'
import { Button } from '@/components/ui/button'
import { acceleratorParts } from '@/helpers/accelerator'

const EXAMPLE_ACCELERATOR = 'Control+Alt+KeyB'

type EmptyRepliesProps = Readonly<{
  handleAdd: () => void
}>

export const EmptyReplies = ({ handleAdd }: EmptyRepliesProps) => {
  return (
    <EmptyState
      title={t`Aucune réponse rangée`}
      body={t`Une réponse, des touches, et vous ne la retapez plus de la soirée.`}
      mark={<ReplyMark />}
    >
      <Button variant="secondary" size="sm" onClick={handleAdd}>
        <Plus aria-hidden />
        {t`Ajouter une réponse`}
      </Button>
    </EmptyState>
  )
}

const ReplyMark = () => {
  return (
    <span aria-hidden className="dimmed mb-2 flex items-center gap-4">
      <span className="flex items-center gap-1">
        {acceleratorParts(EXAMPLE_ACCELERATOR).map((part) => {
          return <KeyCap key={part} token={part} />
        })}
      </span>
      <span className="font-display text-row">{t`Bon jeu à toi !`}</span>
    </span>
  )
}
