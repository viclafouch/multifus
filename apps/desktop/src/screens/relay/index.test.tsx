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

describe('l’écran des messages privés, tant que le téléphone n’est pas relié', () => {
  const notPaired = { paired: false, ready: false }

  it('déroule les cinq étapes et demande le code du robot', () => {
    show({ relay: notPaired })

    expect(screen.getByText('Relier votre téléphone')).not.toBeNull()
    expect(screen.getByLabelText('Code du robot')).not.toBeNull()

    for (const title of GUIDE_TITLES) {
      expect(screen.getByText(title)).not.toBeNull()
    }
  })

  it('cache tout ce qui n’a de sens qu’une fois relié', () => {
    show({ relay: notPaired })

    expect(
      screen.queryByText('Recevoir mes messages privés sur mon téléphone')
    ).toBeNull()
    expect(screen.queryByText('Robot Telegram relié')).toBeNull()
    expect(screen.queryByText('Message d’essai')).toBeNull()
  })

  it('garde le code du robot hors de vue pendant la frappe', () => {
    show({ relay: notPaired })

    expect(screen.getByLabelText('Code du robot').getAttribute('type')).toBe(
      'password'
    )
  })

  it('envoie à Rust le code collé, une fois Connecter cliqué', () => {
    show({ relay: notPaired })

    fireEvent.change(screen.getByLabelText('Code du robot'), {
      target: { value: '  1234:abcd  ' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Connecter' }))

    expect(bridge.pairRelay).toHaveBeenCalledWith('  1234:abcd  ')
  })

  it('laisse partir un code vide, et c’est Rust qui refuse', () => {
    show({ relay: notPaired })

    fireEvent.click(screen.getByRole('button', { name: 'Connecter' }))

    expect(bridge.pairRelay).toHaveBeenCalledWith('')
  })

  it('dit que la connexion est en cours, et n’offre plus Connecter', () => {
    show({ relay: { ...notPaired, pairing: { kind: 'working' } } })

    expect(
      screen
        .getByRole('button', { name: 'Connexion…' })
        .getAttribute('aria-busy')
    ).toBe('true')
    expect(screen.queryByRole('button', { name: 'Connecter' })).toBeNull()
  })

  it('rappelle l’étape 4 quand le joueur n’a pas dit salut à son robot', () => {
    const pairing: PairingStatus = {
      kind: 'failed',
      problem: { kind: 'noChat' }
    }

    show({ relay: { ...notPaired, pairing } })

    expect(screen.getByRole('alert').textContent).toBe(
      'Le code est bon. Il ne manque que l’étape 4, votre « salut » au robot.'
    )
  })

  it('marque le champ en faute et le relie à la raison du refus', () => {
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

  it('ouvre Telegram et BotFather sans quitter l’écran', () => {
    show({ relay: notPaired })

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Telegram Web' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir BotFather' }))

    expect(bridge.openRelayLink).toHaveBeenNthCalledWith(1, 'web')
    expect(bridge.openRelayLink).toHaveBeenNthCalledWith(2, 'botFather')
  })
})

describe('l’écran des messages privés, une fois le téléphone relié', () => {
  it('remplace le guide par l’interrupteur, le robot et l’essai', () => {
    show({ relay: { paired: true } })

    expect(screen.queryByText('Relier votre téléphone')).toBeNull()
    expect(
      screen.getByText('Recevoir mes messages privés sur mon téléphone')
    ).not.toBeNull()
    expect(screen.getByText('Robot Telegram relié')).not.toBeNull()
    expect(screen.getByText('Message d’essai')).not.toBeNull()
  })

  it('dit que tout est prêt, l’envoi à l’arrêt', () => {
    show({ relay: { active: false, ready: true } })

    expect(screen.getByText('À l’arrêt')).not.toBeNull()
    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-checked')
    ).toBe('false')
  })

  it('dit que l’envoi est en marche', () => {
    show({ relay: { active: true, ready: true } })

    expect(screen.getByText('En marche')).not.toBeNull()
    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-checked')
    ).toBe('true')
  })

  it('dit qu’il n’a personne à écouter quand aucun personnage n’est relayé', () => {
    show({ relay: { active: false, ready: false } })

    expect(screen.getByText('Aucun personnage connecté')).not.toBeNull()
  })

  it('met l’envoi en marche quand on bouge l’interrupteur', () => {
    show({ relay: { active: false } })

    fireEvent.click(
      switchNamed('Recevoir mes messages privés sur mon téléphone')
    )

    expect(bridge.setRelayActive).toHaveBeenCalledWith(true)
  })

  it('coupe l’envoi quand on rebouge l’interrupteur', () => {
    show({ relay: { active: true } })

    fireEvent.click(
      switchNamed('Recevoir mes messages privés sur mon téléphone')
    )

    expect(bridge.setRelayActive).toHaveBeenCalledWith(false)
  })

  it('dit pourquoi la mise en marche a échoué, et relie l’interrupteur à la raison', () => {
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

  it('ne relie l’interrupteur à rien tant que rien n’a échoué', () => {
    show({ relay: { switch: { kind: 'idle' } } })

    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-describedby')
    ).toBeNull()
  })

  it('dit que la mise en marche est en cours', () => {
    show({ relay: { switch: { kind: 'starting' } } })

    expect(
      switchNamed(
        'Recevoir mes messages privés sur mon téléphone'
      ).getAttribute('aria-busy')
    ).toBe('true')
  })

  it('retire le robot à la demande', () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Retirer ce robot' }))

    expect(bridge.unpairRelay).toHaveBeenCalledWith()
  })

  it('dit que le retrait du robot est en cours', () => {
    show({ relay: { pairing: { kind: 'working' } } })

    expect(
      screen.getByRole('button', { name: 'Retrait…' }).getAttribute('aria-busy')
    ).toBe('true')
  })
})

describe('l’écran des messages privés, le message d’essai', () => {
  it('part à la demande', () => {
    show()

    fireEvent.click(screen.getByRole('button', { name: 'Envoyer un essai' }))

    expect(bridge.testRelay).toHaveBeenCalledWith()
  })

  it('ne dit rien tant qu’aucun essai n’est parti', () => {
    show({ relay: { test: { kind: 'idle' } } })

    expect(
      screen
        .getByRole('button', { name: 'Envoyer un essai' })
        .getAttribute('aria-describedby')
    ).toBeNull()
  })

  it('invite à regarder le téléphone une fois l’essai parti', () => {
    show({ relay: { test: { kind: 'sent' } } })

    expect(screen.getByRole('status').textContent).toBe(
      'C’est parti. Regardez votre téléphone.'
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('demande d’attendre quand deux essais se suivent de trop près', () => {
    show({ relay: { test: { kind: 'tooSoon' } } })

    expect(screen.getByRole('status').textContent).toBe(
      'Un essai vient de partir. Attendez une trentaine de secondes avant le suivant.'
    )
  })

  it('crie quand Telegram a refusé l’essai', () => {
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

  it('dit que l’essai est en cours', () => {
    show({ relay: { test: { kind: 'working' } } })

    expect(
      screen.getByRole('button', { name: 'Envoi…' }).getAttribute('aria-busy')
    ).toBe('true')
  })
})

describe('l’écran des messages privés, les personnages relayés', () => {
  it('invite à connecter un personnage quand le roster est vide', () => {
    show({ characters: [] })

    expect(
      screen.getByText(
        'Connectez un personnage dans Dofus Retro : il arrive ici, déjà coché.'
      )
    ).not.toBeNull()
    expect(relayedRows()).toHaveLength(0)
  })

  it('porte une ligne par personnage du roster', () => {
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

  it('montre la couleur de chaque personnage au bord de sa ligne', () => {
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

  it('relaie un personnage quand on coche sa ligne', () => {
    show({ characters: [characterOf({ nickname: 'Alpha', relayed: false })] })

    fireEvent.click(switchNamed('Relayer Alpha'))

    expect(bridge.setRelayed).toHaveBeenCalledWith('Alpha', true)
  })

  it('cesse de relayer un personnage quand on décoche sa ligne', () => {
    show({ characters: [characterOf({ nickname: 'Alpha' })] })

    fireEvent.click(switchNamed('Relayer Alpha'))

    expect(bridge.setRelayed).toHaveBeenCalledWith('Alpha', false)
  })

  it('garde coché un personnage que le jeu vient de déconnecter', () => {
    show({ characters: [characterOf({ nickname: 'Alpha', online: false })] })

    const toggle = switchNamed('Relayer Alpha')

    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(toggle.getAttribute('aria-disabled')).toBeNull()
  })

  it('dit la classe et la présence de chaque personnage', () => {
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

  it('ne dit jamais qu’un personnage est exclu, l’exclusion ne compte pas ici', () => {
    show({ characters: [characterOf({ nickname: 'Alpha', excluded: true })] })

    expect(screen.getByText('Iop · Connecté')).not.toBeNull()
    expect(screen.queryByText(/Exclu/u)).toBeNull()
  })
})

describe('l’écran des messages privés, le reste de l’écran', () => {
  it('cesse d’envoyer le texte du message quand on décoche', () => {
    show({ relay: { sendBody: true } })

    fireEvent.click(switchNamed('Recevoir ce que le joueur a écrit'))

    expect(bridge.setSendBody).toHaveBeenCalledWith(false)
  })

  it('ne dit rien de l’écran de veille quand il ne démarre jamais', () => {
    show({ relay: { screenSaver: { kind: 'never' } } })

    expect(
      screen.queryByText('Votre écran de veille peut tout arrêter')
    ).toBeNull()
  })

  it('ne dit rien de l’écran de veille quand Multifus ne sait pas', () => {
    show({ relay: { screenSaver: { kind: 'unknown' } } })

    expect(
      screen.queryByText('Votre écran de veille peut tout arrêter')
    ).toBeNull()
  })

  it('avertit quand l’écran de veille peut tout arrêter', () => {
    show({ relay: { screenSaver: { kind: 'after', seconds: 600 } } })

    const delay = screenSaverDelay(600)
    const warning = `Multifus garde l’écran allumé, mais votre écran de veille démarre après ${delay} et verrouille l’ordinateur. Multifus n’entend plus le jeu, et vous ne recevez plus rien. Réglez-le sur Jamais.`

    expect(
      screen.getByText('Votre écran de veille peut tout arrêter')
    ).not.toBeNull()
    expect(screen.getByText(warning)).not.toBeNull()
  })

  it('mène vers l’explication du robot Telegram', () => {
    show()

    fireEvent.click(
      screen.getByRole('button', { name: 'À quoi sert un robot Telegram ?' })
    )

    expect(bridge.openRelayLink).toHaveBeenCalledWith('faq')
  })
})
