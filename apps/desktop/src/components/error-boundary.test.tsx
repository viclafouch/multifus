import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/error-boundary'
import { strings } from '@/constants/strings'
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
  afterEach(() => {
    vi.restoreAllMocks()
  })

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
    expect(screen.getByText(strings.crash.title)).not.toBeNull()
    expect(screen.getByText(strings.crash.body)).not.toBeNull()
  })

  it('montre le message de l’erreur, celui qu’on recopie dans un rapport', () => {
    drawBroken()

    expect(screen.getByText('le rendu a lâché')).not.toBeNull()
  })

  it('offre de recharger l’écran et d’ouvrir le journal', () => {
    drawBroken()

    expect(
      screen.getByRole('button', { name: strings.crash.retry })
    ).not.toBeNull()

    expect(
      screen.getByRole('button', { name: strings.crash.reveal })
    ).not.toBeNull()
  })
})
