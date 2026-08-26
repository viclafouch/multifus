import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react'
import type { Character } from '@/@types/roster'
import { CLASS_PORTRAITS } from '@/constants/classes'
import { strings } from '@/constants/strings'

const APPLE_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
const WINDOWS_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

const REOPEN = 'Rouvrir'

const words = strings.characters

const character = (fields: Partial<Character> = {}): Character => {
  return {
    nickname: 'Alpha',
    gender: null,
    class: null,
    asleep: false,
    online: true,
    relayed: true,
    ...fields
  }
}

type OpenParams = {
  readonly character?: Character
  readonly paintPortraits?: boolean
  readonly agent?: string
}

const open = async ({
  character: subject = character(),
  paintPortraits = true,
  agent = WINDOWS_AGENT
}: OpenParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  const { ClassDialog } = await import('@/components/class-dialog')

  const handlers = {
    handleSetGender: vi.fn<(gender: 'female' | 'male' | null) => void>(),
    handleSetClass: vi.fn(),
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
        <ClassDialog
          character={subject}
          paintPortraits={paintPortraits}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          onSetGender={handlers.handleSetGender}
          onSetClass={handlers.handleSetClass}
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
    screen.getByRole('button', { name: words.classLabel('Alpha', label) })
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

describe('la modale de classe', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('offre le sexe, les douze classes et le retrait de la classe', async () => {
    await open()

    for (const label of Object.values(words.classes)) {
      expect(
        screen.getByRole('button', { name: words.classLabel('Alpha', label) })
      ).not.toBeNull()
    }

    expect(
      screen.getByRole('button', { name: words.genders.male })
    ).not.toBeNull()
    expect(
      screen.getByRole('button', { name: words.genders.female })
    ).not.toBeNull()
    expect(
      screen.getByRole('button', { name: words.noClassLabel('Alpha') })
    ).not.toBeNull()
  })

  describe('quand le sexe est déjà connu', () => {
    const known = character({ gender: 'female', class: 'iop' })

    it('pose la classe et s’en va, sans rien demander de plus', async () => {
      const handlers = await open({ character: known })

      pickClass(words.classes.cra)

      expect(handlers.handleSetClass).toHaveBeenCalledWith('cra')
      expect(handlers.handleSetPortrait).not.toHaveBeenCalled()
      await closed()
    })

    it('montre le sexe en cours comme choisi', async () => {
      await open({ character: known })

      expect(
        screen
          .getByRole('button', { name: words.genders.female })
          .getAttribute('aria-pressed')
      ).toBe('true')
      expect(
        screen
          .getByRole('button', { name: words.genders.male })
          .getAttribute('aria-pressed')
      ).toBe('false')
    })

    it('montre la classe en cours comme choisie', async () => {
      await open({ character: known })

      expect(
        screen
          .getByRole('button', {
            name: words.classLabel('Alpha', words.classes.iop)
          })
          .getAttribute('aria-pressed')
      ).toBe('true')
    })

    it('dessine les vignettes au sexe du personnage', async () => {
      await open({ character: known })

      expect(portraitOf(words.classLabel('Alpha', words.classes.cra))).toBe(
        CLASS_PORTRAITS.cra.female
      )
    })

    it('change le sexe sans refermer, la classe reste à choisir', async () => {
      const handlers = await open({ character: known })

      fireEvent.click(screen.getByRole('button', { name: words.genders.male }))

      expect(handlers.handleSetGender).toHaveBeenCalledWith('male')
      expect(screen.getByRole('dialog')).not.toBeNull()
    })

    it('retire le sexe quand on reclique sur celui du personnage', async () => {
      const handlers = await open({ character: known })

      fireEvent.click(
        screen.getByRole('button', { name: words.genders.female })
      )

      expect(handlers.handleSetGender).toHaveBeenCalledWith(null)
    })
  })

  describe('quand le sexe manque encore', () => {
    it('demande homme ou femme avant de poser la classe', async () => {
      const handlers = await open()

      pickClass(words.classes.iop)

      expect(handlers.handleSetClass).not.toHaveBeenCalled()
      expect(handlers.handleSetPortrait).not.toHaveBeenCalled()
      expect(
        screen.getByText(words.classDialogWhich(words.classes.iop))
      ).not.toBeNull()
    })

    it('montre les deux portraits de la classe demandée', async () => {
      await open()

      pickClass(words.classes.iop)

      expect(
        portraitOf(words.classGenderLabel(words.classes.iop, 'male'))
      ).toBe(CLASS_PORTRAITS.iop.male)
      expect(
        portraitOf(words.classGenderLabel(words.classes.iop, 'female'))
      ).toBe(CLASS_PORTRAITS.iop.female)
    })

    it('pose la classe et le sexe d’un seul geste, et s’en va', async () => {
      const handlers = await open()

      pickClass(words.classes.iop)
      fireEvent.click(
        screen.getByRole('button', {
          name: words.classGenderLabel(words.classes.iop, 'female')
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

      pickClass(words.classes.iop)

      expect(
        screen.queryByRole('button', {
          name: words.classLabel('Alpha', words.classes.cra)
        })
      ).toBeNull()
    })

    it('revient aux classes sans rien avoir posé', async () => {
      const handlers = await open()

      pickClass(words.classes.iop)
      fireEvent.click(
        screen.getByRole('button', { name: words.classDialogBack })
      )

      expect(handlers.handleSetPortrait).not.toHaveBeenCalled()
      expect(handlers.handleSetClass).not.toHaveBeenCalled()
      expect(
        screen.getByRole('button', {
          name: words.classLabel('Alpha', words.classes.cra)
        })
      ).not.toBeNull()
    })

    it('dessine les vignettes en homme, faute de réponse', async () => {
      await open()

      expect(portraitOf(words.classLabel('Alpha', words.classes.cra))).toBe(
        CLASS_PORTRAITS.cra.male
      )
    })

    it('retire la classe sans demander le sexe', async () => {
      const handlers = await open()

      fireEvent.click(
        screen.getByRole('button', { name: words.noClassLabel('Alpha') })
      )

      expect(handlers.handleSetClass).toHaveBeenCalledWith(null)
      await closed()
    })

    it('pose le sexe seul, et laisse la modale ouverte pour la classe', async () => {
      const handlers = await open()

      fireEvent.click(screen.getByRole('button', { name: words.genders.male }))

      expect(handlers.handleSetGender).toHaveBeenCalledWith('male')
      expect(screen.getByRole('dialog')).not.toBeNull()
    })
  })

  describe('quand on referme sans répondre', () => {
    it('s’en va sans rien poser', async () => {
      const handlers = await open()

      fireEvent.click(
        screen.getByRole('button', { name: words.classDialogClose })
      )

      await closed()
      expect(handlers.handleSetClass).not.toHaveBeenCalled()
      expect(handlers.handleSetPortrait).not.toHaveBeenCalled()
      expect(handlers.handleSetGender).not.toHaveBeenCalled()
    })

    it('oublie la question posée, et rouvre sur les classes', async () => {
      await open()

      pickClass(words.classes.iop)
      fireEvent.click(
        screen.getByRole('button', { name: words.classDialogClose })
      )
      await closed()

      fireEvent.click(screen.getByRole('button', { name: REOPEN }))

      expect(
        screen.getByRole('button', {
          name: words.classLabel('Alpha', words.classes.cra)
        })
      ).not.toBeNull()
      expect(
        screen.queryByText(words.classDialogWhich(words.classes.iop))
      ).toBeNull()
    })
  })

  describe('ce qu’elle prévient', () => {
    it('dit qu’un Mac garde le logo Dofus sur le client', async () => {
      await open({ agent: APPLE_AGENT })

      expect(screen.getByText(words.classDialogWindowKeepsIcon)).not.toBeNull()
    })

    it('dit sur Windows que la tête de classe est coupée, quand elle l’est', async () => {
      await open({ agent: WINDOWS_AGENT, paintPortraits: false })

      expect(screen.getByText(words.classDialogPortraitOff)).not.toBeNull()
    })

    it('ne prévient de rien quand la tête va bien se poser', async () => {
      await open({ agent: WINDOWS_AGENT, paintPortraits: true })

      expect(screen.queryByText(words.classDialogPortraitOff)).toBeNull()
      expect(screen.queryByText(words.classDialogWindowKeepsIcon)).toBeNull()
    })
  })

  it('porte le pseudo du personnage', async () => {
    await open()

    expect(within(screen.getByRole('dialog')).getByText('Alpha')).not.toBeNull()
  })
})
