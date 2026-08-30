import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useFittedZoom } from '@/hooks/use-fitted-zoom'

const DRAWN = 320

type PlateProps = {
  readonly drawn: number
}

const Plate = ({ drawn }: PlateProps) => {
  useFittedZoom(drawn)

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

    render(<Plate drawn={DRAWN} />)

    expect(document.body.style.zoom).toBe('2')
    expect(document.body.style.width).toBe(`${DRAWN}px`)
  })

  it('garde la taille où elle a été dessinée quand la fenêtre y est déjà', () => {
    roomOf(DRAWN)

    render(<Plate drawn={DRAWN} />)

    expect(document.body.style.zoom).toBe('1')
  })

  it('ne touche à rien tant que personne n’a mesuré la fenêtre', () => {
    roomOf(0)

    render(<Plate drawn={DRAWN} />)

    expect(document.body.style.zoom).toBe('')
    expect(document.body.style.width).toBe('')
  })
})
