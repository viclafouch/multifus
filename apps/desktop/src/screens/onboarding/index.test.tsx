import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { Onboarding } from '@/@types/onboarding'
import { APPLE_AGENT, onboardingOf, pending, speakFrench } from '@/test-doubles'

const bridge = {
  restartOnboarding: vi.fn(pending),
  openSystemPage: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

type ShowParams = {
  readonly onboarding?: Onboarding
}

const show = async ({ onboarding = onboardingOf() }: ShowParams = {}) => {
  vi.resetModules()
  vi.stubGlobal('navigator', { userAgent: APPLE_AGENT })

  await speakFrench()

  const { OnboardingSection } = await import('@/screens/onboarding')
  const run = vi.fn()

  render(<OnboardingSection onboarding={onboarding} run={run} />)

  return run
}

describe('l’écran de la prise en main', () => {
  it('range les étapes en liste, dans l’ordre du Rust', async () => {
    await show()

    const titles = screen.getAllByRole('listitem').map((item) => {
      return item.querySelector('h2')?.textContent
    })

    expect(titles).toStrictEqual([
      'Laissez Multifus voir vos fenêtres',
      'Laissez Dofus vous prévenir',
      'Coupez « Concentration »',
      'Cochez « Notifications en arrière-plan »',
      'On essaie pour de vrai'
    ])
  })

  it('porte les cinq contrôles, chacun avec son état', async () => {
    await show()

    expect(
      screen.getByText('Laissez Multifus voir vos fenêtres')
    ).not.toBeNull()
    expect(screen.getByText('Laissez Dofus vous prévenir')).not.toBeNull()
    expect(screen.getByText('Coupez « Concentration »')).not.toBeNull()
    expect(
      screen.getByText('Cochez « Notifications en arrière-plan »')
    ).not.toBeNull()
    expect(screen.getByText('On essaie pour de vrai')).not.toBeNull()
  })

  it('ne réclame rien tant qu’aucun contrôle n’est fermé', async () => {
    await show()

    expect(screen.queryByText(/Multifus voit vos fenêtres/u)).toBeNull()
    expect(screen.queryByText(/ne peut rien faire/u)).toBeNull()
  })

  it('dit en rouge le seul contrôle que Multifus sait lire', async () => {
    await show({
      onboarding: onboardingOf({
        steps: [{ step: 'authorization', check: 'blocked', proven: false }]
      })
    })

    expect(
      screen.getByText('Multifus ne voit rien, et ne peut rien faire.')
    ).not.toBeNull()
  })

  it('ouvre la page du système de l’étape', async () => {
    const run = await show()

    fireEvent.click(
      screen.getByRole('button', { name: /Ouvrir Concentration/u })
    )

    expect(bridge.openSystemPage).toHaveBeenCalledWith('focus')
    expect(run).not.toHaveBeenCalled()
  })

  it('relance la prise en main, et attend l’instantané', async () => {
    const run = await show()

    fireEvent.click(screen.getByRole('button', { name: 'Revoir' }))

    expect(bridge.restartOnboarding).toHaveBeenCalledWith()
    expect(run).toHaveBeenCalledWith(expect.any(Promise))
  })

  it('agrandit la capture du réglage que Multifus ne peut pas lire', async () => {
    await show()

    expect(screen.queryByRole('img')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Voir l’image' }))

    const shot = screen.getByRole('img', {
      name: /Notifications en arrière-plan/u
    })

    expect(shot.getAttribute('src')).not.toBe('')
  })
})
