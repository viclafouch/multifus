import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { QuickReply } from '@/@types/shortcuts'
import { quickReplyEditLabel } from '@/helpers/wording'
import { keyCapsOf, pending, quickReplyOf, strike } from '@/test-doubles'

const bridge = {
  addQuickReply: vi.fn(),
  setQuickReplyText: vi.fn(),
  setQuickReplyShortcut: vi.fn(),
  removeQuickReply: vi.fn(),
  suspendShortcuts: vi.fn(pending),
  resumeShortcuts: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { QuickRepliesScreen } = await import('@/screens/quick-replies')

const words = {
  add: 'Ajouter une réponse',
  example: 'Bon jeu à toi !',
  textLabel: 'Texte de la réponse',
  remove: 'Retirer cette réponse',
  blank: 'Sans texte, il n’y aura rien à coller.',
  emptyTitle: 'Aucune réponse rangée',
  emptyBody:
    'Une réponse, des touches, et vous ne la retapez plus de la soirée.',
  clipboard:
    'Multifus colle, c’est vous qui appuyez sur Entrée. Le temps du collage, il emprunte votre presse-papiers, puis vous le rend.'
}

const show = (quickReplies: readonly QuickReply[] = []) => {
  render(<QuickRepliesScreen quickReplies={quickReplies} run={() => {}} />)
}

const addButton = () => {
  return screen.getByRole('button', { name: words.add })
}

const fieldOf = (reply: QuickReply, rank = 1) => {
  return screen.getByRole('button', {
    name: quickReplyEditLabel(reply, rank)
  })
}

const textFieldOf = (index: number) => {
  return screen.getAllByLabelText<HTMLInputElement>(words.textLabel)[index]
}

describe('the quick replies screen, when there is none', () => {
  it('invites to keep a first sentence', () => {
    show()

    expect(screen.getByText(words.emptyTitle)).not.toBeNull()
    expect(screen.getByText(words.emptyBody)).not.toBeNull()
  })

  it('adds one on request', () => {
    show()

    fireEvent.click(addButton())

    expect(bridge.addQuickReply).toHaveBeenCalledWith()
  })
})

describe('the quick replies screen, the list', () => {
  it('carries the text of each reply', () => {
    show([
      quickReplyOf({ id: 1, text: 'Je vends, mp moi' }),
      quickReplyOf({ id: 2, text: 'En combat, j’arrive' })
    ])

    const texts = screen
      .getAllByLabelText<HTMLInputElement>(words.textLabel)
      .map((field) => {
        return field.value
      })

    expect(texts).toStrictEqual(['Je vends, mp moi', 'En combat, j’arrive'])
  })

  it('draws the keys kept under each reply', () => {
    const bound = quickReplyOf({
      id: 1,
      text: 'Bon jeu à toi !',
      accelerator: 'Control+Alt+KeyB',
      status: { kind: 'registered' }
    })

    show([bound])

    expect(keyCapsOf(fieldOf(bound))).toStrictEqual(['Ctrl', 'Alt', 'B'])
  })

  it('gives a different name to the keys of two replies', () => {
    show([
      quickReplyOf({ id: 1, text: 'Je vends, mp moi' }),
      quickReplyOf({ id: 2, text: 'En combat, j’arrive' })
    ])

    expect(
      screen.getByRole('button', {
        name: 'Modifier les touches de la réponse 1, « Je vends, mp moi »'
      })
    ).not.toBeNull()
    expect(
      screen.getByRole('button', {
        name: 'Modifier les touches de la réponse 2, « En combat, j’arrive »'
      })
    ).not.toBeNull()
  })

  it('gives a different name to the keys of two empty replies', () => {
    const first = quickReplyOf({ id: 1, text: '' })
    const second = quickReplyOf({ id: 2, text: '' })

    show([first, second])

    expect(fieldOf(first)).not.toBe(fieldOf(second, 2))
  })

  it('adds one from the bottom of the list', () => {
    show([quickReplyOf({ id: 1 })])

    fireEvent.click(addButton())

    expect(bridge.addQuickReply).toHaveBeenCalledWith()
  })

  it('removes one on request', () => {
    show([quickReplyOf({ id: 4 })])

    fireEvent.click(screen.getByRole('button', { name: words.remove }))

    expect(bridge.removeQuickReply).toHaveBeenCalledWith(4)
  })
})

describe('the quick replies screen, the text', () => {
  it('keeps the typed text, and sends it only once the row is left', () => {
    show([quickReplyOf({ id: 1, text: '' })])

    const field = textFieldOf(0)

    fireEvent.change(field, { target: { value: 'Je suis en combat' } })

    expect(bridge.setQuickReplyText).not.toHaveBeenCalled()

    fireEvent.blur(field)

    expect(bridge.setQuickReplyText).toHaveBeenCalledWith(
      1,
      'Je suis en combat'
    )
  })

  it('trims the spaces around the text', () => {
    show([quickReplyOf({ id: 1, text: '' })])

    fireEvent.change(textFieldOf(0), { target: { value: '  Bonjour  ' } })
    fireEvent.blur(textFieldOf(0))

    expect(bridge.setQuickReplyText).toHaveBeenCalledWith(1, 'Bonjour')
  })

  it('sends nothing when the text has not moved', () => {
    show([quickReplyOf({ id: 1, text: 'Bonjour' })])

    fireEvent.blur(textFieldOf(0))

    expect(bridge.setQuickReplyText).not.toHaveBeenCalled()
  })

  it('validates the text on Enter', () => {
    show([quickReplyOf({ id: 1, text: '' })])

    const field = textFieldOf(0)

    field.focus()
    fireEvent.change(field, { target: { value: 'Bonjour' } })
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter' })

    expect(bridge.setQuickReplyText).toHaveBeenCalledWith(1, 'Bonjour')
  })

  it('gives the previous text back on Escape', () => {
    show([quickReplyOf({ id: 1, text: 'Bonjour' })])

    const field = textFieldOf(0)

    fireEvent.change(field, { target: { value: 'Autre chose' } })
    fireEvent.keyDown(field, { key: 'Escape', code: 'Escape' })

    expect(field.value).toBe('Bonjour')
    expect(bridge.setQuickReplyText).not.toHaveBeenCalled()
  })

  it('says a reply without text has nothing to paste', () => {
    show([quickReplyOf({ id: 1, text: '' })])

    expect(screen.getByText(words.blank)).not.toBeNull()

    fireEvent.change(textFieldOf(0), { target: { value: 'Bonjour' } })

    expect(screen.queryByText(words.blank)).toBeNull()
  })
})

describe('the quick replies screen, the keys', () => {
  it('keeps a reply under the keys that were hit', () => {
    const blank = quickReplyOf({ id: 4, text: '' })

    show([blank])

    fireEvent.click(fieldOf(blank))
    strike(fieldOf(blank), { code: 'KeyB', ctrlKey: true, altKey: true })

    expect(bridge.setQuickReplyShortcut).toHaveBeenCalledWith(
      4,
      'Control+Alt+KeyB'
    )
  })

  it('opens the capture only on the clicked row', () => {
    const first = quickReplyOf({ id: 1, text: 'Je vends, mp moi' })
    const second = quickReplyOf({ id: 2, text: 'En combat, j’arrive' })

    show([first, second])

    fireEvent.click(fieldOf(first))
    fireEvent.click(fieldOf(second, 2))

    expect(screen.getAllByText('Appuyez sur vos touches')).toHaveLength(1)
    expect(
      within(fieldOf(second, 2)).getByText('Appuyez sur vos touches')
    ).not.toBeNull()
  })

  it('says nothing will happen without keys', () => {
    show([quickReplyOf({ id: 1 })])

    expect(
      screen.getByText('Sans touches, il ne se passera rien.')
    ).not.toBeNull()
  })

  it('names the action that already holds the same keys', () => {
    show([
      quickReplyOf({
        id: 1,
        accelerator: 'Control+Right',
        status: {
          kind: 'duplicate',
          binding: { kind: 'action', action: 'next' }
        }
      })
    ])

    expect(screen.getByRole('alert').textContent).toBe(
      'Déjà pris par « Personnage suivant ».'
    )
  })

  it('never offers an undo on a reply', () => {
    const bound = quickReplyOf({ id: 4, text: '', accelerator: 'Control+KeyB' })

    show([bound])

    fireEvent.click(fieldOf(bound))
    strike(fieldOf(bound), { code: 'KeyC', ctrlKey: true })

    expect(screen.queryByText('Remettre')).toBeNull()
    expect(screen.queryByText('Remettre : aucune touche')).toBeNull()
  })

  it('recalls the clipboard is only borrowed', () => {
    show([quickReplyOf({ id: 1 })])

    expect(screen.getByText(words.clipboard)).not.toBeNull()
  })
})
