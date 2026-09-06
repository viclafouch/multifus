import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearMocks, mockIPC } from '@tauri-apps/api/mocks'
import { characterMarks } from '@/lib/character-marks'
import { snapshotOf } from '@/test-doubles'

type Invoked = {
  readonly command: string
  readonly payload: unknown
}

const listenIPC = () => {
  const invoked: Invoked[] = []

  mockIPC((command, payload) => {
    invoked.push({ command, payload })

    return snapshotOf()
  })

  return invoked
}

const settled = async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

describe('les gestes d’un personnage', () => {
  afterEach(() => {
    clearMocks()
  })

  it('donne son genre au personnage nommé', async () => {
    const invoked = listenIPC()
    const run = vi.fn()

    characterMarks({ run }).handleSetGender('Kanpaï', 'female')
    await settled()

    expect(invoked).toStrictEqual([
      {
        command: 'set_gender',
        payload: { nickname: 'Kanpaï', gender: 'female' }
      }
    ])
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('donne sa classe, sous le nom que le Rust attend', async () => {
    const invoked = listenIPC()

    characterMarks({ run: vi.fn() }).handleSetClass('Kanpaï', 'iop')
    await settled()

    expect(invoked).toStrictEqual([
      { command: 'set_class', payload: { nickname: 'Kanpaï', class: 'iop' } }
    ])
  })

  it('donne sa couleur, et l’enlève quand elle est nulle', async () => {
    const invoked = listenIPC()
    const marks = characterMarks({ run: vi.fn() })

    marks.handleSetColor('Kanpaï', 'red')
    marks.handleSetColor('Kanpaï', null)
    await settled()

    expect(invoked).toStrictEqual([
      { command: 'set_color', payload: { nickname: 'Kanpaï', color: 'red' } },
      { command: 'set_color', payload: { nickname: 'Kanpaï', color: null } }
    ])
  })

  it('pose un portrait en deux temps, la classe puis le genre', async () => {
    const invoked = listenIPC()
    const run = vi.fn()

    characterMarks({ run }).handleSetPortrait('Kanpaï', {
      class: 'sadida',
      gender: 'female'
    })
    await settled()

    expect(
      invoked.map((call) => {
        return call.command
      })
    ).toStrictEqual(['set_class', 'set_gender'])
    expect(run).toHaveBeenCalledTimes(1)
  })
})
