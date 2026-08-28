import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { QuickReply } from '@/@types/shortcuts'
import { strings } from '@/constants/strings'
import { quickReplyEditLabel } from '@/helpers/wording'
import { keyCapsOf, quickReplyOf, strike } from '@/test-doubles'

const bridge = {
  addQuickReply: vi.fn(),
  setQuickReplyText: vi.fn(),
  setQuickReplyShortcut: vi.fn(),
  removeQuickReply: vi.fn()
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { QuickRepliesScreen } = await import('@/screens/quick-replies')

const words = strings.quickReplies

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

describe('l’écran des réponses rapides, quand il n’y en a aucune', () => {
  it('invite à ranger une première phrase', () => {
    show()

    expect(screen.getByText(words.emptyTitle)).not.toBeNull()
    expect(screen.getByText(words.emptyBody)).not.toBeNull()
  })

  it('en ajoute une à la demande', () => {
    show()

    fireEvent.click(addButton())

    expect(bridge.addQuickReply).toHaveBeenCalledWith()
  })
})

describe('l’écran des réponses rapides, la liste', () => {
  it('porte le texte de chaque réponse', () => {
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

  it('dessine les touches rangées sous chaque réponse', () => {
    const bound = quickReplyOf({
      id: 1,
      text: 'Bon jeu à toi !',
      accelerator: 'Control+Alt+KeyB',
      status: { kind: 'registered' }
    })

    show([bound])

    expect(keyCapsOf(fieldOf(bound))).toStrictEqual(['Ctrl', 'Alt', 'B'])
  })

  it('donne un nom différent aux touches de deux réponses', () => {
    show([
      quickReplyOf({ id: 1, text: 'Je vends, mp moi' }),
      quickReplyOf({ id: 2, text: 'En combat, j’arrive' })
    ])

    expect(
      screen.getByRole('button', {
        name: words.editNamed(1, 'Je vends, mp moi')
      })
    ).not.toBeNull()
    expect(
      screen.getByRole('button', {
        name: words.editNamed(2, 'En combat, j’arrive')
      })
    ).not.toBeNull()
  })

  it('donne un nom différent aux touches de deux réponses vides', () => {
    const first = quickReplyOf({ id: 1, text: '' })
    const second = quickReplyOf({ id: 2, text: '' })

    show([first, second])

    expect(fieldOf(first)).not.toBe(fieldOf(second, 2))
  })

  it('en ajoute une depuis le bas de la liste', () => {
    show([quickReplyOf({ id: 1 })])

    fireEvent.click(addButton())

    expect(bridge.addQuickReply).toHaveBeenCalledWith()
  })

  it('en retire une à la demande', () => {
    show([quickReplyOf({ id: 4 })])

    fireEvent.click(screen.getByRole('button', { name: words.remove }))

    expect(bridge.removeQuickReply).toHaveBeenCalledWith(4)
  })
})

describe('l’écran des réponses rapides, le texte', () => {
  it('garde le texte tapé, et ne l’envoie qu’une fois la ligne quittée', () => {
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

  it('taille les espaces autour du texte', () => {
    show([quickReplyOf({ id: 1, text: '' })])

    fireEvent.change(textFieldOf(0), { target: { value: '  Bonjour  ' } })
    fireEvent.blur(textFieldOf(0))

    expect(bridge.setQuickReplyText).toHaveBeenCalledWith(1, 'Bonjour')
  })

  it('n’envoie rien quand le texte n’a pas bougé', () => {
    show([quickReplyOf({ id: 1, text: 'Bonjour' })])

    fireEvent.blur(textFieldOf(0))

    expect(bridge.setQuickReplyText).not.toHaveBeenCalled()
  })

  it('valide le texte sur Entrée', () => {
    show([quickReplyOf({ id: 1, text: '' })])

    const field = textFieldOf(0)

    field.focus()
    fireEvent.change(field, { target: { value: 'Bonjour' } })
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter' })

    expect(bridge.setQuickReplyText).toHaveBeenCalledWith(1, 'Bonjour')
  })

  it('rend le texte d’avant sur Échap', () => {
    show([quickReplyOf({ id: 1, text: 'Bonjour' })])

    const field = textFieldOf(0)

    fireEvent.change(field, { target: { value: 'Autre chose' } })
    fireEvent.keyDown(field, { key: 'Escape', code: 'Escape' })

    expect(field.value).toBe('Bonjour')
    expect(bridge.setQuickReplyText).not.toHaveBeenCalled()
  })

  it('dit qu’une réponse sans texte n’a rien à coller', () => {
    show([quickReplyOf({ id: 1, text: '' })])

    expect(screen.getByText(words.blank)).not.toBeNull()

    fireEvent.change(textFieldOf(0), { target: { value: 'Bonjour' } })

    expect(screen.queryByText(words.blank)).toBeNull()
  })
})

describe('l’écran des réponses rapides, les touches', () => {
  it('range une réponse sous les touches frappées', () => {
    const blank = quickReplyOf({ id: 4, text: '' })

    show([blank])

    fireEvent.click(fieldOf(blank))
    strike(fieldOf(blank), { code: 'KeyB', ctrlKey: true, altKey: true })

    expect(bridge.setQuickReplyShortcut).toHaveBeenCalledWith(
      4,
      'Control+Alt+KeyB'
    )
  })

  it('n’ouvre la saisie que sur la ligne cliquée', () => {
    const first = quickReplyOf({ id: 1, text: 'Je vends, mp moi' })
    const second = quickReplyOf({ id: 2, text: 'En combat, j’arrive' })

    show([first, second])

    fireEvent.click(fieldOf(first))
    fireEvent.click(fieldOf(second, 2))

    expect(screen.getAllByText(strings.shortcuts.capture)).toHaveLength(1)
    expect(
      within(fieldOf(second, 2)).getByText(strings.shortcuts.capture)
    ).not.toBeNull()
  })

  it('dit que rien ne se passera sans touches', () => {
    show([quickReplyOf({ id: 1 })])

    expect(screen.getByText(strings.shortcuts.status.unbound)).not.toBeNull()
  })

  it('nomme l’action qui tient déjà les mêmes touches', () => {
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
      strings.shortcuts.status.duplicate(
        `« ${strings.shortcuts.actions.next.label} »`
      )
    )
  })

  it('n’offre jamais de retour en arrière sur une réponse', () => {
    const bound = quickReplyOf({ id: 4, text: '', accelerator: 'Control+KeyB' })

    show([bound])

    fireEvent.click(fieldOf(bound))
    strike(fieldOf(bound), { code: 'KeyC', ctrlKey: true })

    expect(screen.queryByText(strings.shortcuts.undo)).toBeNull()
    expect(screen.queryByText(strings.shortcuts.undoNone)).toBeNull()
  })

  it('rappelle que le presse-papiers n’est qu’emprunté', () => {
    show([quickReplyOf({ id: 1 })])

    expect(screen.getByText(words.clipboard)).not.toBeNull()
  })
})
