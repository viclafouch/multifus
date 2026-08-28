import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import type {
  QuickReply,
  ShortcutAction,
  ShortcutBinding,
  ShortcutStatus
} from '@/@types/shortcuts'
import { strings } from '@/constants/strings'
import {
  characterOf,
  keyCapsOf,
  pending,
  quickReplyOf,
  strike
} from '@/test-doubles'

const bridge = {
  setShortcut: vi.fn(),
  setCharacterShortcut: vi.fn(),
  resetShortcuts: vi.fn(),
  suspendShortcuts: vi.fn(pending),
  resumeShortcuts: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { ShortcutsScreen } = await import('@/screens/shortcuts')

const ALL_ACTIONS = [
  'next',
  'previous',
  'main',
  'toggleExcluded',
  'walk',
  'maximizeAll',
  'wheel'
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

type ShowParams = {
  readonly shortcuts?: readonly ShortcutBinding[]
  readonly characters?: readonly Character[]
  readonly quickReplies?: readonly QuickReply[]
}

const show = ({
  shortcuts = [],
  characters = [],
  quickReplies = []
}: ShowParams = {}) => {
  const { rerender } = render(
    <ShortcutsScreen
      shortcuts={shortcuts}
      characters={characters}
      quickReplies={quickReplies}
      run={() => {}}
    />
  )

  return (next: ShowParams) => {
    rerender(
      <ShortcutsScreen
        shortcuts={next.shortcuts ?? shortcuts}
        characters={next.characters ?? characters}
        quickReplies={next.quickReplies ?? quickReplies}
        run={() => {}}
      />
    )
  }
}

const fieldOf = (action: ShortcutAction) => {
  return screen.getByRole('button', {
    name: strings.shortcuts.edit(strings.shortcuts.actions[action].label)
  })
}

const fieldOfCharacter = (nickname: string) => {
  return screen.getByRole('button', {
    name: strings.shortcuts.characterEdit(nickname)
  })
}

describe('l’écran des raccourcis, les sept actions', () => {
  const all = ALL_ACTIONS.map((action) => {
    return shortcut(action)
  })

  it('porte une ligne par action, avec ce qu’elle fait', () => {
    show({ shortcuts: all })

    for (const action of ALL_ACTIONS) {
      const { label, description } = strings.shortcuts.actions[action]

      expect(fieldOf(action)).not.toBeNull()
      expect(screen.getByText(label)).not.toBeNull()
      expect(screen.getByText(description)).not.toBeNull()
    }
  })

  it('marque la seule action qui répond à une touche maintenue', () => {
    show({ shortcuts: all })

    expect(screen.getAllByText(strings.shortcuts.held)).toHaveLength(1)
  })

  it('n’ouvre la saisie que sur la ligne cliquée', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))

    expect(screen.getAllByText(strings.shortcuts.capture)).toHaveLength(1)
    expect(
      within(fieldOf('next')).getByText(strings.shortcuts.capture)
    ).not.toBeNull()
  })

  it('referme la ligne d’avant quand on en ouvre une autre', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))
    fireEvent.click(fieldOf('walk'))

    expect(screen.getAllByText(strings.shortcuts.capture)).toHaveLength(1)
    expect(
      within(fieldOf('walk')).getByText(strings.shortcuts.capture)
    ).not.toBeNull()
  })

  it('pose la combinaison frappée et referme la saisie', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))
    strike(fieldOf('next'), { code: 'KeyN', ctrlKey: true, shiftKey: true })

    expect(bridge.setShortcut).toHaveBeenCalledWith(
      'next',
      'Control+Shift+KeyN'
    )
    expect(screen.queryByText(strings.shortcuts.capture)).toBeNull()
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

    expect(keyCapsOf(fieldOf('next'))).toStrictEqual(['Ctrl', '→'])
    expect(keyCapsOf(fieldOf('previous'))).toStrictEqual(['Ctrl', '←'])
  })
})

describe('l’écran des raccourcis, le personnage principal', () => {
  it('dit ce que la frappe fera, sans nommer personne', () => {
    show({
      shortcuts: [shortcut('main', { accelerator: 'Control+Shift+Space' })]
    })

    expect(
      screen.getByText(strings.shortcuts.actions.main.description)
    ).not.toBeNull()
    expect(keyCapsOf(fieldOf('main'))).toStrictEqual(['Ctrl', 'Maj', 'Espace'])
    expect(screen.queryByRole('alert')).toBeNull()
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
    const answered = show({ shortcuts: before })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    answered({ shortcuts: after })

    const undo = screen.getByRole('button', {
      name: strings.shortcuts.undoLabel(strings.shortcuts.actions.walk.label)
    })

    expect(keyCapsOf(undo)).toStrictEqual(['Alt', 'W'])
  })

  it('repose les touches d’avant, et n’offre plus rien', () => {
    const answered = show({ shortcuts: before })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    answered({ shortcuts: after })

    fireEvent.click(
      screen.getByRole('button', {
        name: strings.shortcuts.undoLabel(strings.shortcuts.actions.walk.label)
      })
    )

    expect(bridge.setShortcut).toHaveBeenLastCalledWith('walk', 'Alt+KeyW')

    answered({ shortcuts: before })

    expect(
      screen.queryByRole('button', {
        name: strings.shortcuts.undoLabel(strings.shortcuts.actions.walk.label)
      })
    ).toBeNull()
  })

  it('n’offre rien tant que rien n’a été changé', () => {
    show({ shortcuts: after })

    expect(
      screen.queryByRole('button', {
        name: strings.shortcuts.undoLabel(strings.shortcuts.actions.walk.label)
      })
    ).toBeNull()
  })

  it('offre de remettre aucune touche quand il n’y en avait pas', () => {
    const answered = show({ shortcuts: [shortcut('walk')] })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    answered({ shortcuts: after })

    expect(
      screen.getByRole('button', {
        name: strings.shortcuts.undoLabel(strings.shortcuts.actions.walk.label)
      }).textContent
    ).toBe(strings.shortcuts.undoNone)
  })
})

describe('l’écran des raccourcis, les touches d’origine', () => {
  it('n’offre rien tant que rien n’a bougé', () => {
    show({ shortcuts: [shortcut('walk'), shortcut('next')] })

    expect(
      screen.queryByRole('button', { name: strings.shortcuts.defaults })
    ).toBeNull()
  })

  it('offre de tout remettre dès qu’une touche a bougé', () => {
    show({
      shortcuts: [shortcut('walk'), shortcut('next', { isDefault: false })]
    })

    fireEvent.click(
      screen.getByRole('button', { name: strings.shortcuts.defaults })
    )

    expect(bridge.resetShortcuts).toHaveBeenCalledWith()
  })

  it('oublie les retours en arrière quand on remet tout d’origine', () => {
    const answered = show({
      shortcuts: [shortcut('walk', { accelerator: 'Alt+KeyW' })]
    })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    answered({
      shortcuts: [
        shortcut('walk', {
          accelerator: 'Control+Shift+KeyW',
          isDefault: false
        })
      ]
    })

    fireEvent.click(
      screen.getByRole('button', { name: strings.shortcuts.defaults })
    )

    expect(
      screen.queryByRole('button', {
        name: strings.shortcuts.undoLabel(strings.shortcuts.actions.walk.label)
      })
    ).toBeNull()
  })
})

describe('l’écran des raccourcis, ce que Rust répond d’une combinaison', () => {
  it('dit que rien ne se passera sans touches', () => {
    show({ shortcuts: [shortcut('walk')] })

    expect(screen.getByText(strings.shortcuts.status.unbound)).not.toBeNull()
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

    expect(screen.getByRole('alert').textContent).toBe(
      strings.shortcuts.status.refused
    )
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
      strings.shortcuts.status.duplicate(
        `« ${strings.shortcuts.actions.next.label} »`
      )
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
      quickReplies: [quickReplyOf({ id: 7, text: 'Bonjour' })]
    })

    expect(screen.getByRole('alert').textContent).toBe(
      strings.shortcuts.status.duplicate(strings.quickReplies.named('Bonjour'))
    )
  })

  it('ne dit rien quand la combinaison est bien enregistrée', () => {
    show({
      shortcuts: [shortcut('walk', { accelerator: 'Control+KeyW' })]
    })

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText(strings.shortcuts.status.unbound)).toBeNull()
  })
})

describe('l’écran des raccourcis, un personnage une touche', () => {
  const ALPHA = characterOf({ nickname: 'Alpha' })
  const BRAVO = characterOf({ nickname: 'Bravo', online: false })

  it('porte une ligne par personnage du roster, connecté ou non', () => {
    show({ characters: [ALPHA, BRAVO] })

    expect(screen.getByText(strings.shortcuts.charactersTitle)).not.toBeNull()
    expect(fieldOfCharacter('Alpha')).not.toBeNull()
    expect(fieldOfCharacter('Bravo')).not.toBeNull()
  })

  it('dit où les personnages arrivent quand le roster est vide', () => {
    show({ characters: [] })

    expect(screen.getByText(strings.shortcuts.charactersEmpty)).not.toBeNull()
  })

  it('ne donne aucune touche à un personnage, et ne l’en avertit pas', () => {
    show({ characters: [ALPHA] })

    expect(keyCapsOf(fieldOfCharacter('Alpha'))).toStrictEqual([])
    expect(screen.queryByText(strings.shortcuts.status.unbound)).toBeNull()
  })

  it('pose la touche frappée sur le personnage, et referme la saisie', () => {
    show({ characters: [ALPHA] })

    fireEvent.click(fieldOfCharacter('Alpha'))
    strike(fieldOfCharacter('Alpha'), {
      code: 'F1',
      ctrlKey: true,
      shiftKey: true
    })

    expect(bridge.setCharacterShortcut).toHaveBeenCalledWith(
      'Alpha',
      'Control+Shift+F1'
    )
    expect(screen.queryByText(strings.shortcuts.capture)).toBeNull()
  })

  it('efface la touche d’un personnage sur Retour arrière', () => {
    show({ characters: [characterOf({ shortcut: 'F1' })] })

    fireEvent.click(fieldOfCharacter('Alpha'))
    fireEvent.keyDown(fieldOfCharacter('Alpha'), {
      key: 'Backspace',
      code: 'Backspace'
    })

    expect(bridge.setCharacterShortcut).toHaveBeenCalledWith('Alpha', null)
  })

  it('n’ouvre la saisie que sur la ligne cliquée, actions comprises', () => {
    show({ shortcuts: [shortcut('next')], characters: [ALPHA] })

    fireEvent.click(fieldOf('next'))
    fireEvent.click(fieldOfCharacter('Alpha'))

    expect(screen.getAllByText(strings.shortcuts.capture)).toHaveLength(1)
    expect(
      within(fieldOfCharacter('Alpha')).getByText(strings.shortcuts.capture)
    ).not.toBeNull()
  })

  it('marque d’une étoile le personnage principal, et lui seul', () => {
    show({
      characters: [
        characterOf({ nickname: 'Alpha', main: true }),
        characterOf({ nickname: 'Bravo' })
      ]
    })

    expect(screen.getAllByText(strings.characters.mainMark)).toHaveLength(1)
  })

  it('nomme le personnage qui tient déjà les mêmes touches', () => {
    show({
      shortcuts: [
        shortcut('walk', {
          accelerator: 'F1',
          status: {
            kind: 'duplicate',
            binding: { kind: 'character', nickname: 'Alpha' }
          }
        })
      ],
      characters: [characterOf({ shortcut: 'F1' })]
    })

    expect(screen.getByRole('alert').textContent).toBe(
      strings.shortcuts.status.duplicate(
        strings.shortcuts.characterNamed('Alpha')
      )
    )
  })
})
