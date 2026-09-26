/// <reference types="node" />
import React from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import {
  LANDING_ANIMATIONS,
  useAlreadyLanded
} from '@/hooks/use-already-landed'

class FakeKeyframeEffect {
  constructor(private readonly locate: () => Element | null) {}

  get target() {
    return this.locate()
  }
}

class FakeCSSAnimation {
  finish = vi.fn()

  constructor(
    readonly animationName: string,
    readonly effect: FakeKeyframeEffect
  ) {}
}

const Stone = () => {
  const seat = React.useRef<HTMLDivElement>(null)

  useAlreadyLanded(seat)

  return (
    <div ref={seat}>
      <span data-testid="head" />
    </div>
  )
}

const running = (names: readonly string[], locate: () => Element | null) => {
  vi.stubGlobal('KeyframeEffect', FakeKeyframeEffect)
  vi.stubGlobal('CSSAnimation', FakeCSSAnimation)

  const animations = names.map((name) => {
    return new FakeCSSAnimation(name, new FakeKeyframeEffect(locate))
  })

  vi.spyOn(document, 'getAnimations').mockReturnValue(
    // oxlint-disable-next-line no-unsafe-type-assertion -- jsdom has no Web Animations, so the test hands over look-alikes
    animations as unknown as Animation[]
  )

  return animations
}

const headOnTheStone = () => {
  return document.querySelector('[data-testid="head"]')
}

const RETRO_CSS = join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  'packages',
  'retro',
  'src',
  'styles',
  'retro.css'
)

describe('the heads already on the stone', () => {
  it('end their landing before the first frame', () => {
    const landings = running(['alight', 'flare'], headOnTheStone)

    render(<Stone />)

    for (const landing of landings) {
      expect(landing.finish).toHaveBeenCalledTimes(1)
    }
  })

  it('leave every other animation running', () => {
    const glides = running(['glide'], headOnTheStone)

    render(<Stone />)

    for (const glide of glides) {
      expect(glide.finish).not.toHaveBeenCalled()
    }
  })

  it('leave a landing outside the stone running', () => {
    const landings = running(['alight'], () => {
      return document.body
    })

    render(<Stone />)

    for (const landing of landings) {
      expect(landing.finish).not.toHaveBeenCalled()
    }
  })

  it('name keyframes the shared style sheet defines', () => {
    const styleSheet = readFileSync(RETRO_CSS, 'utf8')

    for (const name of LANDING_ANIMATIONS) {
      expect(styleSheet).toContain(`@keyframes ${name} {`)
    }
  })
})
