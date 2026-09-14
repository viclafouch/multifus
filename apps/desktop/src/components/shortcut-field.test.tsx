import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { APPLE_AGENT, WINDOWS_AGENT, speakFrench } from '@/test-doubles'

const EDIT_LABEL = 'Modifier le raccourci'

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

  await speakFrench()

  const { ShortcutField } = await import('@/components/shortcut-field')

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
  return [...document.querySelectorAll('kbd')].map((keyCap) => {
    return keyCap.textContent
  })
}

describe('the field of a shortcut', () => {
  it('draws the keys of the current combination, on Windows', async () => {
    await field({ accelerator: 'Control+Shift+Right' })

    expect(keyCaps()).toStrictEqual(['Ctrl', 'Maj', '→'])
  })

  it('draws the same keys in the dialect of an Apple keyboard', async () => {
    await field({ accelerator: 'Control+Shift+Right', agent: APPLE_AGENT })

    expect(keyCaps()).toStrictEqual(['⌃', '⇧', '→'])
  })

  it('draws the Command and Option keys of an Apple keyboard', async () => {
    await field({ accelerator: 'Super+Alt+KeyD', agent: APPLE_AGENT })

    expect(keyCaps()).toStrictEqual(['⌥', '⌘', 'D'])
  })

  it('refuses the paste combination of a Mac on a Mac', async () => {
    const { editing, button } = await field({
      isActive: true,
      agent: APPLE_AGENT
    })

    fireEvent.keyDown(button, { key: 'v', code: 'KeyV', metaKey: true })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      'C’est le raccourci pour coller sur votre ordinateur. Prenez-en un autre.'
    )
  })

  it('lets through the paste combination of Windows on a Mac', async () => {
    const { editing, button } = await field({
      isActive: true,
      agent: APPLE_AGENT
    })

    fireEvent.keyDown(button, { key: 'v', code: 'KeyV', ctrlKey: true })

    expect(editing.handleCapture).toHaveBeenCalledWith('Control+KeyV')
  })

  it('says there is nothing when no key is set', async () => {
    await field()

    expect(screen.getByText('Aucune')).not.toBeNull()
  })

  it('opens the capture on click', async () => {
    const { editing, button } = await field()

    fireEvent.click(button)

    expect(editing.handleOpen).toHaveBeenCalledWith(expect.anything())
  })

  it('invites to hit a combination once open', async () => {
    await field({ isActive: true })

    expect(screen.getByText('Appuyez sur vos touches')).not.toBeNull()
    expect(
      screen.getByText('Échap pour annuler, Retour arrière pour effacer.')
    ).not.toBeNull()
  })

  it('takes the hit combination', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, {
      key: 'N',
      code: 'KeyN',
      ctrlKey: true,
      shiftKey: true
    })

    expect(editing.handleCapture).toHaveBeenCalledWith('Control+Shift+KeyN')
  })

  it('waits for the rest while only modifiers are held', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, {
      key: 'Control',
      code: 'ControlLeft',
      ctrlKey: true
    })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(keyCaps()).toStrictEqual(['Ctrl'])
  })

  it('refuses a key hit without a modifier, and says why', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, { key: 'n', code: 'KeyN' })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      'Ajoutez Ctrl, Alt ou Maj, ou prenez une touche de fonction : F1, F2, F5… Seule, cette touche partirait dès que vous écrivez dans le jeu.'
    )
  })

  it('takes a function key hit alone, on Windows', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, { key: 'F5', code: 'F5' })

    expect(editing.handleCapture).toHaveBeenCalledWith('F5')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('refuses the same function key on a Mac, where the system holds it', async () => {
    const { editing, button } = await field({
      isActive: true,
      agent: APPLE_AGENT
    })

    fireEvent.keyDown(button, { key: 'F5', code: 'F5' })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).not.toContain(
      'touche de fonction'
    )
  })

  it('refuses the paste combination of Windows on Windows', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, { key: 'v', code: 'KeyV', ctrlKey: true })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      'C’est le raccourci pour coller sur votre ordinateur. Prenez-en un autre.'
    )
  })

  it('refuses a key the plugin does not know', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, {
      key: 'à',
      code: 'IntlBackslash',
      ctrlKey: true
    })

    expect(editing.handleCapture).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe(
      'Cette touche ne peut pas servir de raccourci.'
    )
  })

  it('clears the combination on Backspace', async () => {
    const { editing, button } = await field({
      accelerator: 'Control+Shift+Right',
      isActive: true
    })

    fireEvent.keyDown(button, { key: 'Backspace', code: 'Backspace' })

    expect(editing.handleCapture).toHaveBeenCalledWith(null)
  })

  it('closes the capture on Escape, without changing anything', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.keyDown(button, { key: 'Escape', code: 'Escape' })

    expect(editing.handleClose).toHaveBeenCalledWith()
    expect(editing.handleCapture).not.toHaveBeenCalled()
  })

  it('closes the capture when the row loses the focus', async () => {
    const { editing, button } = await field({ isActive: true })

    fireEvent.blur(button)

    expect(editing.handleClose).toHaveBeenCalledWith()
    expect(editing.handleCapture).not.toHaveBeenCalled()
  })

  it('stops reading the keyboard once the capture is closed', async () => {
    const { editing, button } = await field()

    fireEvent.keyDown(button, {
      key: 'N',
      code: 'KeyN',
      ctrlKey: true,
      shiftKey: true
    })

    expect(editing.handleCapture).not.toHaveBeenCalled()
  })

  it('forgets the refusal as soon as the next combination is good', async () => {
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
