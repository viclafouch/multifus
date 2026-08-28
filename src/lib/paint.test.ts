import { describe, expect, it, vi } from 'vitest'
import { afterPaint } from '@/lib/paint'

const frame = async () => {
  await new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

const threeFrames = async () => {
  await frame()
  await frame()
  await frame()
}

describe('afterPaint', () => {
  it('ne travaille pas sur l’image que la page dessine déjà', async () => {
    const work = vi.fn()

    afterPaint(work)

    await frame()

    expect(work).not.toHaveBeenCalled()
  })

  it('travaille une fois la page redessinée', async () => {
    const work = vi.fn()

    afterPaint(work)

    await threeFrames()

    expect(work).toHaveBeenCalledWith()
  })

  it('renonce si on l’annule avant l’image', async () => {
    const work = vi.fn()

    afterPaint(work)()

    await threeFrames()

    expect(work).not.toHaveBeenCalled()
  })
})
