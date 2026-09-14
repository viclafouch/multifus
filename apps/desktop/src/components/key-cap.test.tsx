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

describe('the drawn key', () => {
  it('carries the letter written on the user keyboard', () => {
    draw('KeyW', AZERTY)

    expect(screen.getByText('Z')).not.toBeNull()
  })

  it('also follows the signs an AZERTY moves', () => {
    draw('Semicolon', AZERTY)

    expect(screen.getByText('M')).not.toBeNull()
  })

  it('keeps its letters on a keyboard the system could not read', () => {
    draw('KeyW', {})

    expect(screen.getByText('W')).not.toBeNull()
  })
})
