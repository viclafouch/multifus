import { describe, expect, it } from 'vitest'
import type { PairingProblem } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { QuickReply, ShortcutStatus } from '@/@types/shortcuts'
import type { UpdateStatus } from '@/@types/system'
import { IS_APPLE } from '@/constants/keyboard'
import { strings } from '@/constants/strings'
import type { TonedLine } from '@/helpers/wording'
import {
  authorizationLine,
  bindingLabel,
  characterPortraitLabel,
  characterPortraitTooltip,
  characterPresenceSubLine,
  characterStateLine,
  characterSubLine,
  classDialogNote,
  genderGroupHint,
  mainShortcutHint,
  missingGenderLine,
  pairingProblemLine,
  shortcutStatusLine,
  updateLine
} from '@/helpers/wording'

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
  readonly answer: TonedLine | null
}

const STATUS_CASES = {
  registered: {
    status: { kind: 'registered' },
    answer: null
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
  class: null,
  main: false,
  excluded: false,
  online: true,
  relayed: false
} as const satisfies Character

describe('updateLine', () => {
  it.each(Object.values(UPDATE_CASES))(
    'met en mots la mise à jour $update.kind',
    ({ update, line }) => {
      const written = updateLine(update)

      expect(written).toBe(line)
    }
  )
})

describe('pairingProblemLine', () => {
  it.each(Object.values(PAIRING_CASES))(
    'met en mots l’échec d’appariement $problem.kind',
    ({ problem, line }) => {
      const written = pairingProblemLine(problem)

      expect(written).toBe(line)
    }
  )
})

describe('shortcutStatusLine', () => {
  it.each(Object.values(STATUS_CASES))(
    'met en mots le statut $status.kind, avec le ton qui va avec',
    ({ status, answer }) => {
      const written = shortcutStatusLine(status, QUICK_REPLIES)

      expect(written).toStrictEqual(answer)
    }
  )

  it('nomme l’action qui tient déjà la combinaison', () => {
    const status = {
      kind: 'duplicate',
      binding: { kind: 'action', action: 'swap' }
    } as const

    const written = shortcutStatusLine(status, QUICK_REPLIES)

    expect(written?.text).toContain(strings.shortcuts.actions.swap.label)
  })

  it('nomme par son texte la quickReply qui tient déjà la combinaison', () => {
    const status = {
      kind: 'duplicate',
      binding: { kind: 'quickReply', id: 1 }
    } as const

    const written = shortcutStatusLine(status, QUICK_REPLIES)

    expect(written?.text).toContain('la réponse « prix libre »')
  })

  it('nomme une quickReply sans texte sans prétendre la citer', () => {
    const status = {
      kind: 'duplicate',
      binding: { kind: 'quickReply', id: 2 }
    } as const

    const written = shortcutStatusLine(status, QUICK_REPLIES)

    expect(written?.text).toContain(strings.shortcuts.quickReplies.unnamed)
  })
})

describe('bindingLabel', () => {
  it('coupe un texte trop long sur un caractère et non au milieu d’un', () => {
    const quickReplies = [
      { ...QUICK_REPLIES[0], text: 'é'.repeat(60) }
    ] as const satisfies readonly QuickReply[]

    const label = bindingLabel({ kind: 'quickReply', id: 1 }, quickReplies)

    expect(label).toBe(`la réponse « ${'é'.repeat(30)}… »`)
  })

  it('nomme une quickReply que le tableau ne porte plus', () => {
    const label = bindingLabel({ kind: 'quickReply', id: 404 }, QUICK_REPLIES)

    expect(label).toBe(strings.shortcuts.quickReplies.unnamed)
  })
})

describe('authorizationLine', () => {
  it('dit l’écoute active quand le système entend', () => {
    const line = authorizationLine({ granted: true, listening: true })

    expect(line).toBe(strings.status.listening)
  })

  it('dit l’écoute arrêtée quand elle ne tourne pas', () => {
    const line = authorizationLine({ granted: true, listening: false })

    expect(line).toBe(strings.status.notListening)
  })

  it('dit l’autorisation manquante avant tout le reste', () => {
    const line = authorizationLine({ granted: false, listening: true })

    expect(line).toBe(strings.status.denied)
  })
})

describe('characterSubLine', () => {
  it('réclame la classe tant qu’aucune n’est choisie', () => {
    const line = characterSubLine(ONLINE_CHARACTER)

    expect(line).toBe(
      `${strings.characters.classMissing} · ${strings.characters.online}`
    )
  })

  it('réclame le sexe d’une classe choisie sans lui', () => {
    const character = {
      ...ONLINE_CHARACTER,
      class: 'iop',
      gender: null
    } as const

    const line = characterSubLine(character)

    expect(line).toBe(
      `${strings.characters.genderMissing} · ${strings.characters.online}`
    )
  })

  it('dit la classe avant l’état une fois le portrait complet', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const line = characterSubLine(character)

    expect(line).toBe(`Iop · ${strings.characters.online}`)
  })
})

describe('characterPortraitLabel', () => {
  it('invite à choisir la classe tant qu’elle manque', () => {
    const label = characterPortraitLabel(ONLINE_CHARACTER)

    expect(label).toBe(strings.characters.classPick('Alpha'))
  })

  it('invite à choisir le sexe quand seule la classe est là', () => {
    const character = {
      ...ONLINE_CHARACTER,
      class: 'iop',
      gender: null
    } as const

    const label = characterPortraitLabel(character)

    expect(label).toBe(strings.characters.genderPick('Alpha'))
  })

  it('propose de changer le portrait une fois complet', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const label = characterPortraitLabel(character)

    expect(label).toBe(strings.characters.portraitChange('Alpha'))
  })
})

describe('characterPortraitTooltip', () => {
  it('invite à choisir la classe tant qu’elle manque', () => {
    const tooltip = characterPortraitTooltip(ONLINE_CHARACTER)

    expect(tooltip).toBe(strings.characters.classPick('Alpha'))
  })

  it('dit seulement Modifier une fois le portrait complet', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const tooltip = characterPortraitTooltip(character)

    expect(tooltip).toBe(strings.characters.portraitChangeShort)
  })
})

describe('characterPresenceSubLine', () => {
  it('dit la classe avant l’état', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const line = characterPresenceSubLine(character)

    expect(line).toBe(`Iop · ${strings.characters.online}`)
  })

  it('tait l’exclusion d’un personnage connecté et exclu', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true }

    const line = characterPresenceSubLine(character)

    expect(line).toBe(strings.characters.online)
  })

  it('dit la déconnexion d’un personnage déconnecté', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true, online: false }

    const line = characterPresenceSubLine(character)

    expect(line).toBe(strings.characters.offline)
  })
})

describe('missingGenderLine', () => {
  it('ne dit rien quand personne ne manque', () => {
    expect(missingGenderLine([])).toBeNull()
  })

  it('nomme un seul manquant au singulier', () => {
    const line = missingGenderLine(['Chafoin'])

    expect(line).toBe('Chafoin n’a pas de sexe : il ne bougera pas.')
  })

  it('nomme deux manquants sans les compter', () => {
    const line = missingGenderLine(['Chafoin', 'Bilou'])

    expect(line).toBe(
      'Chafoin et Bilou n’ont pas de sexe : ils ne bougeront pas.'
    )
  })

  it('nomme les deux premiers et compte le reste', () => {
    const line = missingGenderLine(['Chafoin', 'Bilou', 'Nabur', 'Elyandra'])

    expect(line).toBe(
      'Chafoin, Bilou et 2 autres n’ont pas de sexe : ils ne bougeront pas.'
    )
  })

  it('accorde le reste au singulier', () => {
    const line = missingGenderLine(['Chafoin', 'Bilou', 'Nabur'])

    expect(line).toBe(
      'Chafoin, Bilou et 1 autre n’ont pas de sexe : ils ne bougeront pas.'
    )
  })
})

describe('genderGroupHint', () => {
  it('propose d’exclure un sexe encore dans le défilement', () => {
    const hint = genderGroupHint({
      gender: 'male',
      isEmpty: false,
      isIncluded: true
    })

    expect(hint).toBe(strings.characters.excludeGroupLabel.male)
  })

  it('propose de réintégrer un sexe entièrement exclu', () => {
    const hint = genderGroupHint({
      gender: 'female',
      isEmpty: false,
      isIncluded: false
    })

    expect(hint).toBe(strings.characters.includeGroupLabel.female)
  })

  it('dit qu’un sexe n’a personne de connecté', () => {
    const hint = genderGroupHint({
      gender: 'female',
      isEmpty: true,
      isIncluded: false
    })

    expect(hint).toBe(strings.characters.emptyGroupLabel.female)
  })
})

describe('mainShortcutHint', () => {
  it('prévient qu’aucune étoile n’est posée', () => {
    const hint = mainShortcutHint([ONLINE_CHARACTER])

    expect(hint).toBe(strings.shortcuts.mainHint.noStar)
  })

  it('prévient aussi quand le roster est vide', () => {
    expect(mainShortcutHint([])).toBe(strings.shortcuts.mainHint.noStar)
  })

  it('prévient que celui qui porte l’étoile est déconnecté', () => {
    const character = { ...ONLINE_CHARACTER, main: true, online: false }

    const hint = mainShortcutHint([character])

    expect(hint).toBe(strings.shortcuts.mainHint.offline('Alpha'))
  })

  it('ne dit rien quand l’étoile est sur un connecté, même exclu', () => {
    const character = { ...ONLINE_CHARACTER, main: true, excluded: true }

    expect(mainShortcutHint([character])).toBeNull()
  })
})

describe('characterStateLine', () => {
  it('dit le défilement pour un personnage connecté et dedans', () => {
    const line = characterStateLine(ONLINE_CHARACTER)

    expect(line).toBe(strings.characters.online)
  })

  it('dit l’exclusion pour un personnage connecté et exclu', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true }

    const line = characterStateLine(character)

    expect(line).toBe(strings.characters.excluded)
  })

  it('dit la déconnexion avant l’exclusion pour un personnage déconnecté', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true, online: false }

    const line = characterStateLine(character)

    expect(line).toBe(strings.characters.offline)
  })
})

describe('classDialogNote', () => {
  it('says nothing while the head goes to the taskbar', () => {
    expect(IS_APPLE).toBe(false)
    expect(classDialogNote(true)).toBeNull()
  })

  it('says where the head went once somebody cut it', () => {
    expect(classDialogNote(false)).toBe(
      strings.characters.classDialogPortraitOff
    )
  })
})
