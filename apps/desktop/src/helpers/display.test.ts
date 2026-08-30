import { describe, expect, it } from 'vitest'
import { DRAWN_SCREEN, WIDESCREEN } from '@/constants/display'
import { screenShape } from '@/helpers/display'
import { displayOf } from '@/test-doubles'

describe('screenShape', () => {
  it('prend le 16/9 quand aucun écran n’est encore connu', () => {
    const shape = screenShape(null)

    expect(shape.width).toBe(WIDESCREEN.width)
    expect(shape.ratio).toBe(WIDESCREEN.width / WIDESCREEN.height)
  })

  it('rend la forme de l’écran qu’on lui donne', () => {
    const shape = screenShape(displayOf({ width: 2560, height: 1440 }))

    expect(shape.width).toBe(2560)
    expect(shape.ratio).toBe(2560 / 1440)
  })

  it('dessine un écran plus large que haut à la largeur du cadre', () => {
    const shape = screenShape(displayOf({ width: 3840, height: 1080 }))

    expect(shape.drawnWidth).toBe(DRAWN_SCREEN.width)
  })

  it('rétrécit le dessin d’un écran presque carré, pour qu’il tienne en hauteur', () => {
    const shape = screenShape(displayOf({ width: 1280, height: 1024 }))

    expect(shape.drawnWidth).toBeLessThan(DRAWN_SCREEN.width)
    expect(shape.drawnWidth).toBe(DRAWN_SCREEN.height * (1280 / 1024))
  })

  it('garde le dessin dans le cadre, quel que soit l’écran', () => {
    const screens = [
      displayOf({ width: 1512, height: 982 }),
      displayOf({ width: 1920, height: 1080 }),
      displayOf({ width: 1280, height: 1024 }),
      displayOf({ width: 3440, height: 1440 })
    ]

    for (const screen of screens) {
      const shape = screenShape(screen)

      expect(shape.drawnWidth).toBeLessThanOrEqual(DRAWN_SCREEN.width)
      expect(shape.drawnWidth / shape.ratio).toBeLessThanOrEqual(
        DRAWN_SCREEN.height
      )
    }
  })
})
