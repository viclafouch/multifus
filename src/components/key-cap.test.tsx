import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { KeyLabels } from '@/@types/system'
import { KeyCap } from '@/components/key-cap'
import { KeyLabelsProvider } from '@/components/key-labels-provider'

const AZERTY: KeyLabels = { KeyW: 'Z', Semicolon: 'M' }

const draw = (token: string, labels: KeyLabels) => {
  render(
    <KeyLabelsProvider labels={labels}>
      <KeyCap token={token} />
    </KeyLabelsProvider>
  )
}

describe('la touche dessinée', () => {
  it('porte la lettre écrite sur le clavier de l’utilisateur', () => {
    draw('KeyW', AZERTY)

    expect(screen.getByText('Z')).not.toBeNull()
  })

  it('suit aussi les signes qu’un AZERTY déplace', () => {
    draw('Semicolon', AZERTY)

    expect(screen.getByText('M')).not.toBeNull()
  })

  it('garde ses lettres sur un clavier que le système n’a pas su lire', () => {
    draw('KeyW', {})

    expect(screen.getByText('W')).not.toBeNull()
  })
})
