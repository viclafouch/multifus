import React from 'react'
import { t } from '@lingui/core/macro'
import type { EditorEvents, JSONContent } from '@tiptap/core'
import { useEditor } from '@tiptap/react'
import { writeNote } from '@/lib/multifus'
import { noteExtensions } from '@/lib/note'
import { ignore } from '@/lib/utils'

const handleUpdate = ({ editor }: EditorEvents['update']) => {
  writeNote(editor.getJSON()).catch(ignore)
}

export const useNoteEditor = (written: JSONContent | null) => {
  const editor = useEditor({
    extensions: noteExtensions(t`Notez ici ce que vous ne voulez pas oublier.`),
    content: written,
    autofocus: 'end',
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': t({
          message: 'Note',
          comment: 'Accessible name of the text area where the player writes'
        }),
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off'
      }
    },
    onUpdate: handleUpdate
  })

  React.useEffect(() => {
    const handleFocus = () => {
      editor.commands.focus()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [editor])

  return editor
}
