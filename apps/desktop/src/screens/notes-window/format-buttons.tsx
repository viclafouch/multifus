import type React from 'react'
import { Bold, List } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { BOLD_KEYS } from '@/constants/notes'
import { acceleratorParts, keyLabel } from '@/helpers/accelerator'

type FormatButtonsProps = Readonly<{
  editor: Editor
}>

const handlePointerDown = (event: React.PointerEvent) => {
  event.preventDefault()
  event.stopPropagation()
}

const BOLD_KEY_LABELS = acceleratorParts(BOLD_KEYS)
  .map((token) => {
    return keyLabel(token)
  })
  .join(' ')

export const FormatButtons = ({ editor }: FormatButtonsProps) => {
  const worn = useEditorState({
    editor,
    selector: ({ editor: watched }) => {
      return {
        isBold: watched.isActive('bold'),
        isList: watched.isActive('bulletList')
      }
    }
  })

  const keys = BOLD_KEY_LABELS

  const handleBold = () => {
    editor.chain().focus().toggleBold().run()
  }

  const handleList = () => {
    editor.chain().focus().toggleBulletList().run()
  }

  return (
    <>
      <Button
        variant="bare"
        size="icon-tight"
        aria-pressed={worn.isBold}
        aria-label={t({
          message: 'Gras',
          comment: 'Button in the bar of the notes that makes the text bold'
        })}
        title={t({
          message: `Gras (${keys})`,
          comment: 'Tooltip of the bold button, with the keys that do the same'
        })}
        className="notes-format"
        onPointerDown={handlePointerDown}
        onClick={handleBold}
      >
        <Bold aria-hidden strokeWidth={2.5} />
      </Button>
      <Button
        variant="bare"
        size="icon-tight"
        aria-pressed={worn.isList}
        aria-label={t({
          message: 'Liste',
          comment: 'Button in the bar of the notes that makes a bulleted list'
        })}
        title={t`Liste (un tiret puis une espace)`}
        className="notes-format"
        onPointerDown={handlePointerDown}
        onClick={handleList}
      >
        <List aria-hidden strokeWidth={2} />
      </Button>
    </>
  )
}
