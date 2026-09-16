import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import type { Size } from '@/@types/media'
import { ANKAMA_SOURCE_IDS, ANKAMA_SOURCES } from '@/constants/ankama'
import { PAGE_DECORS } from '@/constants/decors'
import { LOOPS, PEEK_SIZE, PEEKS, POSTER_SIZE } from '@/constants/loops'
import { PAGE_IDS } from '@/constants/pages'
import {
  HOME_SHOT,
  TASKBAR_SPLIT_SHOT,
  TASKBAR_STACKED_SHOT,
  WINDOWS_SHOT
} from '@/constants/shots'

const SERVED_FROM = '/@fs'

const RIFF_CHUNK = 12
const FOURCC_LENGTH = 4
const VP8_DIMENSIONS = 26
const VP8_FIELD = 2
const VP8X_DIMENSIONS = 24
const VP8X_FIELD = 3
const FOURTEEN_BITS = 0b11_1111_1111_1111

const AVC1_DIMENSIONS = 28
const AVC1_FIELD = 2

const webpSizeOf = (bytes: Buffer): Size => {
  const chunk = bytes.toString('ascii', RIFF_CHUNK, RIFF_CHUNK + FOURCC_LENGTH)

  if (chunk === 'VP8X') {
    return {
      width: bytes.readUIntLE(VP8X_DIMENSIONS, VP8X_FIELD) + 1,
      height: bytes.readUIntLE(VP8X_DIMENSIONS + VP8X_FIELD, VP8X_FIELD) + 1
    }
  }

  return {
    width: bytes.readUInt16LE(VP8_DIMENSIONS) & FOURTEEN_BITS,
    height: bytes.readUInt16LE(VP8_DIMENSIONS + VP8_FIELD) & FOURTEEN_BITS
  }
}

const mp4SizeOf = (bytes: Buffer): Size => {
  const stsd = bytes.indexOf('stsd', 0, 'ascii')
  const avc1 = bytes.indexOf('avc1', stsd, 'ascii')

  return {
    width: bytes.readUInt16BE(avc1 + AVC1_DIMENSIONS),
    height: bytes.readUInt16BE(avc1 + AVC1_DIMENSIONS + AVC1_FIELD)
  }
}

const sizeOnDisk = async (served: string) => {
  const bytes = await readFile(served.replace(SERVED_FROM, ''))

  return served.endsWith('.mp4') ? mp4SizeOf(bytes) : webpSizeOf(bytes)
}

const everySizeDeclared = () => {
  const declared = new Map<string, Size>(
    [HOME_SHOT, WINDOWS_SHOT, TASKBAR_STACKED_SHOT, TASKBAR_SPLIT_SHOT].map(
      ({ src, width, height }) => {
        return [src, { width, height }]
      }
    )
  )

  for (const page of PAGE_IDS) {
    const decor = PAGE_DECORS[page]

    if (decor !== null) {
      const { src, width, height } = decor

      declared.set(src, { width, height })
    }
  }

  for (const source of ANKAMA_SOURCE_IDS) {
    const { src, width, height } = ANKAMA_SOURCES[source].shot

    declared.set(src, { width, height })
  }

  for (const { source, size, poster } of Object.values(LOOPS)) {
    declared.set(source, size)
    declared.set(poster, POSTER_SIZE)
  }

  for (const peek of Object.values(PEEKS)) {
    declared.set(peek, PEEK_SIZE)
  }

  return [...declared]
}

const DECLARED = everySizeDeclared()

describe('the sizes the pages reserve', () => {
  it('finds every decor, screenshot, poster, peek and loop', () => {
    expect(DECLARED).toHaveLength(35)
  })

  it.each(DECLARED)('matches the file behind %s', async (served, size) => {
    expect(await sizeOnDisk(served)).toStrictEqual(size)
  })
})
