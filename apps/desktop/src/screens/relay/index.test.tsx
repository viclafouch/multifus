import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { PairingStatus, RelayStatus, TestStatus } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import { screenSaverDelay } from '@/helpers/format'
import { characterOf, pending } from '@/test-doubles'

const bridge = {
  pairRelay: vi.fn(),
  unpairRelay: vi.fn(),
  testRelay: vi.fn(),
  setRelayActive: vi.fn(),
  setRelayed: vi.fn(),
  setSendBody: vi.fn(),
  openRelayLink: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

const { RelayScreen } = await import('@/screens/relay')

const relayOf = (fields: Partial<RelayStatus> = {}): RelayStatus => {
  return {
    paired: true,
    sendBody: true,
    active: false,
    ready: true,
    screenSaver: { kind: 'never' },
    pairing: { kind: 'idle' },
    switch: { kind: 'idle' },
    test: { kind: 'idle' },
    ...fields
  }
}

type ShowParams = {
  readonly relay?: Partial<RelayStatus>
  readonly characters?: readonly Character[]
}

const show = ({ relay = {}, characters = [] }: ShowParams = {}) => {
  render(
    <RelayScreen
      relay={relayOf(relay)}
      characters={characters}
      run={() => {}}
    />
  )
}

const GUIDE_TITLES = [
  'Ouvrez Telegram sur cet ordinateur',
  'Demandez un robot à BotFather',
  'Copiez le code du robot, collez-le ci-dessous',
  'Écrivez « salut » à votre robot',
  'Cliquez sur Connecter'
]

const switchNamed = (label: string) => {
  return screen.getByRole('switch', { name: label })
}

const relayedRows = () => {
  return screen.queryAllByRole('listitem').filter((row) => {
    return within(row).queryByRole('switch') !== null
  })
}

describe('the private messages screen, while the phone is not linked', () => {
  const notPaired = { paired: false, ready: false }

  it('unfolds the five steps and asks for the code of the bot', () => {
    show({ relay: notPaired })

    expect(screen.getByText('Relier votre téléphone')).not.toBeNull()
    expect(screen.getByLabelText('Code du robot')).not.toBeNull()

    for (const title of GUIDE_TITLES) {
      expect(screen.getByText(title)).not.toBeNull()
    }
  })

  it('hides everything that only makes sense once linked', () => {
    show({ relay: notPaired })

    expect(
      screen.queryByText('Recevoir mes messages privés sur mon téléphone')
    ).toBeNull()
    expect(screen.queryByText('Robot Telegram relié')).toBeNull()
    expect(screen.queryByText('Message d’essai')).toBeNull()
  })

  it('keeps the code of the bot out of sight while it is typed', () => {
    show({ relay: notPaired })

    expect(screen.getByLabelText('Code du robot').getAttribute('type')).toBe(
      'password'
    )
  })

  it('sends Rust the pasted code, once the connect button is clicked', () => {
    show({ relay: notPaired })

    fireEvent.change(screen.getByLabelText('Code du robot'), {
      target: { value: '  1234:abcd  ' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Connecter' }))

    expect(bridge.pairRelay).toHaveBeenCalledWith('  1234:abcd  ')
  })

  it('lets an empty code leave, and it is Rust that refuses', () => {
    show({ relay: notPaired })

    fireEvent.click(screen.getByRole('button', { name: 'Connecter' }))

    expect(bridge.pairRelay).toHaveBeenCalledWith('')
  })

  it('says the connection is going on, and no longer offers to connect', () => {
    show({ relay: { ...notPaired, pairing: { kind: 'working' } } })

    expect(
      screen
        .getByRole('button', { name: 'Connexion…' })
        .getAttribute('aria-busy')
    ).toBe('true')
    expect(screen.queryByRole('button', { name: 'Connecter' })).toBeNull()
  })

  it('recalls step 4 when the player has not said hello to their bot', () => {
    const pairing: PairingStatus = {
      kind: 'failed',
      problem: { kind: 'noChat' }
    }

    show({ relay: { ...notPaired, pairing } })

    expect(screen.getByRole('alert').textContent).toBe(
      'Le code est bon. Il ne manque que l’étape 4, votre « salut » au robot.'
    )
  })

  it('marks the field at fault and links it to the reason of the refusal', () => {
    const pairing: PairingStatus = {
      kind: 'failed',
      problem: { kind: 'tokenRefused', detail: '401' }
    }

    show({ relay: { ...notPaired, pairing } })

    const field = screen.getByLabelText('Code du robot')
    const alert = screen.getByRole('alert')

    expect(field.getAttribute('aria-invalid')).toBe('true')
    expect(field.getAttribute('aria-describedby')).toBe(alert.id)
    expect(alert.textContent).toBe(
      'Telegram ne reconnaît pas ce code. Recopiez-le en entier (401).'
    )
  })

  it('opens Telegram and BotFather without leaving the screen', () => {
    show({ relay: notPaired })

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Telegram Web' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir BotFather' }))

    expect(bridge.openRelayLink).toHaveBeenNthCalledWith(1, 'web')
    expect(bridge.openRelayLink).toHaveBeenNthCalledWith(2, 'botFather')
  })
})

describe('the private messages screen, once the phone is linked', () => {
  it('replaces the guide with the switch, the bot and the test', () => {
    show({ relay: { paired: true } })

    expect(screen.queryByText('Relier votre téléphone')).toBeNull()
    expect(
      screen.getByText('Recevoir mes messages privés sur mon téléphone')
    ).not.toBeNull()
    expect(screen.getByText('Robot Telegram relié')).not.toBeNull()
    expect(screen.getByText('Message d’essai')).not.toBeNull()
  })

  it('says everything is ready, with the sending stopped', () => {
    show({ relay: { active: false, ready: true } })

    expect(screen.getByText('À l’arrêt')).not.toBeNull()
    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-checked')
    ).toBe('false')
  })

  it('says the sending is running', () => {
    show({ relay: { active: true, ready: true } })

    expect(screen.getByText('En marche')).not.toBeNull()
    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-checked')
    ).toBe('true')
  })

  it('says it has nobody to listen to when no character is relayed', () => {
    show({ relay: { active: false, ready: false } })

    expect(screen.getByText('Aucun personnage connecté')).not.toBeNull()
  })

  it('starts the sending when the switch is moved', () => {
    show({ relay: { active: false } })

    fireEvent.click(
      switchNamed('Recevoir mes messages privés sur mon téléphone')
    )

    expect(bridge.setRelayActive).toHaveBeenCalledWith(true)
  })

  it('cuts the sending when the switch is moved again', () => {
    show({ relay: { active: true } })

    fireEvent.click(
      switchNamed('Recevoir mes messages privés sur mon téléphone')
    )

    expect(bridge.setRelayActive).toHaveBeenCalledWith(false)
  })

  it('says why the start failed, and links the switch to the reason', () => {
    show({
      relay: {
        switch: {
          kind: 'failed',
          reason: { reason: 'network', detail: 'timeout' }
        }
      }
    })

    const alert = screen.getByRole('alert')

    expect(alert.textContent).toBe(
      'Telegram n’a pas répondu. Vérifiez votre connexion (timeout).'
    )
    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-describedby')
    ).toBe(alert.id)
  })

  it('links the switch to nothing while nothing has failed', () => {
    show({ relay: { switch: { kind: 'idle' } } })

    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-describedby')
    ).toBeNull()
  })

  it('says the start is going on', () => {
    show({ relay: { switch: { kind: 'starting' } } })

    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-busy')
    ).toBe('true')
  })

  it('removes the bot on request', () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Retirer ce robot' }))

    expect(bridge.unpairRelay).toHaveBeenCalledWith()
  })

  it('says the removal of the bot is going on', () => {
    show({ relay: { pairing: { kind: 'working' } } })

    expect(
      screen.getByRole('button', { name: 'Retrait…' }).getAttribute('aria-busy')
    ).toBe('true')
  })
})

describe('the private messages screen, the test message', () => {
  it('leaves on request', () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer un essai' }))

    expect(bridge.testRelay).toHaveBeenCalledWith()
  })

  it('says nothing while no test has left', () => {
    show({ relay: { test: { kind: 'idle' } } })

    expect(
      screen
        .getByRole('button', { name: 'Envoyer un essai' })
        .getAttribute('aria-describedby')
    ).toBeNull()
  })

  it('invites to look at the phone once the test has left', () => {
    show({ relay: { test: { kind: 'sent' } } })

    expect(screen.getByRole('status').textContent).toBe(
      'C’est parti. Regardez votre téléphone.'
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('asks to wait when two tests follow each other too closely', () => {
    show({ relay: { test: { kind: 'tooSoon' } } })

    expect(screen.getByRole('status').textContent).toBe(
      'Un essai vient de partir. Attendez une trentaine de secondes avant le suivant.'
    )
  })

  it('shouts when Telegram refused the test', () => {
    const test: TestStatus = {
      kind: 'failed',
      reason: { reason: 'telegram', detail: '403' }
    }

    show({ relay: { test } })

    expect(screen.getByRole('alert').textContent).toBe(
      'Telegram a refusé la demande (403).'
    )
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('says the test is going on', () => {
    show({ relay: { test: { kind: 'working' } } })

    expect(
      screen.getByRole('button', { name: 'Envoi…' }).getAttribute('aria-busy')
    ).toBe('true')
  })
})

describe('the private messages screen, the relayed characters', () => {
  it('invites to connect a character when the roster is empty', () => {
    show({ characters: [] })

    expect(
      screen.getByText(
        'Connectez un personnage dans Dofus Retro : il arrive ici, déjà coché.'
      )
    ).not.toBeNull()
    expect(relayedRows()).toHaveLength(0)
  })

  it('carries one row per character of the roster', () => {
    show({
      characters: [
        characterOf({ nickname: 'Alpha' }),
        characterOf({ nickname: 'Bravo' })
      ]
    })

    expect(relayedRows()).toHaveLength(2)
    expect(
      screen.queryByText(
        'Connectez un personnage dans Dofus Retro : il arrive ici, déjà coché.'
      )
    ).toBeNull()
  })

  it('shows the color of each character at the edge of its row', () => {
    show({
      characters: [
        characterOf({ nickname: 'Alpha', color: 'violet' }),
        characterOf({ nickname: 'Bravo', color: null })
      ]
    })

    const [alpha, bravo] = relayedRows()

    expect(alpha.querySelector('.stripe')?.classList).toContain('tint-violet')
    expect(bravo.querySelector('.stripe')).toBeNull()
  })

  it('relays a character when its row is checked', () => {
    show({ characters: [characterOf({ nickname: 'Alpha', relayed: false })] })

    fireEvent.click(switchNamed('Relayer Alpha'))

    expect(bridge.setRelayed).toHaveBeenCalledWith('Alpha', true)
  })

  it('stops relaying a character when its row is unchecked', () => {
    show({ characters: [characterOf({ nickname: 'Alpha' })] })

    fireEvent.click(switchNamed('Relayer Alpha'))

    expect(bridge.setRelayed).toHaveBeenCalledWith('Alpha', false)
  })

  it('keeps checked a character the game has just disconnected', () => {
    show({ characters: [characterOf({ nickname: 'Alpha', online: false })] })

    const toggle = switchNamed('Relayer Alpha')

    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(toggle.getAttribute('aria-disabled')).toBeNull()
  })

  it('says the class and the presence of each character', () => {
    show({
      characters: [
        characterOf({ nickname: 'Alpha' }),
        characterOf({ nickname: 'Bravo', online: false })
      ]
    })

    const subLines = relayedRows().map((row) => {
      return within(row).getByText(/^Iop · /u).textContent
    })

    expect(subLines).toStrictEqual(['Iop · Connecté', 'Iop · Déconnecté'])
  })

  it('never says a character is excluded, the exclusion does not count here', () => {
    show({ characters: [characterOf({ nickname: 'Alpha', excluded: true })] })

    expect(screen.getByText('Iop · Connecté')).not.toBeNull()
    expect(screen.queryByText(/Exclu/u)).toBeNull()
  })
})

describe('the private messages screen, the rest of the screen', () => {
  it('stops sending the text of the message when it is unchecked', () => {
    show({ relay: { sendBody: true } })

    fireEvent.click(switchNamed('Recevoir ce que le joueur a écrit'))

    expect(bridge.setSendBody).toHaveBeenCalledWith(false)
  })

  it('says nothing about the screen saver when it never starts', () => {
    show({ relay: { screenSaver: { kind: 'never' } } })

    expect(
      screen.queryByText('Votre écran de veille peut tout arrêter')
    ).toBeNull()
  })

  it('says nothing about the screen saver when Multifus does not know', () => {
    show({ relay: { screenSaver: { kind: 'unknown' } } })

    expect(
      screen.queryByText('Votre écran de veille peut tout arrêter')
    ).toBeNull()
  })

  it('warns when the screen saver can stop everything', () => {
    show({ relay: { screenSaver: { kind: 'after', seconds: 600 } } })

    const delay = screenSaverDelay(600)
    const warning = `Multifus garde l’écran allumé, mais votre écran de veille démarre après ${delay} et verrouille l’ordinateur. Multifus n’entend plus le jeu, et vous ne recevez plus rien. Réglez-le sur Jamais.`

    expect(
      screen.getByText('Votre écran de veille peut tout arrêter')
    ).not.toBeNull()
    expect(screen.getByText(warning)).not.toBeNull()
  })

  it('leads to the explanation of the Telegram bot', () => {
    show()

    fireEvent.click(
      screen.getByRole('button', { name: 'À quoi sert un robot Telegram ?' })
    )

    expect(bridge.openRelayLink).toHaveBeenCalledWith('faq')
  })
})
