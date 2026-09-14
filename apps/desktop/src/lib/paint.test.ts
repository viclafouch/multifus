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
  it('does not work on the frame the page is already drawing', async () => {
    const work = vi.fn()

    afterPaint(work)

    await frame()

    expect(work).not.toHaveBeenCalled()
  })

  it('works once the page is drawn again', async () => {
    const work = vi.fn()

    afterPaint(work)

    await threeFrames()

    expect(work).toHaveBeenCalledWith()
  })

  it('gives up if it is cancelled before the frame', async () => {
    const work = vi.fn()

    afterPaint(work)()

    await threeFrames()

    expect(work).not.toHaveBeenCalled()
  })
})
