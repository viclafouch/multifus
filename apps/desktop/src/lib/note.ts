import { Extension } from '@tiptap/core'
import { Bold } from '@tiptap/extension-bold'
import { Document } from '@tiptap/extension-document'
import { BulletList, ListItem, ListKeymap } from '@tiptap/extension-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { Placeholder, UndoRedo } from '@tiptap/extensions'

const LAST_SAY = 1

const TabInTheNote = Extension.create({
  name: 'tabInTheNote',
  priority: LAST_SAY,
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return true
      },
      'Shift-Tab': () => {
        return true
      }
    }
  }
})

export const noteExtensions = (placeholder: string) => {
  return [
    Document,
    Paragraph,
    Text,
    Bold,
    BulletList,
    ListItem,
    ListKeymap,
    UndoRedo,
    TabInTheNote,
    Placeholder.configure({ placeholder })
  ]
}
