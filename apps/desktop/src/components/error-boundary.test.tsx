import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { reloadScreen } from '@/lib/reload'
import { ignore } from '@/lib/utils'
import { pending } from '@/test-doubles'

const bridge = {
  revealJournal: vi.fn(pending),
  screenStopped: vi.fn(pending)
}

vi.mock(import('@/lib/multifus'), () => {
  return bridge
})

vi.mock(import('@/lib/reload'), () => {
  return { reloadScreen: vi.fn() }
})

const { ErrorBoundary } = await import('@/components/error-boundary')

const Broken = () => {
  throw new Error('le rendu a lâché')
}

const drawBroken = () => {
  vi.spyOn(console, 'error').mockImplementation(ignore)

  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>
  )
}

describe('l’écran qui remplace la fenêtre blanche', () => {
  it('laisse passer ce qu’on lui confie tant que rien ne lève', () => {
    render(
      <ErrorBoundary>
        <p>La roue tourne</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('La roue tourne')).not.toBeNull()
  })

  it('dit que Multifus tourne toujours quand un rendu lève', () => {
    drawBroken()

    expect(screen.getByRole('alert')).not.toBeNull()
    expect(screen.getByText('L’écran s’est arrêté')).not.toBeNull()
    expect(screen.getByText(/Multifus, lui, tourne toujours/u)).not.toBeNull()
  })

  it('montre le message de l’erreur, celui qu’on recopie dans un rapport', () => {
    drawBroken()

    expect(screen.getByText('le rendu a lâché')).not.toBeNull()
  })

  it('écrit dans le journal, que le bouton propose ensuite d’ouvrir', () => {
    drawBroken()

    expect(bridge.screenStopped).toHaveBeenCalledWith('le rendu a lâché')
  })

  it('offre de recharger l’écran et d’ouvrir le journal', () => {
    drawBroken()

    expect(
      screen.getByRole('button', { name: 'Recharger l’écran' })
    ).not.toBeNull()

    expect(
      screen.getByRole('button', { name: 'Montrer le fichier du journal' })
    ).not.toBeNull()
  })

  it('recharge l’écran quand on le lui demande', () => {
    drawBroken()

    fireEvent.click(screen.getByRole('button', { name: 'Recharger l’écran' }))

    expect(reloadScreen).toHaveBeenCalledWith()
  })
})
