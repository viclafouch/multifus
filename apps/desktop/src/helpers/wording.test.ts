import { describe, expect, it } from 'vitest'
import type { PairingProblem } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { QuickReply, ShortcutStatus } from '@/@types/shortcuts'
import type { UpdateStatus } from '@/@types/system'
import { IS_APPLE } from '@/constants/keyboard'
import type { TonedLine } from '@/helpers/wording'
import {
  authorizationLine,
  bindingLabel,
  characterMarksLabel,
  characterMarksTooltip,
  characterPresenceSubLine,
  characterStateLine,
  characterSubLine,
  dialogNote,
  genderGroupHint,
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
      text: 'Déjà pris par « Fenêtre suivante ».'
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
      binding: { kind: 'action', action: 'walk' }
    } as const

    const written = shortcutStatusLine(status, QUICK_REPLIES)

    expect(written?.text).toContain('Déplacement rapide')
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

    expect(written?.text).toContain('une réponse sans texte')
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

    expect(label).toBe('une réponse sans texte')
  })
})

describe('authorizationLine', () => {
  it('dit l’écoute active quand le système entend', () => {
    const line = authorizationLine({ granted: true, listening: true })

    expect(line).toBe('À l’écoute du jeu')
  })

  it('dit l’écoute arrêtée quand elle ne tourne pas', () => {
    const line = authorizationLine({ granted: true, listening: false })

    expect(line).toBe('Écoute interrompue')
  })

  it('dit l’autorisation manquante avant tout le reste', () => {
    const line = authorizationLine({ granted: false, listening: true })

    expect(line).toBe('Autorisation manquante')
  })
})

describe('characterSubLine', () => {
  it('réclame la classe tant qu’aucune n’est choisie', () => {
    const line = characterSubLine(ONLINE_CHARACTER)

    expect(line).toBe(`Classe à choisir · Connecté`)
  })

  it('réclame le sexe d’une classe choisie sans lui', () => {
    const character = {
      ...ONLINE_CHARACTER,
      class: 'iop',
      gender: null
    } as const

    const line = characterSubLine(character)

    expect(line).toBe(`Sexe à choisir · Connecté`)
  })

  it('dit la classe avant l’état une fois le portrait complet', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const line = characterSubLine(character)

    expect(line).toBe(`Iop · Connecté`)
  })

  it('ne nomme jamais la couleur : elle se voit, elle ne se lit pas', () => {
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
  it('invite à choisir la classe tant qu’elle manque', () => {
    const label = characterMarksLabel(ONLINE_CHARACTER)

    expect(label).toBe('Choisir la classe de Alpha')
  })

  it('invite à choisir le sexe quand seule la classe est là', () => {
    const character = {
      ...ONLINE_CHARACTER,
      class: 'iop',
      gender: null
    } as const

    const label = characterMarksLabel(character)

    expect(label).toBe('Choisir le sexe de Alpha')
  })

  it('propose de changer le portrait une fois complet', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const label = characterMarksLabel(character)

    expect(label).toBe('Changer la classe, le sexe ou la couleur de Alpha')
  })
})

describe('characterMarksTooltip', () => {
  it('invite à choisir la classe tant qu’elle manque', () => {
    const tooltip = characterMarksTooltip(ONLINE_CHARACTER)

    expect(tooltip).toBe('Choisir la classe de Alpha')
  })

  it('dit seulement Modifier une fois le portrait complet', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const tooltip = characterMarksTooltip(character)

    expect(tooltip).toBe('Modifier')
  })
})

describe('characterPresenceSubLine', () => {
  it('dit la classe avant l’état', () => {
    const character = { ...ONLINE_CHARACTER, class: 'iop' } as const

    const line = characterPresenceSubLine(character)

    expect(line).toBe(`Iop · Connecté`)
  })

  it('tait l’exclusion d’un personnage connecté et exclu', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true }

    const line = characterPresenceSubLine(character)

    expect(line).toBe('Connecté')
  })

  it('dit la déconnexion d’un personnage déconnecté', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true, online: false }

    const line = characterPresenceSubLine(character)

    expect(line).toBe('Déconnecté')
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

    expect(hint).toBe('Exclure tous les hommes')
  })

  it('propose de réintégrer un sexe entièrement exclu', () => {
    const hint = genderGroupHint({
      gender: 'female',
      isEmpty: false,
      isIncluded: false
    })

    expect(hint).toBe('Réintégrer toutes les femmes')
  })

  it('dit qu’un sexe n’a personne de connecté', () => {
    const hint = genderGroupHint({
      gender: 'female',
      isEmpty: true,
      isIncluded: false
    })

    expect(hint).toBe('Aucune femme connectée')
  })
})

describe('characterStateLine', () => {
  it('dit le défilement pour un personnage connecté et dedans', () => {
    const line = characterStateLine(ONLINE_CHARACTER)

    expect(line).toBe('Connecté')
  })

  it('dit l’exclusion pour un personnage connecté et exclu', () => {
    const character = { ...ONLINE_CHARACTER, excluded: true }

    const line = characterStateLine(character)

    expect(line).toBe('Exclu')
  })

  it('dit la déconnexion avant l’exclusion pour un personnage déconnecté', () => {
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
