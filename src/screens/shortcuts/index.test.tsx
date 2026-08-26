import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type {
  QuickReply,
  ShortcutAction,
  ShortcutBinding,
  ShortcutStatus
} from '@/@types/shortcuts'
import { strings } from '@/constants/strings'

function pending(): Promise<never> {
  return new Promise(() => {})
}

const bridge = vi.hoisted(() => {
  return {
    setShortcut: vi.fn(pending),
    resetShortcuts: vi.fn(pending),
    addQuickReply: vi.fn(pending),
    setQuickReplyText: vi.fn(pending),
    setQuickReplyShortcut: vi.fn(pending),
    removeQuickReply: vi.fn(pending)
  }
})

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { ShortcutsScreen } = await import('@/screens/shortcuts')

const words = strings.shortcuts

const ALL_ACTIONS = [
  'next',
  'previous',
  'toggleAsleep',
  'swap',
  'walk'
] as const satisfies readonly ShortcutAction[]

type ShortcutParams = {
  readonly accelerator?: string | null
  readonly status?: ShortcutStatus
  readonly isDefault?: boolean
}

const shortcut = (
  action: ShortcutAction,
  { accelerator = null, status, isDefault = true }: ShortcutParams = {}
): ShortcutBinding => {
  return {
    action,
    accelerator,
    status: status ?? {
      kind: accelerator === null ? 'unbound' : 'registered'
    },
    isDefault
  }
}

const quickReply = (
  id: number,
  fields: Partial<QuickReply> = {}
): QuickReply => {
  return {
    id,
    text: 'Je vends, mp moi',
    accelerator: null,
    status: { kind: 'unbound' },
    ...fields
  }
}

type ShowParams = {
  readonly shortcuts?: readonly ShortcutBinding[]
  readonly quickReplies?: readonly QuickReply[]
}

const show = ({ shortcuts = [], quickReplies = [] }: ShowParams = {}) => {
  const { rerender } = render(
    <ShortcutsScreen
      shortcuts={shortcuts}
      quickReplies={quickReplies}
      run={() => {}}
    />
  )

  return (next: ShowParams) => {
    rerender(
      <ShortcutsScreen
        shortcuts={next.shortcuts ?? shortcuts}
        quickReplies={next.quickReplies ?? quickReplies}
        run={() => {}}
      />
    )
  }
}

const fieldOf = (action: ShortcutAction) => {
  return screen.getByRole('button', {
    name: words.edit(words.actions[action].label)
  })
}

const quickReplyField = () => {
  return screen.getByRole('button', { name: words.quickReplies.edit })
}

const strike = (
  field: HTMLElement,
  key: Partial<KeyboardEvent> & { readonly code: string }
) => {
  fireEvent.keyDown(field, { key: key.code, ...key })
}

const capsOf = (field: HTMLElement) => {
  return [...field.querySelectorAll('kbd')].map((cap) => {
    return cap.textContent
  })
}

describe('l’écran des raccourcis, les cinq actions', () => {
  const all = ALL_ACTIONS.map((action) => {
    return shortcut(action)
  })

  it('porte une ligne par action, avec ce qu’elle fait', () => {
    show({ shortcuts: all })

    for (const action of ALL_ACTIONS) {
      const { label, description } = words.actions[action]

      expect(fieldOf(action)).not.toBeNull()
      expect(screen.getByText(label)).not.toBeNull()
      expect(screen.getByText(description)).not.toBeNull()
    }
  })

  it('n’ouvre la saisie que sur la ligne cliquée', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))

    expect(screen.getAllByText(words.capture)).toHaveLength(1)
    expect(within(fieldOf('next')).getByText(words.capture)).not.toBeNull()
  })

  it('referme la ligne d’avant quand on en ouvre une autre', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))
    fireEvent.click(fieldOf('walk'))

    expect(screen.getAllByText(words.capture)).toHaveLength(1)
    expect(within(fieldOf('walk')).getByText(words.capture)).not.toBeNull()
  })

  it('pose la combinaison frappée et referme la saisie', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))
    strike(fieldOf('next'), { code: 'KeyN', ctrlKey: true, shiftKey: true })

    expect(bridge.setShortcut).toHaveBeenCalledWith(
      'next',
      'Control+Shift+KeyN'
    )
    expect(screen.queryByText(words.capture)).toBeNull()
  })

  it('efface la combinaison sur Retour arrière', () => {
    show({ shortcuts: [shortcut('walk', { accelerator: 'Alt+KeyW' })] })

    fireEvent.click(fieldOf('walk'))
    fireEvent.keyDown(fieldOf('walk'), { key: 'Backspace', code: 'Backspace' })

    expect(bridge.setShortcut).toHaveBeenCalledWith('walk', null)
  })

  it('dessine les touches de chaque action', () => {
    show({
      shortcuts: [
        shortcut('next', { accelerator: 'Control+Right' }),
        shortcut('previous', { accelerator: 'Control+Left' })
      ]
    })

    expect(capsOf(fieldOf('next'))).toStrictEqual(['Ctrl', '→'])
    expect(capsOf(fieldOf('previous'))).toStrictEqual(['Ctrl', '←'])
  })
})

describe('l’écran des raccourcis, le retour en arrière', () => {
  const before = [shortcut('walk', { accelerator: 'Alt+KeyW' })]
  const after = [
    shortcut('walk', {
      accelerator: 'Control+Shift+KeyW',
      isDefault: false
    })
  ]

  it('offre de remettre les touches d’avant, une fois la nouvelle posée', () => {
    const again = show({ shortcuts: before })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    again({ shortcuts: after })

    const undo = screen.getByRole('button', {
      name: words.undoLabel(words.actions.walk.label)
    })

    expect(capsOf(undo)).toStrictEqual(['Alt', 'W'])
  })

  it('repose les touches d’avant, et n’offre plus rien', () => {
    const again = show({ shortcuts: before })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    again({ shortcuts: after })

    fireEvent.click(
      screen.getByRole('button', {
        name: words.undoLabel(words.actions.walk.label)
      })
    )

    expect(bridge.setShortcut).toHaveBeenLastCalledWith('walk', 'Alt+KeyW')

    again({ shortcuts: before })

    expect(
      screen.queryByRole('button', {
        name: words.undoLabel(words.actions.walk.label)
      })
    ).toBeNull()
  })

  it('n’offre rien tant que rien n’a été changé', () => {
    show({ shortcuts: after })

    expect(
      screen.queryByRole('button', {
        name: words.undoLabel(words.actions.walk.label)
      })
    ).toBeNull()
  })

  it('offre de remettre aucune touche quand il n’y en avait pas', () => {
    const again = show({ shortcuts: [shortcut('walk')] })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    again({ shortcuts: after })

    expect(
      screen.getByRole('button', {
        name: words.undoLabel(words.actions.walk.label)
      }).textContent
    ).toBe(words.undoNone)
  })
})

describe('l’écran des raccourcis, les touches d’origine', () => {
  it('n’offre rien tant que rien n’a bougé', () => {
    show({ shortcuts: [shortcut('walk'), shortcut('next')] })

    expect(screen.queryByRole('button', { name: words.defaults })).toBeNull()
  })

  it('offre de tout remettre dès qu’une touche a bougé', () => {
    show({
      shortcuts: [shortcut('walk'), shortcut('next', { isDefault: false })]
    })

    fireEvent.click(screen.getByRole('button', { name: words.defaults }))

    expect(bridge.resetShortcuts).toHaveBeenCalledWith()
  })

  it('oublie les retours en arrière quand on remet tout d’origine', () => {
    const again = show({
      shortcuts: [shortcut('walk', { accelerator: 'Alt+KeyW' })]
    })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    again({
      shortcuts: [
        shortcut('walk', {
          accelerator: 'Control+Shift+KeyW',
          isDefault: false
        })
      ]
    })

    fireEvent.click(screen.getByRole('button', { name: words.defaults }))

    expect(
      screen.queryByRole('button', {
        name: words.undoLabel(words.actions.walk.label)
      })
    ).toBeNull()
  })
})

describe('l’écran des raccourcis, ce que Rust répond d’une combinaison', () => {
  it('dit que rien ne se passera sans touches', () => {
    show({ shortcuts: [shortcut('walk')] })

    expect(screen.getByText(words.status.unbound)).not.toBeNull()
  })

  it('dit qu’un autre logiciel a déjà pris ces touches', () => {
    show({
      shortcuts: [
        shortcut('walk', {
          accelerator: 'Control+KeyW',
          status: { kind: 'refused', detail: 'HOTKEY_ALREADY_REGISTERED' }
        })
      ]
    })

    expect(screen.getByRole('alert').textContent).toBe(words.status.refused)
  })

  it('nomme l’action qui tient déjà les mêmes touches', () => {
    show({
      shortcuts: [
        shortcut('next', { accelerator: 'Control+KeyN' }),
        shortcut('walk', {
          accelerator: 'Control+KeyN',
          status: {
            kind: 'duplicate',
            binding: { kind: 'action', action: 'next' }
          }
        })
      ]
    })

    expect(screen.getByRole('alert').textContent).toBe(
      words.status.duplicate(`« ${words.actions.next.label} »`)
    )
  })

  it('nomme la réponse rapide qui tient déjà les mêmes touches', () => {
    show({
      shortcuts: [
        shortcut('walk', {
          accelerator: 'Control+KeyR',
          status: {
            kind: 'duplicate',
            binding: { kind: 'quickReply', id: 7 }
          }
        })
      ],
      quickReplies: [quickReply(7, { text: 'Bonjour' })]
    })

    expect(screen.getByRole('alert').textContent).toBe(
      words.status.duplicate(words.quickReplies.named('Bonjour'))
    )
  })

  it('ne dit rien quand la combinaison est bien enregistrée', () => {
    show({
      shortcuts: [shortcut('walk', { accelerator: 'Control+KeyW' })]
    })

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText(words.status.unbound)).toBeNull()
  })
})

describe('l’écran des raccourcis, les réponses rapides', () => {
  it('invite à en ajouter une quand il n’y en a aucune', () => {
    show()

    expect(screen.getByText(words.quickReplies.empty)).not.toBeNull()
  })

  it('en ajoute une à la demande', () => {
    show()

    fireEvent.click(
      screen.getByRole('button', { name: words.quickReplies.add })
    )

    expect(bridge.addQuickReply).toHaveBeenCalledWith()
  })

  it('porte le texte de chaque réponse', () => {
    show({
      quickReplies: [
        quickReply(1, { text: 'Je vends, mp moi' }),
        quickReply(2, { text: 'En combat, j’arrive' })
      ]
    })

    const texts = screen
      .getAllByLabelText<HTMLInputElement>(words.quickReplies.textLabel)
      .map((field) => {
        return field.value
      })

    expect(texts).toStrictEqual(['Je vends, mp moi', 'En combat, j’arrive'])
  })

  it('garde le texte tapé, et ne l’envoie qu’une fois la ligne quittée', () => {
    show({ quickReplies: [quickReply(1, { text: '' })] })

    const field = screen.getByLabelText(words.quickReplies.textLabel)

    fireEvent.change(field, { target: { value: 'Je suis en combat' } })

    expect(bridge.setQuickReplyText).not.toHaveBeenCalled()

    fireEvent.blur(field)

    expect(bridge.setQuickReplyText).toHaveBeenCalledWith(
      1,
      'Je suis en combat'
    )
  })

  it('taille les espaces autour du texte', () => {
    show({ quickReplies: [quickReply(1, { text: '' })] })

    const field = screen.getByLabelText(words.quickReplies.textLabel)

    fireEvent.change(field, { target: { value: '  Bonjour  ' } })
    fireEvent.blur(field)

    expect(bridge.setQuickReplyText).toHaveBeenCalledWith(1, 'Bonjour')
  })

  it('n’envoie rien quand le texte n’a pas bougé', () => {
    show({ quickReplies: [quickReply(1, { text: 'Bonjour' })] })

    fireEvent.blur(screen.getByLabelText(words.quickReplies.textLabel))

    expect(bridge.setQuickReplyText).not.toHaveBeenCalled()
  })

  it('valide le texte sur Entrée', () => {
    show({ quickReplies: [quickReply(1, { text: '' })] })

    const field = screen.getByLabelText(words.quickReplies.textLabel)

    field.focus()
    fireEvent.change(field, { target: { value: 'Bonjour' } })
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter' })

    expect(bridge.setQuickReplyText).toHaveBeenCalledWith(1, 'Bonjour')
  })

  it('rend le texte d’avant sur Échap', () => {
    show({ quickReplies: [quickReply(1, { text: 'Bonjour' })] })

    const field = screen.getByLabelText<HTMLInputElement>(
      words.quickReplies.textLabel
    )

    fireEvent.change(field, { target: { value: 'Autre chose' } })
    fireEvent.keyDown(field, { key: 'Escape', code: 'Escape' })

    expect(field.value).toBe('Bonjour')
    expect(bridge.setQuickReplyText).not.toHaveBeenCalled()
  })

  it('en retire une à la demande', () => {
    show({ quickReplies: [quickReply(4)] })

    fireEvent.click(
      screen.getByRole('button', { name: words.quickReplies.remove })
    )

    expect(bridge.removeQuickReply).toHaveBeenCalledWith(4)
  })

  it('range une réponse sous les touches frappées', () => {
    show({ quickReplies: [quickReply(4)] })

    fireEvent.click(quickReplyField())
    strike(quickReplyField(), { code: 'KeyB', ctrlKey: true, altKey: true })

    expect(bridge.setQuickReplyShortcut).toHaveBeenCalledWith(
      4,
      'Control+Alt+KeyB'
    )
  })

  it('referme la ligne d’une action quand on ouvre celle d’une réponse', () => {
    show({
      shortcuts: [shortcut('walk')],
      quickReplies: [quickReply(4)]
    })

    fireEvent.click(fieldOf('walk'))
    fireEvent.click(quickReplyField())

    expect(screen.getAllByText(words.capture)).toHaveLength(1)
    expect(within(quickReplyField()).getByText(words.capture)).not.toBeNull()
  })

  it('n’offre jamais de retour en arrière sur une réponse', () => {
    show({ quickReplies: [quickReply(4, { accelerator: 'Control+KeyB' })] })

    fireEvent.click(quickReplyField())
    strike(quickReplyField(), { code: 'KeyC', ctrlKey: true })

    expect(screen.queryByText(words.undo)).toBeNull()
    expect(screen.queryByText(words.undoNone)).toBeNull()
  })

  it('rappelle que le presse-papiers n’est qu’emprunté', () => {
    show()

    expect(screen.getByText(words.quickReplies.clipboard)).not.toBeNull()
  })
})
