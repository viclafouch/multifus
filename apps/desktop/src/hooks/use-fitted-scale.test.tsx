import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useFittedScale } from '@/hooks/use-fitted-scale'

const DRAWN = 320

type RuneTableProps = {
  readonly drawn: number
}

const RuneTable = ({ drawn }: RuneTableProps) => {
  useFittedScale(drawn)

  return <div>Tableau des runes</div>
}

const roomOf = (width: number) => {
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(
    width
  )
}

describe('la page taillée pour la fenêtre qui la porte', () => {
  afterEach(() => {
    document.body.removeAttribute('style')
  })

  it('grossit d’un bloc, écriture comprise, plutôt que de s’étirer', () => {
    roomOf(DRAWN * 2)

    render(<RuneTable drawn={DRAWN} />)

    expect(document.body.style.transform).toBe('scale(2)')
    expect(document.body.style.transformOrigin).toBe('top left')
    expect(document.body.style.width).toBe(`${DRAWN}px`)
  })

  it('garde la taille où elle a été dessinée quand la fenêtre y est déjà', () => {
    roomOf(DRAWN)

    render(<RuneTable drawn={DRAWN} />)

    expect(document.body.style.transform).toBe('scale(1)')
  })

  it('rapetisse d’un bloc, sans que le moteur relève l’écriture', () => {
    roomOf(DRAWN / 2)

    render(<RuneTable drawn={DRAWN} />)

    expect(document.body.style.transform).toBe('scale(0.5)')
    expect(document.body.style.zoom).toBe('')
  })

  it('ne touche à rien tant que personne n’a mesuré la fenêtre', () => {
    roomOf(0)

    render(<RuneTable drawn={DRAWN} />)

    expect(document.body.style.transform).toBe('')
    expect(document.body.style.width).toBe('')
  })
})
