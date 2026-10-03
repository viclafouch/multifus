import React from 'react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import logo from '@multifus/retro/assets/logo.svg'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { JSONContent } from '@tiptap/core'
import { EditorContent } from '@tiptap/react'
import { CloseButton } from '@/components/close-button'
import { NOTES_NAME } from '@/constants/notes'
import { acceleratorOf } from '@/helpers/accelerator'
import { useEscape } from '@/hooks/use-escape'
import { useMultifus } from '@/hooks/use-multifus'
import { useNoteEditor } from '@/hooks/use-note-editor'
import { usePointerAway } from '@/hooks/use-pointer-away'
import { closeNotes, notesTakeKeyboard } from '@/lib/multifus'
import { ignore } from '@/lib/utils'
import { FormatButtons } from '@/screens/notes-window/format-buttons'
import { NotesFoot } from '@/screens/notes-window/notes-foot'

type NotesWindowProps = Readonly<{
  written: Promise<JSONContent | null>
}>

const handleNotePointerDown = (event: React.PointerEvent) => {
  if (event.target === event.currentTarget) {
    return
  }

  notesTakeKeyboard().catch(ignore)
}

const handleBarPointerDown = (event: React.PointerEvent) => {
  if (event.button !== 0) {
    return
  }

  getCurrentWindow().startDragging().catch(ignore)
}

export const NotesWindow = ({ written }: NotesWindowProps) => {
  const editor = useNoteEditor(React.use(written))
  const { snapshot } = useMultifus()
  const pointer = usePointerAway()

  const handleClose = () => {
    pointer.leave()
    closeNotes().catch(ignore)
  }

  useEscape(true, handleClose)

  const handleClear = () => {
    editor.chain().clearContent().focus().run()
  }

  return (
    <main className="notes" data-pointer-away={pointer.isAway}>
      <header className="notes-crown">
        <div className="notes-handle" onPointerDown={handleBarPointerDown}>
          <img src={logo} alt="Multifus" className="notes-mark" />
          <h1 className="notes-title">{i18n._(NOTES_NAME)}</h1>
        </div>
        <FormatButtons editor={editor} />
        <Button
          variant="bare"
          size="tight"
          className="text-muted-foreground text-shadow-none hover:bg-foreground/8 hover:text-foreground"
          onClick={handleClear}
        >
          {t({
            message: 'Vider',
            comment: 'Button in the bar of the notes that erases the whole note'
          })}
        </Button>
        <CloseButton label={t`Fermer les notes`} onClick={handleClose} />
      </header>
      <EditorContent
        editor={editor}
        className="notes-paper"
        onPointerDown={handleNotePointerDown}
      />
      <NotesFoot
        accelerator={acceleratorOf(snapshot?.shortcuts ?? [], 'notes')}
        labels={snapshot?.keyboard ?? {}}
      />
    </main>
  )
}
