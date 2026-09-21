import { describe, expect, it } from 'vitest'
import type { PairingProblem, RelayFailure } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { QuickText, ShortcutStatus } from '@/@types/shortcuts'
import type { UpdateStatus } from '@/@types/system'
import { IS_APPLE } from '@/constants/keyboard'
import type { TonedLine } from '@/helpers/wording'
import {
  bindingLabel,
  characterMarksLabel,
  characterMarksTooltip,
  characterPresenceSubLine,
  characterStateLine,
  characterSubLine,
  cycleToggleTooltip,
  dialogNote,
  genderGroupHint,
  listeningLine,
  missingGenderLine,
  pairingProblemLine,
  relayFailureLine,
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
    line: 'Vérification en cours…'
  },
  upToDate: {
    update: { kind: 'upToDate' },
    line: 'Vous êtes à jour.'
  },
  available: {
    update: { kind: 'available', version: '1.4.0' },
    line: 'La version 1.4.0 est prête. Multifus se relancera tout seul, sans toucher à vos clients.'
  },
  installing: {
    update: { kind: 'installing' },
    line: 'Téléchargement en cours…'
  },
  failed: {
    update: { kind: 'failed', detail: 'réseau injoignable' },
    line: 'La mise à jour a échoué : réseau injoignable'
  }
} as const satisfies Record<UpdateStatus['kind'], UpdateCase>

type PairingCase = {
  readonly problem: PairingProblem
  readonly line: string
}

const PAIRING_CASES = {
  tokenBlank: {
    problem: { kind: 'tokenBlank' },
    line: 'Collez d’abord le code que BotFather vous a envoyé.'
  },
  tokenRefused: {
    problem: { kind: 'tokenRefused', detail: 'HTTP 401' },
    line: 'Telegram ne reconnaît pas ce code. Recopiez-le en entier (HTTP 401).'
  },
  noChat: {
    problem: { kind: 'noChat' },
    line: 'Le code est bon. Il ne manque que l’étape 4, votre « salut » au robot.'
  },
  keychain: {
    problem: { kind: 'keychain', detail: 'accès refusé' },
    line: 'Le code n’a pas pu être enregistré, rien n’est gardé (accès refusé).'
  },
  network: {
    problem: { kind: 'network', detail: 'délai dépassé' },
    line: 'Telegram n’a pas répondu. Vérifiez votre connexion (délai dépassé).'
  }
} as const satisfies Record<PairingProblem['kind'], PairingCase>

type RelayFailureCase = {
  readonly failure: RelayFailure
  readonly line: string
}

const RELAY_FAILURE_CASES = {
  keychain: {
    failure: { reason: 'keychain', detail: 'accès refusé' },
    line: 'Multifus n’a pas retrouvé le code de votre robot (accès refusé). Retirez ce robot, puis refaites les cinq étapes.'
  },
  telegram: {
    failure: { reason: 'telegram', detail: 'HTTP 401' },
    line: 'Telegram a refusé la demande (HTTP 401).'
  },
  network: {
    failure: { reason: 'network', detail: 'délai dépassé' },
    line: 'Telegram n’a pas répondu. Vérifiez votre connexion (délai dépassé).'
  }
} as const satisfies Record<RelayFailure['reason'], RelayFailureCase>

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
    answer: { tone: 'calm', text: 'Sans touches, il ne se passera rien.' }
  },
  invalid: {
    status: { kind: 'invalid', detail: 'touche inconnue' },
    answer: {
      tone: 'bad',
      text: 'Ces touches ne peuvent pas servir de raccourci.'
    }
  },
  refused: {
    status: { kind: 'refused', detail: 'déjà prise' },
    answer: {
      tone: 'bad',
      text: 'Refusé : un autre logiciel utilise déjà ces touches.'
    }
  },
  duplicate: {
    status: { kind: 'duplicate', binding: { kind: 'action', action: 'next' } },
    answer: {
      tone: 'bad',
      text: 'Déjà pris par « Personnage suivant ».'
    }
  }
} as const satisfies Record<ShortcutStatus['kind'], StatusCase>

const QUICK_TEXTS = [
  {
    id: 1,
    text: 'prix libre',
    accelerator: 'Control+Shift+KeyP',
    status: { kind: 'registered' }
  },
  { id: 2, text: '', accelerator: null, status: { kind: 'unbound' } }
] as const satisfies readonly QuickText[]

const ONLINE_CHARACTER = {
  nickname: 'Alpha',
  gender: 'male',
  class: null,
  color: null,
  main: false,
  excluded: false,
  online: true,
  relayed: false,
  shortcut: null,
  shortcutStatus: { kind: 'unbound' }
} as const satisfies Character

describe('updateLine', () => {
  it.each(Object.values(UPDATE_CASES))(
    'puts into words the update $update.kind',
    ({ update, line }) => {
      const written = updateLine(update)

      expect(written).toBe(line)
    }
  )
})

describe('pairingProblemLine', () => {
  it.each(Object.values(PAIRING_CASES))(
    'puts into words the pairing failure $problem.kind',
    ({ problem, line }) => {
      const written = pairingProblemLine(problem)

      expect(written).toBe(line)
    }
  )
})

describe('relayFailureLine', () => {
  it.each(Object.values(RELAY_FAILURE_CASES))(
    'puts into words the relay failure $failure.reason',
    ({ failure, line }) => {
      const written = relayFailureLine(failure)

      expect(written).toBe(line)
    }
  )
})

describe('shortcutStatusLine', () => {
  it.each(Object.values(STATUS_CASES))(
    'puts into words the status $status.kind, with the tone that goes with it',
    ({ status, answer }) => {
      const written = shortcutStatusLine(status, QUICK_TEXTS)

      expect(written).toStrictEqual(answer)
    }
  )

  it('names the action that already holds the combination', () => {
    const status = {
      kind: 'duplicate',
      binding: { kind: 'action', action: 'walk' }
    } as const

    const written = shortcutStatusLine(status, QUICK_TEXTS)

    expect(written?.text).toContain('Déplacement rapide')
  })

  it('names by its text the quickText that already holds the combination', () => {
    const status = {
      kind: 'duplicate',
      binding: { kind: 'quickText', id: 1 }
    } as const

    const written = shortcutStatusLine(status, QUICK_TEXTS)

    expect(written?.text).toContain('le texte rapide « prix libre »')
  })

  it('names a quickText without text without pretending to quote it', () => {
    const status = {
      kind: 'duplicate',
      binding: { kind: 'quickText', id: 2 }
    } as const

    const written = shortcutStatusLine(status, QUICK_TEXTS)

    expect(written?.text).toContain('un texte rapide vide')
  })
})

describe('bindingLabel', () => {
  it('cuts a text that is too long on a character and not in the middle of one', () => {
    const quickTexts = [
      { ...QUICK_TEXTS[0], text: 'é'.repeat(60) }
    ] as const satisfies readonly QuickText[]

    const label = bindingLabel({ kind: 'quickText', id: 1 }, quickTexts)

    expect(label).toBe(`le texte rapide « ${'é'.repeat(30)}… »`)
  })

  it('names a quickText the table no longer carries', () => {
    const label = bindingLabel({ kind: 'quickText', id: 404 }, QUICK_TEXTS)

    expect(label).toBe('un texte rapide vide')
  })
})

describe('listeningLine', () => {
  it('says the listening is on when the system hears', () => {
    expect(listeningLine(true)).toBe('À l’écoute du jeu')
  })

  it('says the listening is stopped when it is not running', () => {
    expect(listeningLine(false)).toBe('Écoute interrompue')
  })
})

describe('characterSubLine', () => {
  it('asks for the class while none is chosen', () => {
    const line = characterSubLine(ONLINE_CHARACTER)

    expect(line).toBe(`Classe à choisir · Connecté`)
  })

  it('asks for the gender of a class chosen without it', () => {
    const character = {
      ...ONLINE_CHARACTER,
      class: 'iop',
      gender: null
    } as const

    const line = characterSubLine(character)

    expect(line).toBe(`Sexe à choisir · Connecté`)
  })

  it('says the class before the state once the portrait is complete', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const line = characterSubLine(character)

    expect(line).toBe(`Iop · Connecté`)
  })

  it('never names the color: it is seen, it is not read', () => {
    const character = {
      ...ONLINE_CHARACTER,
      class: 'iop',
      color: 'pine'
    } as const

    expect(characterSubLine(character)).toBe(`Iop · Connecté`)
    expect(characterPresenceSubLine(character)).toBe(`Iop · Connecté`)
  })
})

describe('characterMarksLabel', () => {
  it('invites to choose the class while it is missing', () => {
    const label = characterMarksLabel(ONLINE_CHARACTER)

    expect(label).toBe('Choisir la classe de Alpha')
  })

  it('invites to choose the gender when only the class is there', () => {
    const character = {
      ...ONLINE_CHARACTER,
      class: 'iop',
      gender: null
    } as const

    const label = characterMarksLabel(character)

    expect(label).toBe('Choisir le sexe de Alpha')
  })

  it('offers to change the portrait once it is complete', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const label = characterMarksLabel(character)

    expect(label).toBe('Changer la classe, le sexe ou la couleur de Alpha')
  })
})

describe('characterMarksTooltip', () => {
  it('invites to choose the class while it is missing', () => {
    const tooltip = characterMarksTooltip(ONLINE_CHARACTER)

    expect(tooltip).toBe('Choisir la classe de Alpha')
  })

  it('says only change once the portrait is complete', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const tooltip = characterMarksTooltip(character)

    expect(tooltip).toBe('Modifier')
  })
})

describe('cycleToggleTooltip', () => {
  it('offers to exclude a character who cycles', () => {
    const tooltip = cycleToggleTooltip(ONLINE_CHARACTER)

    expect(tooltip).toBe(
      'L’exclure du défilement, du Déplacement rapide et de l’AutoFocus'
    )
  })

  it('offers to bring back an excluded character', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true }

    const tooltip = cycleToggleTooltip(character)

    expect(tooltip).toBe(
      'Le réintégrer au défilement, au Déplacement rapide et à l’AutoFocus'
    )
  })

  it('says why the switch of an offline one does not move', () => {
    const character = { ...ONLINE_CHARACTER, online: false }

    const tooltip = cycleToggleTooltip(character)

    expect(tooltip).toBe('Déconnecté, il ne défile pas')
  })
})

describe('characterPresenceSubLine', () => {
  it('says the class before the state', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const line = characterPresenceSubLine(character)

    expect(line).toBe(`Iop · Connecté`)
  })

  it('keeps quiet about the exclusion of a character who is online and excluded', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true }

    const line = characterPresenceSubLine(character)

    expect(line).toBe('Connecté')
  })

  it('says the disconnection of an offline character', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true, online: false }

    const line = characterPresenceSubLine(character)

    expect(line).toBe('Déconnecté')
  })
})

describe('missingGenderLine', () => {
  it('says nothing when nobody is missing', () => {
    expect(missingGenderLine([])).toBeNull()
  })

  it('names a single missing one in the singular', () => {
    const line = missingGenderLine(['Chafoin'])

    expect(line).toBe('Chafoin n’a pas de sexe : il ne bougera pas.')
  })

  it('names two missing ones without counting them', () => {
    const line = missingGenderLine(['Chafoin', 'Bilou'])

    expect(line).toBe(
      'Chafoin et Bilou n’ont pas de sexe : ils ne bougeront pas.'
    )
  })

  it('names the first two and counts the rest', () => {
    const line = missingGenderLine(['Chafoin', 'Bilou', 'Nabur', 'Elyandra'])

    expect(line).toBe(
      'Chafoin, Bilou et 2 autres n’ont pas de sexe : ils ne bougeront pas.'
    )
  })

  it('agrees the rest in the singular', () => {
    const line = missingGenderLine(['Chafoin', 'Bilou', 'Nabur'])

    expect(line).toBe(
      'Chafoin, Bilou et 1 autre n’ont pas de sexe : ils ne bougeront pas.'
    )
  })
})

describe('genderGroupHint', () => {
  it('offers to exclude a gender still in the cycle', () => {
    const hint = genderGroupHint({
      gender: 'male',
      isEmpty: false,
      isIncluded: true
    })

    expect(hint).toBe('Exclure tous les hommes')
  })

  it('offers to bring back a gender that is entirely excluded', () => {
    const hint = genderGroupHint({
      gender: 'female',
      isEmpty: false,
      isIncluded: false
    })

    expect(hint).toBe('Réintégrer toutes les femmes')
  })

  it('says a gender has nobody online', () => {
    const hint = genderGroupHint({
      gender: 'female',
      isEmpty: true,
      isIncluded: false
    })

    expect(hint).toBe('Aucune femme connectée')
  })
})

describe('characterStateLine', () => {
  it('says the cycle for a character who is online and in it', () => {
    const line = characterStateLine(ONLINE_CHARACTER)

    expect(line).toBe('Connecté')
  })

  it('says the exclusion for a character who is online and excluded', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true }

    const line = characterStateLine(character)

    expect(line).toBe('Exclu des raccourcis')
  })

  it('says the disconnection before the exclusion for an offline character', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true, online: false }

    const line = characterStateLine(character)

    expect(line).toBe('Déconnecté')
  })
})

describe('dialogNote', () => {
  it('says nothing while the head goes to the taskbar', () => {
    expect(IS_APPLE).toBe(false)
    expect(dialogNote(true)).toBeNull()
  })

  it('says where the head went once somebody cut it', () => {
    expect(dialogNote(false)).toBe(
      'La tête de classe est coupée dans les Paramètres : le client garde son logo Dofus.'
    )
  })
})
