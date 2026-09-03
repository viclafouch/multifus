import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { i18n } from '@lingui/core'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { CLASS_PORTRAITS } from '@/constants/classes'
import { CLASS_LABELS, COLOR_LABELS } from '@/constants/roster'
import { colorHolders } from '@/helpers/colors'
import {
  APPLE_AGENT,
  WINDOWS_AGENT,
  characterOf,
  speakFrench
} from '@/test-doubles'

const REOPEN = 'Rouvrir'

type OpenParams = {
  readonly character?: Character
  readonly paintPortraits?: boolean
  readonly agent?: string
  readonly roster?: readonly Character[]
}

const open = async ({
  character: subject = characterOf({ gender: null, class: null }),
  paintPortraits = true,
  agent = WINDOWS_AGENT,
  roster = []
}: OpenParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  await speakFrench()

  const { CharacterDialog } = await import('@/components/character-dialog')

  const handlers = {
    handleSetGender: vi.fn<(gender: Character['gender']) => void>(),
    handleSetClass: vi.fn(),
    handleSetColor: vi.fn<(color: Character['color']) => void>(),
    handleSetPortrait: vi.fn()
  }

  const Harness = () => {
    const [isOpen, setIsOpen] = React.useState(true)

    return (
      <>
        <button
          type="button"
          onClick={() => {
            setIsOpen(true)
          }}
        >
          {REOPEN}
        </button>
        <CharacterDialog
          character={subject}
          paintPortraits={paintPortraits}
          takenColors={colorHolders(roster)}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onSetGender={handlers.handleSetGender}
          onSetClass={handlers.handleSetClass}
          onSetColor={handlers.handleSetColor}
          onSetPortrait={handlers.handleSetPortrait}
        />
      </>
    )
  }

  render(<Harness />)

  return handlers
}

const pickClass = (label: string) => {
  fireEvent.click(
    screen.getByRole('button', {
      name: `Marquer Alpha comme ${label}`
    })
  )
}

const closed = async () => {
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull()
  })
}

const portraitOf = (name: string) => {
  return within(screen.getByRole('button', { name }))
    .getByRole('presentation')
    .getAttribute('src')
}

const colorButton = (label: string) => {
  return screen.getByRole('button', {
    name: `Marquer Alpha en ${label}`
  })
}

const pickColor = (label: string) => {
  fireEvent.click(colorButton(label))
}

const swatchOf = (button: HTMLElement) => {
  return button.querySelector('.swatch')
}

const readout = () => {
  const legend = screen.getByText('Couleur')

  return legend.nextElementSibling?.textContent ?? null
}

describe('la couleur, dans la modale', () => {
  it('offre les douze couleurs et le retrait de la couleur', async () => {
    await open()

    for (const label of Object.values(COLOR_LABELS).map((colour) => {
      return i18n._(colour)
    })) {
      expect(
        screen.getByRole('button', {
          name: `Marquer Alpha en ${label}`
        })
      ).not.toBeNull()
    }

    expect(
      screen.getByRole('button', {
        name: 'Retirer la couleur de Alpha'
      })
    ).not.toBeNull()
  })

  it('pose la couleur choisie', async () => {
    const handlers = await open()

    pickColor('Turquoise')

    expect(handlers.handleSetColor).toHaveBeenCalledWith('turquoise')
  })

  it('retire la couleur posée', async () => {
    const handlers = await open({
      character: characterOf({ color: 'turquoise' })
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Retirer la couleur de Alpha'
      })
    )

    expect(handlers.handleSetColor).toHaveBeenCalledWith(null)
  })

  it('reste ouverte, pour qu’on voie la couleur se poser', async () => {
    await open()

    pickColor('Rose')

    expect(screen.queryByRole('dialog')).not.toBeNull()
  })

  it('marque la couleur du personnage, et elle seule', async () => {
    await open({ character: characterOf({ color: 'pink' }) })

    expect(
      screen
        .getByRole('button', {
          name: `Marquer Alpha en Rose`
        })
        .getAttribute('aria-pressed')
    ).toBe('true')
    expect(
      screen
        .getByRole('button', {
          name: `Marquer Alpha en Bleu`
        })
        .getAttribute('aria-pressed')
    ).toBe('false')
  })

  it('marque « Aucune » quand le personnage n’a pas de couleur', async () => {
    await open()

    expect(
      screen
        .getByRole('button', {
          name: 'Retirer la couleur de Alpha'
        })
        .getAttribute('aria-pressed')
    ).toBe('true')
  })

  it('dit qui porte déjà une couleur, sans la refuser', async () => {
    const handlers = await open({
      roster: [characterOf({ nickname: 'Bravo', color: 'sky' })]
    })
    const taken = screen.getByRole('button', {
      name: 'Marquer Alpha en Ciel, déjà pris par Bravo'
    })

    fireEvent.click(taken)

    expect(handlers.handleSetColor).toHaveBeenCalledWith('sky')
  })

  it('ne se compte pas lui-même comme voleur de sa couleur', async () => {
    await open({
      character: characterOf({ nickname: 'Alpha', color: 'sky' }),
      roster: [characterOf({ nickname: 'Alpha', color: 'sky' })]
    })

    expect(
      screen.getByRole('button', {
        name: `Marquer Alpha en Ciel`
      })
    ).not.toBeNull()
    expect(readout()).toBe('Ciel')
  })
})

describe('la couleur, ce que la modale en dit', () => {
  it('nomme la couleur du personnage tant qu’on ne survole rien', async () => {
    await open({ character: characterOf({ color: 'turquoise' }) })

    expect(readout()).toBe('Turquoise')
  })

  it('dit qu’il n’y a aucune couleur quand il n’y en a pas', async () => {
    await open()

    expect(readout()).toBe('Aucune couleur')
  })

  it('nomme la couleur survolée, puis rend la parole à celle du personnage', async () => {
    await open({ character: characterOf({ color: 'turquoise' }) })
    const sky = colorButton('Ciel')

    fireEvent.pointerEnter(sky)

    expect(readout()).toBe('Ciel')

    fireEvent.pointerLeave(sky)

    expect(readout()).toBe('Turquoise')
  })

  it('nomme la couleur atteinte au clavier, sans souris', async () => {
    await open({ character: characterOf({ color: 'turquoise' }) })
    const sky = colorButton('Ciel')

    fireEvent.focus(sky)

    expect(readout()).toBe('Ciel')

    fireEvent.blur(sky)

    expect(readout()).toBe('Turquoise')
  })

  it('dit qui porte déjà la couleur survolée', async () => {
    await open({ roster: [characterOf({ nickname: 'Bravo', color: 'sky' })] })

    fireEvent.pointerEnter(
      screen.getByRole('button', {
        name: 'Marquer Alpha en Ciel, déjà pris par Bravo'
      })
    )

    expect(readout()).toBe(`Ciel · déjà pris par Bravo`)
  })

  it('allume la pastille du personnage, et elle seule', async () => {
    await open({ character: characterOf({ color: 'turquoise' }) })

    expect(swatchOf(colorButton('Turquoise'))?.hasAttribute('data-worn')).toBe(
      true
    )
    expect(swatchOf(colorButton('Ciel'))?.hasAttribute('data-worn')).toBe(false)
  })

  it('allume le retrait quand le personnage n’a pas de couleur', async () => {
    await open()
    const none = screen.getByRole('button', {
      name: 'Retirer la couleur de Alpha'
    })

    expect(swatchOf(none)?.hasAttribute('data-worn')).toBe(true)
  })

  it('marque la pastille survolée, et la rend en partant', async () => {
    await open()
    const sky = colorButton('Ciel')

    expect(swatchOf(sky)?.hasAttribute('data-hovered')).toBe(false)

    fireEvent.pointerEnter(sky)

    expect(swatchOf(sky)?.hasAttribute('data-hovered')).toBe(true)
    expect(swatchOf(colorButton('Rose'))?.hasAttribute('data-hovered')).toBe(
      false
    )

    fireEvent.pointerLeave(sky)

    expect(swatchOf(sky)?.hasAttribute('data-hovered')).toBe(false)
  })

  it('creuse la pastille qu’un autre porte déjà', async () => {
    await open({ roster: [characterOf({ nickname: 'Bravo', color: 'sky' })] })
    const taken = screen.getByRole('button', {
      name: 'Marquer Alpha en Ciel, déjà pris par Bravo'
    })

    expect(swatchOf(taken)?.hasAttribute('data-taken')).toBe(true)
    expect(swatchOf(colorButton('Rose'))?.hasAttribute('data-taken')).toBe(
      false
    )
  })

  it('porte le liseré du personnage en tête de la modale', async () => {
    await open({ character: characterOf({ color: 'violet' }) })

    expect(document.querySelector('.stripe')?.classList).toContain(
      'tint-violet'
    )
  })

  it('ne porte aucun liseré pour un personnage sans couleur', async () => {
    await open()

    expect(document.querySelector('.stripe')).toBeNull()
  })

  it('dit Aucune couleur en survolant le retrait', async () => {
    await open({ character: characterOf({ color: 'turquoise' }) })

    fireEvent.pointerEnter(
      screen.getByRole('button', {
        name: 'Retirer la couleur de Alpha'
      })
    )

    expect(readout()).toBe('Aucune couleur')
  })
})

describe('la modale de classe, à l’ouverture', () => {
  it('offre le sexe, les douze classes et le retrait de la classe', async () => {
    await open()

    for (const label of Object.values(CLASS_LABELS).map((each) => {
      return i18n._(each)
    })) {
      expect(
        screen.getByRole('button', {
          name: `Marquer Alpha comme ${label}`
        })
      ).not.toBeNull()
    }

    expect(screen.getByRole('button', { name: 'Homme' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Femme' })).not.toBeNull()
    expect(
      screen.getByRole('button', {
        name: 'Retirer la classe de Alpha'
      })
    ).not.toBeNull()
  })

  it('porte le pseudo du personnage', async () => {
    await open()
    expect(within(screen.getByRole('dialog')).getByText('Alpha')).not.toBeNull()
  })
})

describe('la modale de classe, quand le sexe est déjà connu', () => {
  const known = characterOf({ gender: 'female', class: 'iop' })

  it('pose la classe et s’en va, sans rien demander de plus', async () => {
    const handlers = await open({ character: known })

    pickClass('Crâ')

    expect(handlers.handleSetClass).toHaveBeenCalledWith('cra')
    expect(handlers.handleSetPortrait).not.toHaveBeenCalled()
    await closed()
  })

  it('montre le sexe en cours comme choisi', async () => {
    await open({ character: known })

    expect(
      screen.getByRole('button', { name: 'Femme' }).getAttribute('aria-pressed')
    ).toBe('true')
    expect(
      screen.getByRole('button', { name: 'Homme' }).getAttribute('aria-pressed')
    ).toBe('false')
  })

  it('montre la classe en cours comme choisie', async () => {
    await open({ character: known })

    expect(
      screen
        .getByRole('button', {
          name: `Marquer Alpha comme Iop`
        })
        .getAttribute('aria-pressed')
    ).toBe('true')
  })

  it('dessine les vignettes au sexe du personnage', async () => {
    await open({ character: known })

    expect(portraitOf(`Marquer Alpha comme Crâ`)).toBe(
      CLASS_PORTRAITS.cra.female
    )
  })

  it('change le sexe sans refermer, la classe reste à choisir', async () => {
    const handlers = await open({ character: known })

    fireEvent.click(screen.getByRole('button', { name: 'Homme' }))

    expect(handlers.handleSetGender).toHaveBeenCalledWith('male')
    expect(screen.getByRole('dialog')).not.toBeNull()
  })

  it('retire le sexe quand on reclique sur celui du personnage', async () => {
    const handlers = await open({ character: known })

    fireEvent.click(screen.getByRole('button', { name: 'Femme' }))

    expect(handlers.handleSetGender).toHaveBeenCalledWith(null)
  })
})

describe('la modale de classe, quand le sexe manque encore', () => {
  it('demande homme ou femme avant de poser la classe', async () => {
    const handlers = await open()

    pickClass('Iop')

    expect(handlers.handleSetClass).not.toHaveBeenCalled()
    expect(handlers.handleSetPortrait).not.toHaveBeenCalled()
    expect(screen.getByText('Iop : homme ou femme ?')).not.toBeNull()
  })

  it('montre les deux portraits de la classe demandée', async () => {
    await open()

    pickClass('Iop')

    expect(portraitOf('Iop homme')).toBe(CLASS_PORTRAITS.iop.male)
    expect(portraitOf('Iop femme')).toBe(CLASS_PORTRAITS.iop.female)
  })

  it('pose la classe et le sexe d’un seul geste, et s’en va', async () => {
    const handlers = await open()

    pickClass('Iop')
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Iop femme'
      })
    )

    expect(handlers.handleSetPortrait).toHaveBeenCalledWith({
      class: 'iop',
      gender: 'female'
    })
    expect(handlers.handleSetClass).not.toHaveBeenCalled()
    await closed()
  })

  it('range les douze classes hors de vue le temps de la question', async () => {
    await open()

    pickClass('Iop')

    expect(
      screen.queryByRole('button', {
        name: `Marquer Alpha comme Crâ`
      })
    ).toBeNull()
  })

  it('revient aux classes sans rien avoir posé', async () => {
    const handlers = await open()

    pickClass('Iop')
    fireEvent.click(screen.getByRole('button', { name: 'Changer de classe' }))

    expect(handlers.handleSetPortrait).not.toHaveBeenCalled()
    expect(handlers.handleSetClass).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', {
        name: `Marquer Alpha comme Crâ`
      })
    ).not.toBeNull()
  })

  it('dessine les vignettes en homme, faute de réponse', async () => {
    await open()

    expect(portraitOf(`Marquer Alpha comme Crâ`)).toBe(CLASS_PORTRAITS.cra.male)
  })

  it('retire la classe sans demander le sexe', async () => {
    const handlers = await open()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Retirer la classe de Alpha'
      })
    )

    expect(handlers.handleSetClass).toHaveBeenCalledWith(null)
    await closed()
  })

  it('pose le sexe seul, et laisse la modale ouverte pour la classe', async () => {
    const handlers = await open()

    fireEvent.click(screen.getByRole('button', { name: 'Homme' }))

    expect(handlers.handleSetGender).toHaveBeenCalledWith('male')
    expect(screen.getByRole('dialog')).not.toBeNull()
  })
})

describe('la modale de classe, quand on referme sans répondre', () => {
  it('s’en va sans rien poser', async () => {
    const handlers = await open()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Fermer sans rien changer'
      })
    )

    await closed()
    expect(handlers.handleSetClass).not.toHaveBeenCalled()
    expect(handlers.handleSetPortrait).not.toHaveBeenCalled()
    expect(handlers.handleSetGender).not.toHaveBeenCalled()
  })

  it('oublie la question posée, et rouvre sur les classes', async () => {
    await open()

    pickClass('Iop')
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Fermer sans rien changer'
      })
    )
    await closed()

    fireEvent.click(screen.getByRole('button', { name: REOPEN }))

    expect(
      screen.getByRole('button', {
        name: `Marquer Alpha comme Crâ`
      })
    ).not.toBeNull()
    expect(screen.queryByText('Iop : homme ou femme ?')).toBeNull()
  })
})

describe('la modale de classe, ce qu’elle prévient', () => {
  it('dit qu’un Mac garde le logo Dofus sur le client', async () => {
    await open({ agent: APPLE_AGENT })

    expect(
      screen.getByText(
        'Sur macOS, la tête reste ici : le client garde son logo Dofus.'
      )
    ).not.toBeNull()
  })

  it('dit sur Windows que la tête de classe est coupée, quand elle l’est', async () => {
    await open({ agent: WINDOWS_AGENT, paintPortraits: false })

    expect(
      screen.getByText(
        'La tête de classe est coupée dans les Paramètres : le client garde son logo Dofus.'
      )
    ).not.toBeNull()
  })

  it('ne prévient de rien quand la tête va bien se poser', async () => {
    await open({ agent: WINDOWS_AGENT, paintPortraits: true })

    expect(
      screen.queryByText(
        'La tête de classe est coupée dans les Paramètres : le client garde son logo Dofus.'
      )
    ).toBeNull()
    expect(
      screen.queryByText(
        'Sur macOS, la tête reste ici : le client garde son logo Dofus.'
      )
    ).toBeNull()
  })
})
