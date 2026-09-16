import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { QuickText } from '@/@types/shortcuts'
import { quickTextEditLabel } from '@/helpers/wording'
import { keyCapsOf, pending, quickTextOf, strike } from '@/test-doubles'

const bridge = {
  addQuickText: vi.fn(),
  setQuickTextText: vi.fn(),
  setQuickTextShortcut: vi.fn(),
  removeQuickText: vi.fn(),
  suspendShortcuts: vi.fn(pending),
  resumeShortcuts: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { QuickTextsScreen } = await import('@/screens/quick-texts')

const words = {
  add: 'Ajouter un texte',
  example: 'Bon jeu à toi !',
  textLabel: 'Le texte à coller',
  remove: 'Retirer ce texte',
  blank: 'Sans texte, il n’y aura rien à coller.',
  emptyTitle: 'Aucun texte rangé',
  emptyBody: 'Un texte, des touches, et vous ne le retapez plus de la soirée.',
  clipboard:
    'Multifus colle, c’est vous qui appuyez sur Entrée. Le temps du collage, il emprunte votre presse-papiers, puis vous le rend.'
}

const show = (quickTexts: readonly QuickText[] = []) => {
  render(<QuickTextsScreen quickTexts={quickTexts} run={() => {}} />)
}

const addButton = () => {
  return screen.getByRole('button', { name: words.add })
}

const fieldOf = (quickText: QuickText, rank = 1) => {
  return screen.getByRole('button', {
    name: quickTextEditLabel(quickText, rank)
  })
}

const textFieldOf = (index: number) => {
  return screen.getAllByLabelText<HTMLInputElement>(words.textLabel)[index]
}

describe('the quick texts screen, when there is none', () => {
  it('invites to keep a first sentence', () => {
    show()

    expect(screen.getByText(words.emptyTitle)).not.toBeNull()
    expect(screen.getByText(words.emptyBody)).not.toBeNull()
  })

  it('adds one on request', () => {
    show()

    fireEvent.click(addButton())

    expect(bridge.addQuickText).toHaveBeenCalledWith()
  })
})

describe('the quick texts screen, the list', () => {
  it('carries the line of each quick text', () => {
    show([
      quickTextOf({ id: 1, text: 'Je vends, mp moi' }),
      quickTextOf({ id: 2, text: 'En combat, j’arrive' })
    ])

    const texts = screen
      .getAllByLabelText<HTMLInputElement>(words.textLabel)
      .map((field) => {
        return field.value
      })

    expect(texts).toStrictEqual(['Je vends, mp moi', 'En combat, j’arrive'])
  })

  it('draws the keys kept under each quick text', () => {
    const bound = quickTextOf({
      id: 1,
      text: 'Bon jeu à toi !',
      accelerator: 'Control+Alt+KeyB',
      status: { kind: 'registered' }
    })

    show([bound])

    expect(keyCapsOf(fieldOf(bound))).toStrictEqual(['Ctrl', 'Alt', 'B'])
  })

  it('gives a different name to the keys of two quick texts', () => {
    show([
      quickTextOf({ id: 1, text: 'Je vends, mp moi' }),
      quickTextOf({ id: 2, text: 'En combat, j’arrive' })
    ])

    expect(
      screen.getByRole('button', {
        name: 'Modifier les touches du texte 1, « Je vends, mp moi »'
      })
    ).not.toBeNull()
    expect(
      screen.getByRole('button', {
        name: 'Modifier les touches du texte 2, « En combat, j’arrive »'
      })
    ).not.toBeNull()
  })

  it('gives a different name to the keys of two empty quick texts', () => {
    const first = quickTextOf({ id: 1, text: '' })
    const second = quickTextOf({ id: 2, text: '' })

    show([first, second])

    expect(fieldOf(first)).not.toBe(fieldOf(second, 2))
  })

  it('adds one from the bottom of the list', () => {
    show([quickTextOf({ id: 1 })])

    fireEvent.click(addButton())

    expect(bridge.addQuickText).toHaveBeenCalledWith()
  })

  it('removes one on request', () => {
    show([quickTextOf({ id: 4 })])

    fireEvent.click(screen.getByRole('button', { name: words.remove }))

    expect(bridge.removeQuickText).toHaveBeenCalledWith(4)
  })
})

describe('the quick texts screen, the text', () => {
  it('keeps the typed text, and sends it only once the row is left', () => {
    show([quickTextOf({ id: 1, text: '' })])

    const field = textFieldOf(0)

    fireEvent.change(field, { target: { value: 'Je suis en combat' } })

    expect(bridge.setQuickTextText).not.toHaveBeenCalled()

    fireEvent.blur(field)

    expect(bridge.setQuickTextText).toHaveBeenCalledWith(1, 'Je suis en combat')
  })

  it('trims the spaces around the text', () => {
    show([quickTextOf({ id: 1, text: '' })])

    fireEvent.change(textFieldOf(0), { target: { value: '  Bonjour  ' } })
    fireEvent.blur(textFieldOf(0))

    expect(bridge.setQuickTextText).toHaveBeenCalledWith(1, 'Bonjour')
  })

  it('sends nothing when the text has not moved', () => {
    show([quickTextOf({ id: 1, text: 'Bonjour' })])

    fireEvent.blur(textFieldOf(0))

    expect(bridge.setQuickTextText).not.toHaveBeenCalled()
  })

  it('validates the text on Enter', () => {
    show([quickTextOf({ id: 1, text: '' })])

    const field = textFieldOf(0)

    field.focus()
    fireEvent.change(field, { target: { value: 'Bonjour' } })
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter' })

    expect(bridge.setQuickTextText).toHaveBeenCalledWith(1, 'Bonjour')
  })

  it('gives the previous text back on Escape', () => {
    show([quickTextOf({ id: 1, text: 'Bonjour' })])

    const field = textFieldOf(0)

    fireEvent.change(field, { target: { value: 'Autre chose' } })
    fireEvent.keyDown(field, { key: 'Escape', code: 'Escape' })

    expect(field.value).toBe('Bonjour')
    expect(bridge.setQuickTextText).not.toHaveBeenCalled()
  })

  it('says an empty quick text has nothing to paste', () => {
    show([quickTextOf({ id: 1, text: '' })])

    expect(screen.getByText(words.blank)).not.toBeNull()

    fireEvent.change(textFieldOf(0), { target: { value: 'Bonjour' } })

    expect(screen.queryByText(words.blank)).toBeNull()
  })
})

describe('the quick texts screen, the keys', () => {
  it('keeps a quick text under the keys that were hit', () => {
    const blank = quickTextOf({ id: 4, text: '' })

    show([blank])

    fireEvent.click(fieldOf(blank))
    strike(fieldOf(blank), { code: 'KeyB', ctrlKey: true, altKey: true })

    expect(bridge.setQuickTextShortcut).toHaveBeenCalledWith(
      4,
      'Control+Alt+KeyB'
    )
  })

  it('opens the capture only on the clicked row', () => {
    const first = quickTextOf({ id: 1, text: 'Je vends, mp moi' })
    const second = quickTextOf({ id: 2, text: 'En combat, j’arrive' })

    show([first, second])

    fireEvent.click(fieldOf(first))
    fireEvent.click(fieldOf(second, 2))

    expect(screen.getAllByText('Appuyez sur vos touches')).toHaveLength(1)
    expect(
      within(fieldOf(second, 2)).getByText('Appuyez sur vos touches')
    ).not.toBeNull()
  })

  it('says nothing will happen without keys', () => {
    show([quickTextOf({ id: 1 })])

    expect(
      screen.getByText('Sans touches, il ne se passera rien.')
    ).not.toBeNull()
  })

  it('names the action that already holds the same keys', () => {
    show([
      quickTextOf({
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

  it('never offers an undo on a quick text', () => {
    const bound = quickTextOf({ id: 4, text: '', accelerator: 'Control+KeyB' })

    show([bound])

    fireEvent.click(fieldOf(bound))
    strike(fieldOf(bound), { code: 'KeyC', ctrlKey: true })

    expect(screen.queryByText('Remettre')).toBeNull()
    expect(screen.queryByText('Remettre : aucune touche')).toBeNull()
  })

  it('recalls the clipboard is only borrowed', () => {
    show([quickTextOf({ id: 1 })])

    expect(screen.getByText(words.clipboard)).not.toBeNull()
  })
})
