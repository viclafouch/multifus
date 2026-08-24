import { describe, expect, it } from 'vitest'
import type { PairingProblem } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { QuickReply, ShortcutStatus } from '@/@types/shortcuts'
import type { UpdateStatus } from '@/@types/system'
import { strings } from '@/constants/strings'
import type { TonedLine } from '@/helpers/wording'
import {
  authorizationLine,
  bindingLabel,
  characterStateLine,
  pairingProblemLine,
  shortcutStatusLine,
  updateLine
} from '@/helpers/wording'

/**
 * The quick replies live in `constants/strings`, so a case names the one it expects
 * instead of recopying it: what these functions decide is the branch.
 */
type UpdateCase = {
  readonly update: UpdateStatus
  readonly line: string
}

const UPDATE_CASES = {
  checking: {
    update: { kind: 'checking' },
    line: strings.about.updateChecking
  },
  upToDate: {
    update: { kind: 'upToDate' },
    line: strings.about.updateUpToDate
  },
  available: {
    update: { kind: 'available', version: '1.4.0' },
    line: strings.about.updateAvailable('1.4.0')
  },
  installing: {
    update: { kind: 'installing' },
    line: strings.about.updateInstalling
  },
  failed: {
    update: { kind: 'failed', detail: 'réseau injoignable' },
    line: strings.about.updateFailed('réseau injoignable')
  }
} as const satisfies Record<UpdateStatus['kind'], UpdateCase>

type PairingCase = {
  readonly problem: PairingProblem
  readonly line: string
}

const PAIRING_CASES = {
  tokenBlank: {
    problem: { kind: 'tokenBlank' },
    line: strings.relay.problem.tokenBlank
  },
  tokenRefused: {
    problem: { kind: 'tokenRefused', detail: 'HTTP 401' },
    line: strings.relay.problem.tokenRefused('HTTP 401')
  },
  noChat: {
    problem: { kind: 'noChat' },
    line: strings.relay.problem.noChat
  },
  keychain: {
    problem: { kind: 'keychain', detail: 'accès refusé' },
    line: strings.relay.problem.keychain('accès refusé')
  },
  network: {
    problem: { kind: 'network', detail: 'délai dépassé' },
    line: strings.relay.problem.network('délai dépassé')
  }
} as const satisfies Record<PairingProblem['kind'], PairingCase>

type StatusCase = {
  readonly status: ShortcutStatus
  readonly answer: TonedLine
}

const STATUS_CASES = {
  registered: {
    status: { kind: 'registered' },
    answer: { tone: 'calm', text: strings.shortcuts.status.registered }
  },
  unbound: {
    status: { kind: 'unbound' },
    answer: { tone: 'calm', text: strings.shortcuts.status.unbound }
  },
  pending: {
    status: { kind: 'pending' },
    answer: { tone: 'calm', text: strings.shortcuts.status.pending }
  },
  invalid: {
    status: { kind: 'invalid', detail: 'touche inconnue' },
    answer: { tone: 'bad', text: strings.shortcuts.status.invalid }
  },
  refused: {
    status: { kind: 'refused', detail: 'déjà prise' },
    answer: { tone: 'bad', text: strings.shortcuts.status.refused }
  },
  duplicate: {
    status: { kind: 'duplicate', binding: { kind: 'action', action: 'next' } },
    answer: {
      tone: 'bad',
      text: strings.shortcuts.status.duplicate(
        `« ${strings.shortcuts.actions.next.label} »`
      )
    }
  }
} as const satisfies Record<ShortcutStatus['kind'], StatusCase>

const QUICK_REPLIES = [
  {
    id: 1,
    text: 'prix libre',
    accelerator: 'Control+Shift+KeyP',
    status: { kind: 'registered' }
  },
  { id: 2, text: '', accelerator: null, status: { kind: 'unbound' } }
] as const satisfies readonly QuickReply[]

const ONLINE_CHARACTER = {
  nickname: 'Alpha',
  gender: 'male',
  asleep: false,
  online: true,
  relayed: false
} as const satisfies Character

describe('updateLine', () => {
  it.each(Object.values(UPDATE_CASES))(
    'met en mots la mise à jour $update.kind',
    ({ update, line }) => {
      // #when
      const written = updateLine(update)

      // #then
      expect(written).toBe(line)
    }
  )
})

describe('pairingProblemLine', () => {
  it.each(Object.values(PAIRING_CASES))(
    'met en mots l’échec d’appariement $problem.kind',
    ({ problem, line }) => {
      // #when
      const written = pairingProblemLine(problem)

      // #then
      expect(written).toBe(line)
    }
  )
})

describe('shortcutStatusLine', () => {
  it.each(Object.values(STATUS_CASES))(
    'met en mots le statut $status.kind, avec le ton qui va avec',
    ({ status, answer }) => {
      // #when
      const written = shortcutStatusLine(status, QUICK_REPLIES)

      // #then
      expect(written).toStrictEqual(answer)
    }
  )

  it('nomme l’action qui tient déjà la combinaison', () => {
    // #given
    const status = {
      kind: 'duplicate',
      binding: { kind: 'action', action: 'swap' }
    } as const

    // #when
    const { text } = shortcutStatusLine(status, QUICK_REPLIES)

    // #then
    expect(text).toContain(strings.shortcuts.actions.swap.label)
  })

  it('nomme par son texte la quickReply qui tient déjà la combinaison', () => {
    // #given
    const status = {
      kind: 'duplicate',
      binding: { kind: 'quickReply', id: 1 }
    } as const

    // #when
    const { text } = shortcutStatusLine(status, QUICK_REPLIES)

    // #then
    expect(text).toContain('la réponse « prix libre »')
  })

  it('nomme une quickReply sans texte sans prétendre la citer', () => {
    // #given
    const status = {
      kind: 'duplicate',
      binding: { kind: 'quickReply', id: 2 }
    } as const

    // #when
    const { text } = shortcutStatusLine(status, QUICK_REPLIES)

    // #then
    expect(text).toContain(strings.shortcuts.quickReplies.unnamed)
  })
})

describe('bindingLabel', () => {
  it('coupe un texte trop long sur un caractère et non au milieu d’un', () => {
    // #given
    const quickReplies = [
      { ...QUICK_REPLIES[0], text: 'é'.repeat(60) }
    ] as const satisfies readonly QuickReply[]

    // #when
    const label = bindingLabel({ kind: 'quickReply', id: 1 }, quickReplies)

    // #then
    expect(label).toBe(`la réponse « ${'é'.repeat(30)}… »`)
  })

  it('nomme une quickReply que le tableau ne porte plus', () => {
    // #when
    const label = bindingLabel({ kind: 'quickReply', id: 404 }, QUICK_REPLIES)

    // #then
    expect(label).toBe(strings.shortcuts.quickReplies.unnamed)
  })
})

describe('authorizationLine', () => {
  it('dit l’écoute active quand le système entend', () => {
    // #when
    const line = authorizationLine({ granted: true, listening: true })

    // #then
    expect(line).toBe(strings.status.listening)
  })

  it('dit l’écoute arrêtée quand elle ne tourne pas', () => {
    // #when
    const line = authorizationLine({ granted: true, listening: false })

    // #then
    expect(line).toBe(strings.status.notListening)
  })

  it('dit l’autorisation manquante avant tout le reste', () => {
    // #when
    const line = authorizationLine({ granted: false, listening: true })

    // #then
    expect(line).toBe(strings.status.denied)
  })
})

describe('characterStateLine', () => {
  it('dit le défilement pour un personnage connecté et réveillé', () => {
    // #when
    const line = characterStateLine(ONLINE_CHARACTER)

    // #then
    expect(line).toBe(strings.characters.inCycle)
  })

  it('dit la veille pour un personnage connecté et endormi', () => {
    // #given
    const character = { ...ONLINE_CHARACTER, asleep: true }

    // #when
    const line = characterStateLine(character)

    // #then
    expect(line).toBe(strings.characters.asleep)
  })

  it('dit hors ligne avant la veille pour un personnage déconnecté', () => {
    // #given
    const character = { ...ONLINE_CHARACTER, asleep: true, online: false }

    // #when
    const line = characterStateLine(character)

    // #then
    expect(line).toBe(strings.characters.offline)
  })
})
