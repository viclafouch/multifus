import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@lingui/core'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { Character } from '@/@types/roster'
import type {
  QuickText,
  ShortcutAction,
  ShortcutBinding,
  ShortcutStatus
} from '@/@types/shortcuts'
import { SHORTCUT_ACTIONS } from '@/constants/shortcuts'
import {
  characterOf,
  keyCapsOf,
  pending,
  quickTextOf,
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
  readonly quickTexts?: readonly QuickText[]
}

const show = ({
  shortcuts = [],
  characters = [],
  quickTexts = []
}: ShowParams = {}) => {
  const { rerender } = render(
    <ShortcutsScreen
      shortcuts={shortcuts}
      characters={characters}
      quickTexts={quickTexts}
      run={() => {}}
    />
  )

  return (next: ShowParams) => {
    rerender(
      <ShortcutsScreen
        shortcuts={next.shortcuts ?? shortcuts}
        characters={next.characters ?? characters}
        quickTexts={next.quickTexts ?? quickTexts}
        run={() => {}}
      />
    )
  }
}

const fieldOf = (action: ShortcutAction) => {
  return screen.getByRole('button', {
    name: `Modifier le raccourci ${i18n._(SHORTCUT_ACTIONS[action].label)}`
  })
}

const fieldOfCharacter = (nickname: string) => {
  return screen.getByRole('button', {
    name: `Modifier le raccourci de ${nickname}`
  })
}

describe('the shortcuts screen, the eight actions', () => {
  const all = ALL_ACTIONS.map((action) => {
    return shortcut(action)
  })

  it('carries one row per action, with what it does', () => {
    show({ shortcuts: all })

    for (const action of ALL_ACTIONS) {
      const { label, description } = SHORTCUT_ACTIONS[action]

      expect(fieldOf(action)).not.toBeNull()
      expect(screen.getByText(i18n._(label))).not.toBeNull()
      expect(screen.getByText(i18n._(description))).not.toBeNull()
    }
  })

  it('marks the only action that answers to a held key', () => {
    show({ shortcuts: all })

    expect(screen.getAllByText('au maintien')).toHaveLength(1)
  })

  it('opens the capture only on the clicked row', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))

    expect(screen.getAllByText('Appuyez sur vos touches')).toHaveLength(1)
    expect(
      within(fieldOf('next')).getByText('Appuyez sur vos touches')
    ).not.toBeNull()
  })

  it('closes the previous row when another one is opened', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))
    fireEvent.click(fieldOf('walk'))

    expect(screen.getAllByText('Appuyez sur vos touches')).toHaveLength(1)
    expect(
      within(fieldOf('walk')).getByText('Appuyez sur vos touches')
    ).not.toBeNull()
  })

  it('sets the hit combination and closes the capture', () => {
    show({ shortcuts: all })

    fireEvent.click(fieldOf('next'))
    strike(fieldOf('next'), { code: 'KeyN', ctrlKey: true, shiftKey: true })

    expect(bridge.setShortcut).toHaveBeenCalledWith(
      'next',
      'Control+Shift+KeyN'
    )
    expect(screen.queryByText('Appuyez sur vos touches')).toBeNull()
  })

  it('clears the combination on Backspace', () => {
    show({ shortcuts: [shortcut('walk', { accelerator: 'Alt+KeyW' })] })

    fireEvent.click(fieldOf('walk'))
    fireEvent.keyDown(fieldOf('walk'), { key: 'Backspace', code: 'Backspace' })

    expect(bridge.setShortcut).toHaveBeenCalledWith('walk', null)
  })

  it('draws the keys of each action', () => {
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

describe('the shortcuts screen, the main character', () => {
  it('says what the press will do, without naming anybody', () => {
    show({
      shortcuts: [shortcut('main', { accelerator: 'Control+Shift+Space' })]
    })

    expect(
      screen.getByText('Ramène votre principal devant, où que vous soyez.')
    ).not.toBeNull()
    expect(keyCapsOf(fieldOf('main'))).toStrictEqual(['Ctrl', 'Maj', 'Espace'])
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('the shortcuts screen, the undo', () => {
  const before = [shortcut('walk', { accelerator: 'Alt+KeyW' })]
  const after = [
    shortcut('walk', {
      accelerator: 'Control+Shift+KeyW',
      isDefault: false
    })
  ]

  it('offers to put the previous keys back, once the new one is set', () => {
    const answered = show({ shortcuts: before })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    answered({ shortcuts: after })

    const undo = screen.getByRole('button', {
      name: 'Remettre les touches d’avant pour Déplacement rapide'
    })

    expect(keyCapsOf(undo)).toStrictEqual(['Alt', 'W'])
  })

  it('puts the previous keys back, and offers nothing more', () => {
    const answered = show({ shortcuts: before })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    answered({ shortcuts: after })

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remettre les touches d’avant pour Déplacement rapide'
      })
    )

    expect(bridge.setShortcut).toHaveBeenLastCalledWith('walk', 'Alt+KeyW')

    answered({ shortcuts: before })

    expect(
      screen.queryByRole('button', {
        name: 'Remettre les touches d’avant pour Déplacement rapide'
      })
    ).toBeNull()
  })

  it('offers nothing while nothing has been changed', () => {
    show({ shortcuts: after })

    expect(
      screen.queryByRole('button', {
        name: 'Remettre les touches d’avant pour Déplacement rapide'
      })
    ).toBeNull()
  })

  it('offers to put no key back when there was none', () => {
    const answered = show({ shortcuts: [shortcut('walk')] })

    fireEvent.click(fieldOf('walk'))
    strike(fieldOf('walk'), { code: 'KeyW', ctrlKey: true, shiftKey: true })
    answered({ shortcuts: after })

    expect(
      screen.getByRole('button', {
        name: 'Remettre les touches d’avant pour Déplacement rapide'
      }).textContent
    ).toBe('Remettre : aucune touche')
  })
})

describe('the shortcuts screen, the original keys', () => {
  it('offers nothing while nothing has moved', () => {
    show({ shortcuts: [shortcut('walk'), shortcut('next')] })

    expect(
      screen.queryByRole('button', { name: 'Remettre les touches d’origine' })
    ).toBeNull()
  })

  it('offers to put everything back as soon as a key has moved', () => {
    show({
      shortcuts: [shortcut('walk'), shortcut('next', { isDefault: false })]
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Remettre les touches d’origine' })
    )

    expect(bridge.resetShortcuts).toHaveBeenCalledWith()
  })

  it('forgets the undos when everything is put back to the original', () => {
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
      screen.getByRole('button', { name: 'Remettre les touches d’origine' })
    )

    expect(
      screen.queryByRole('button', {
        name: 'Remettre les touches d’avant pour Déplacement rapide'
      })
    ).toBeNull()
  })
})

describe('the shortcuts screen, what Rust answers about a combination', () => {
  it('says nothing will happen without keys', () => {
    show({ shortcuts: [shortcut('walk')] })

    expect(
      screen.getByText('Sans touches, il ne se passera rien.')
    ).not.toBeNull()
  })

  it('says another program has already taken those keys', () => {
    show({
      shortcuts: [
        shortcut('walk', {
          accelerator: 'Control+KeyW',
          status: { kind: 'refused', detail: 'HOTKEY_ALREADY_REGISTERED' }
        })
      ]
    })

    expect(screen.getByRole('alert').textContent).toBe(
      'Refusé : un autre logiciel utilise déjà ces touches.'
    )
  })

  it('names the action that already holds the same keys', () => {
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
      'Déjà pris par « Personnage suivant ».'
    )
  })

  it('names the quick text that already holds the same keys', () => {
    show({
      shortcuts: [
        shortcut('walk', {
          accelerator: 'Control+KeyR',
          status: {
            kind: 'duplicate',
            binding: { kind: 'quickText', id: 7 }
          }
        })
      ],
      quickTexts: [quickTextOf({ id: 7, text: 'Bonjour' })]
    })

    expect(screen.getByRole('alert').textContent).toBe(
      'Déjà pris par le texte rapide « Bonjour ».'
    )
  })

  it('says nothing when the combination is properly registered', () => {
    show({
      shortcuts: [shortcut('walk', { accelerator: 'Control+KeyW' })]
    })

    expect(screen.queryByRole('alert')).toBeNull()
    expect(
      screen.queryByText('Sans touches, il ne se passera rien.')
    ).toBeNull()
  })
})

describe('the shortcuts screen, one character one key', () => {
  const ALPHA = characterOf({ nickname: 'Alpha' })
  const BRAVO = characterOf({ nickname: 'Bravo', online: false })

  it('carries one row per character of the roster, online or not', () => {
    show({ characters: [ALPHA, BRAVO] })

    expect(screen.getByText('Un personnage, une touche')).not.toBeNull()
    expect(fieldOfCharacter('Alpha')).not.toBeNull()
    expect(fieldOfCharacter('Bravo')).not.toBeNull()
  })

  it('shows the color of each character at the edge of its row', () => {
    show({
      characters: [
        characterOf({ nickname: 'Alpha', color: 'earth' }),
        characterOf({ nickname: 'Bravo', color: null })
      ]
    })

    const stripes = [...document.querySelectorAll('.stripe')]

    expect(stripes).toHaveLength(1)
    expect(stripes[0].classList).toContain('tint-earth')
  })

  it('says where the characters come from when the roster is empty', () => {
    show({ characters: [] })

    expect(
      screen.getByText(
        'Entrez en jeu, et vos personnages se posent ici tout seuls.'
      )
    ).not.toBeNull()
  })

  it('gives no key to a character, and does not warn about it', () => {
    show({ characters: [ALPHA] })

    expect(keyCapsOf(fieldOfCharacter('Alpha'))).toStrictEqual([])
    expect(
      screen.queryByText('Sans touches, il ne se passera rien.')
    ).toBeNull()
  })

  it('sets the hit key on the character, and closes the capture', () => {
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
    expect(screen.queryByText('Appuyez sur vos touches')).toBeNull()
  })

  it('clears the key of a character on Backspace', () => {
    show({ characters: [characterOf({ shortcut: 'F1' })] })

    fireEvent.click(fieldOfCharacter('Alpha'))
    fireEvent.keyDown(fieldOfCharacter('Alpha'), {
      key: 'Backspace',
      code: 'Backspace'
    })

    expect(bridge.setCharacterShortcut).toHaveBeenCalledWith('Alpha', null)
  })

  it('opens the capture only on the clicked row, actions included', () => {
    show({ shortcuts: [shortcut('next')], characters: [ALPHA] })

    fireEvent.click(fieldOf('next'))
    fireEvent.click(fieldOfCharacter('Alpha'))

    expect(screen.getAllByText('Appuyez sur vos touches')).toHaveLength(1)
    expect(
      within(fieldOfCharacter('Alpha')).getByText('Appuyez sur vos touches')
    ).not.toBeNull()
  })

  it('marks the main character with a star, and only it', () => {
    show({
      characters: [
        characterOf({ nickname: 'Alpha', main: true }),
        characterOf({ nickname: 'Bravo' })
      ]
    })

    expect(screen.getAllByText('Personnage principal')).toHaveLength(1)
  })

  it('names the character who already holds the same keys', () => {
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
      'Déjà pris par « Alpha ».'
    )
  })
})
