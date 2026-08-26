import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { strings } from '@/constants/strings'

const EDIT_LABEL = 'Modifier le raccourci'

const APPLE_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
const WINDOWS_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

type FieldParams = {
  readonly accelerator?: string | null
  readonly isActive?: boolean
  readonly agent?: string
}

const field = async ({
  accelerator = null,
  isActive = false,
  agent = WINDOWS_AGENT
}: FieldParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: agent })

  const { ShortcutField } = await import('@/screens/shortcuts/shortcut-field')

  const editing = {
    isActive,
    handleOpen: vi.fn(),
    handleClose: vi.fn(),
    handleCapture: vi.fn<(accelerator: string | null) => void>()
  }

  render(
    <ShortcutField
      accelerator={accelerator}
      statusLine={null}
      editLabel={EDIT_LABEL}
      undo={null}
      editing={editing}
    />
  )

  return { editing, button: screen.getByRole('button', { name: EDIT_LABEL }) }
}

const keyCaps = () => {
  return [...document.querySelectorAll('kbd')].map((cap) => {
    return cap.textContent
  })
}

describe('le champ d’un raccourci', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('dessine les touches de la combinaison en cours, sur Windows', async () => {
    await field({ accelerator: 'Control+Shift+Right' })

    expect(keyCaps()).toStrictEqual(['Ctrl', 'Maj', '→'])
  })

  it('dessine les mêmes touches dans le dialecte d’un clavier Apple', async () => {
    await field({ accelerator: 'Control+Shift+Right', agent: APPLE_AGENT })

    expect(keyCaps()).toStrictEqual(['⌃', '⇧', '→'])
  })

  it('dessine les touches Commande et Option d’un clavier Apple', async () => {
    await field({ accelerator: 'Super+Alt+KeyD', agent: APPLE_AGENT })

    expect(keyCaps()).toStrictEqual(['⌥', '⌘', 'D'])
  })

  it('refuse la combinaison de collage d’un Mac sur un Mac', async () => {
    const { editing, button } = await field({
      isActive: true,
      agent: APPLE_AGENT
    })

    fireEvent.keyDown(button, { key: 'v', code: 'KeyV', metaKey: true })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      strings.shortcuts.rejected.pasteCombination
    )
  })

  it('laisse passer la combinaison de collage de Windows sur un Mac', async () => {
    const { editing, button } = await field({
      isActive: true,
      agent: APPLE_AGENT
    })

    fireEvent.keyDown(button, { key: 'v', code: 'KeyV', ctrlKey: true })

    expect(editing.handleCapture).toHaveBeenCalledWith('Control+KeyV')
  })

  it('dit qu’il n’y a rien quand aucune touche n’est posée', async () => {
    await field()

    expect(screen.getByText(strings.shortcuts.empty)).not.toBeNull()
  })

  it('ouvre la saisie au clic', async () => {
    const { editing, button } = await field()

    fireEvent.click(button)

    expect(editing.handleOpen).toHaveBeenCalledWith(expect.anything())
  })

  it('invite à frapper une combinaison une fois ouvert', async () => {
    await field({ isActive: true })

    expect(screen.getByText(strings.shortcuts.capture)).not.toBeNull()
    expect(screen.getByText(strings.shortcuts.captureHint)).not.toBeNull()
  })

  it('prend la combinaison frappée', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, {
      key: 'N',
      code: 'KeyN',
      ctrlKey: true,
      shiftKey: true
    })

    expect(editing.handleCapture).toHaveBeenCalledWith('Control+Shift+KeyN')
  })

  it('attend la suite tant que seuls des modificateurs sont tenus', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, {
      key: 'Control',
      code: 'ControlLeft',
      ctrlKey: true
    })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(keyCaps()).toStrictEqual(['Ctrl'])
  })

  it('refuse une touche frappée sans modificateur, et dit pourquoi', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, { key: 'n', code: 'KeyN' })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      strings.shortcuts.rejected.noModifier
    )
  })

  it('refuse la combinaison de collage de Windows sur Windows', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, { key: 'v', code: 'KeyV', ctrlKey: true })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      strings.shortcuts.rejected.pasteCombination
    )
  })

  it('refuse une touche que le greffon ne connaît pas', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, {
      key: 'à',
      code: 'IntlBackslash',
      ctrlKey: true
    })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      strings.shortcuts.rejected.unsupportedKey
    )
  })

  it('efface la combinaison sur Retour arrière', async () => {
    const { editing, button } = await field({
      accelerator: 'Control+Shift+Right',
      isActive: true
    })

    fireEvent.keyDown(button, { key: 'Backspace', code: 'Backspace' })

    expect(editing.handleCapture).toHaveBeenCalledWith(null)
  })

  it('referme la saisie sur Échap, sans rien changer', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, { key: 'Escape', code: 'Escape' })

    expect(editing.handleClose).toHaveBeenCalledWith()
    expect(editing.handleCapture).not.toHaveBeenCalled()
  })

  it('referme la saisie quand la ligne perd le focus', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.blur(button)

    expect(editing.handleClose).toHaveBeenCalledWith()
    expect(editing.handleCapture).not.toHaveBeenCalled()
  })

  it('ne lit plus le clavier une fois la saisie refermée', async () => {
    const { editing, button } = await field()

    fireEvent.keyDown(button, {
      key: 'N',
      code: 'KeyN',
      ctrlKey: true,
      shiftKey: true
    })

    expect(editing.handleCapture).not.toHaveBeenCalled()
  })

  it('oublie le refus dès que la combinaison suivante est bonne', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, { key: 'n', code: 'KeyN' })
    fireEvent.keyDown(button, {
      key: 'N',
      code: 'KeyN',
      ctrlKey: true,
      shiftKey: true
    })

    expect(editing.handleCapture).toHaveBeenCalledWith('Control+Shift+KeyN')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
