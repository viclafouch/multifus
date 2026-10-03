import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearMocks, mockIPC, mockWindows } from '@tauri-apps/api/mocks'
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { JSONContent, TiptapEditorHTMLElement } from '@tiptap/core'
import { keyCapsOf, pending, snapshotOf } from '@/test-doubles'

const bridge = {
  snapshot: vi.fn(async () => {
    return snapshotOf({
      shortcuts: [
        {
          action: 'notes',
          accelerator: 'Control+Shift+KeyN',
          status: { kind: 'registered' },
          isDefault: true
        }
      ]
    })
  }),
  onSnapshot: vi.fn(async () => {
    return () => {}
  }),
  writeNote: vi.fn(pending),
  closeNotes: vi.fn(pending),
  notesTakeKeyboard: vi.fn(pending)
}

const asked: string[] = []

Range.prototype.getClientRects = function getClientRects() {
  return document.body.getClientRects()
}

Range.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return new DOMRect()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { NotesWindow } = await import('@/screens/notes-window')

const A_NOTE = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Hdv' },
        { type: 'text', text: ' : 12 000 k la Gelano' }
      ]
    }
  ]
} as const satisfies JSONContent

const show = async (written: JSONContent | null) => {
  await act(async () => {
    render(
      <React.Suspense>
        <NotesWindow written={Promise.resolve(written)} />
      </React.Suspense>
    )
  })

  return screen.getByRole<TiptapEditorHTMLElement>('textbox', {
    name: 'Note'
  })
}

const editorOf = (writing: TiptapEditorHTMLElement) => {
  const { editor } = writing

  if (editor === undefined) {
    throw new Error('the writing carries no editor')
  }

  return editor
}

const paperOf = (writing: TiptapEditorHTMLElement) => {
  const paper = writing.parentElement

  if (paper === null) {
    throw new Error('the note is laid on no paper')
  }

  return paper
}

describe('the notes laid over the game', () => {
  beforeEach(() => {
    asked.length = 0
    mockWindows('notes')
    mockIPC((command) => {
      asked.push(command)

      return null
    })
  })

  afterEach(() => {
    clearMocks()
  })

  it('opens on the note Rust kept, and does not write it back for having read it', async () => {
    const writing = await show(A_NOTE)

    expect(writing.textContent).toBe('Hdv : 12 000 k la Gelano')
    expect(writing.querySelector('strong')?.textContent).toBe('Hdv')
    expect(bridge.writeNote).not.toHaveBeenCalled()
  })

  it('invites the player to write while the note is empty', async () => {
    const writing = await show(null)

    expect(
      writing
        .querySelector('[data-placeholder]')
        ?.getAttribute('data-placeholder')
    ).toBe('Notez ici ce que vous ne voulez pas oublier.')
  })

  it('empties the note in one click, and the undo brings it back', async () => {
    const writing = await show(A_NOTE)

    fireEvent.click(screen.getByRole('button', { name: 'Vider' }))

    expect(writing.textContent).toBe('')
    expect(bridge.writeNote).toHaveBeenLastCalledWith({
      type: 'doc',
      content: [{ type: 'paragraph' }]
    })

    act(() => {
      editorOf(writing).commands.undo()
    })

    expect(writing.textContent).toBe('Hdv : 12 000 k la Gelano')
    expect(bridge.writeNote).toHaveBeenLastCalledWith(A_NOTE)
  })

  it('asks for the keyboard on a press in the note, and nowhere else', async () => {
    const writing = await show(A_NOTE)

    fireEvent.pointerDown(screen.getByRole('heading', { name: 'Notes' }), {
      button: 0
    })

    expect(asked).toStrictEqual(['plugin:window|start_dragging'])

    fireEvent.pointerDown(paperOf(writing), { button: 0 })

    expect(
      bridge.notesTakeKeyboard,
      'a press on the scroll bar scrolls, the keyboard stays where it was'
    ).not.toHaveBeenCalled()

    fireEvent.pointerDown(writing, { button: 0 })

    expect(bridge.notesTakeKeyboard).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape, and on its cross', async () => {
    await show(A_NOTE)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(bridge.closeNotes).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Fermer les notes' }))

    expect(bridge.closeNotes).toHaveBeenCalledTimes(2)
  })

  it('reminds, at its foot, the keys that open and close it', async () => {
    await show(A_NOTE)

    expect(keyCapsOf(await screen.findByRole('contentinfo'))).toStrictEqual([
      'Ctrl',
      'Maj',
      'N',
      'Échap'
    ])
  })

  it('keeps the hover of its buttons off from the moment it hides until the pointer moves again', async () => {
    await show(A_NOTE)

    const notes = screen.getByRole('main')

    fireEvent.click(screen.getByRole('button', { name: 'Fermer les notes' }))

    expect(notes.dataset.pointerAway).toBe('true')

    fireEvent.pointerMove(document)

    expect(notes.dataset.pointerAway).toBe('false')
  })

  it('keeps Tab in the note, where it nests a bullet and nothing else', async () => {
    const writing = await show(A_NOTE)

    expect(
      fireEvent.keyDown(writing, { key: 'Tab' }),
      'Tab let through would carry the focus to « Vider », one Enter away from an empty note'
    ).toBe(false)
    expect(writing.textContent).toBe('Hdv : 12 000 k la Gelano')
  })

  it('shows bold and lists in its bar, and lights the one the caret stands in', async () => {
    const writing = await show(A_NOTE)
    const list = screen.getByRole('button', { name: 'Liste' })

    expect(list.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(list)

    expect(writing.querySelector('ul')?.textContent).toBe(
      'Hdv : 12 000 k la Gelano'
    )
    expect(list.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Gras' })).not.toBeNull()
  })
})
