import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/error-boundary'
import { lastSeenScreen, rememberScreen } from '@/lib/screen-memory'
import { ignore } from '@/lib/utils'

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

  it('offre de recharger l’écran et d’ouvrir le journal', () => {
    drawBroken()

    expect(
      screen.getByRole('button', { name: 'Recharger l’écran' })
    ).not.toBeNull()

    expect(
      screen.getByRole('button', { name: 'Montrer le fichier du journal' })
    ).not.toBeNull()
  })

  it('oublie l’écran qui vient de casser avant de recharger', () => {
    const reload = vi.fn()

    rememberScreen('settings')
    vi.stubGlobal('location', { reload })
    drawBroken()

    fireEvent.click(screen.getByRole('button', { name: 'Recharger l’écran' }))

    expect(lastSeenScreen()).toBe('characters')
    expect(reload).toHaveBeenCalledWith()
  })
})
