import { Plus } from 'lucide-react'
import { KeyCap } from '@/components/key-cap'
import { EmptyState } from '@/components/layout/empty-state'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { acceleratorParts } from '@/helpers/accelerator'

const EXAMPLE_ACCELERATOR = 'Control+Alt+KeyB'

type EmptyRepliesProps = Readonly<{
  handleAdd: () => void
}>

export const EmptyReplies = ({ handleAdd }: EmptyRepliesProps) => {
  const words = strings.quickReplies

  return (
    <EmptyState
      title={words.emptyTitle}
      body={words.emptyBody}
      mark={<ReplyMark />}
    >
      <Button variant="secondary" size="sm" onClick={handleAdd}>
        <Plus aria-hidden />
        {words.add}
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
      <span className="font-display text-row">
        {strings.quickReplies.example}
      </span>
    </span>
  )
}
