/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

const ICNS_FILE = join(
  import.meta.dirname,
  '..',
  'src-tauri',
  'icons',
  'icon.icns'
)

const BLOCK_HEADER_SIZE = 8

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const ARGB_SIGNATURE = Buffer.from('ARGB', 'ascii')

const CHUNK_OVERHEAD = 12

const BYTE_MASK = 255

const OPAQUE = 255

const EIGHT_BITS = 8

const NO_INTERLACE = 0

const ARGB_CHANNELS = 4

const LITERAL_CEILING = 128

const RUN_BIAS = 125

const CHANNELS_OF_COLOR_TYPE: Record<number, number> = {
  0: 1,
  2: 3,
  4: 2,
  6: 4
}

const ALPHA_OF_COLOR_TYPE: Record<number, number | null> = {
  0: null,
  2: null,
  4: 1,
  6: 3
}

const DRAWN_SLOTS = 10

type Block = Readonly<{
  kind: string
  body: Buffer
}>

const blocksOf = (icns: Buffer) => {
  const found: Block[] = []
  let at = BLOCK_HEADER_SIZE

  while (at + BLOCK_HEADER_SIZE <= icns.length) {
    const size = icns.readUInt32BE(at + 4)

    if (size < BLOCK_HEADER_SIZE) {
      break
    }

    found.push({
      kind: icns.toString('ascii', at, at + 4),
      body: icns.subarray(at + BLOCK_HEADER_SIZE, at + size)
    })

    at += size
  }

  return found
}

const paethOf = (left: number, above: number, corner: number) => {
  const guess = left + above - corner
  const toLeft = Math.abs(guess - left)
  const toAbove = Math.abs(guess - above)
  const toCorner = Math.abs(guess - corner)

  if (toLeft <= toAbove && toLeft <= toCorner) {
    return left
  }

  return toAbove <= toCorner ? above : corner
}

type UnfilterParams = Readonly<{
  filtered: Buffer
  stride: number
  bytesPerPixel: number
}>

const unfiltered = ({ filtered, stride, bytesPerPixel }: UnfilterParams) => {
  const rows = filtered.length / (stride + 1)
  const raw = Buffer.alloc(rows * stride)

  for (let row = 0; row < rows; row += 1) {
    const kind = filtered[row * (stride + 1)]
    const from = row * (stride + 1) + 1
    const to = row * stride

    for (let at = 0; at < stride; at += 1) {
      const value = filtered[from + at]
      const left = at >= bytesPerPixel ? raw[to + at - bytesPerPixel] : 0
      const above = row > 0 ? raw[to - stride + at] : 0
      const corner =
        row > 0 && at >= bytesPerPixel
          ? raw[to - stride + at - bytesPerPixel]
          : 0

      switch (kind) {
        case 1: {
          raw[to + at] = (value + left) & BYTE_MASK
          break
        }
        case 2: {
          raw[to + at] = (value + above) & BYTE_MASK
          break
        }
        case 3: {
          raw[to + at] = (value + Math.floor((left + above) / 2)) & BYTE_MASK
          break
        }
        case 4: {
          raw[to + at] = (value + paethOf(left, above, corner)) & BYTE_MASK
          break
        }
        default: {
          raw[to + at] = value
        }
      }
    }
  }

  return raw
}

const clearPixelsOfPng = (png: Buffer) => {
  const parts: Buffer[] = []
  let width = 0
  let channels = 0
  let alphaAt: number | null = null
  let at = PNG_SIGNATURE.length

  while (at + CHUNK_OVERHEAD <= png.length) {
    const length = png.readUInt32BE(at)
    const kind = png.toString('ascii', at + 4, at + 8)
    const body = png.subarray(at + 8, at + 8 + length)

    if (kind === 'IHDR') {
      width = body.readUInt32BE(0)
      channels = CHANNELS_OF_COLOR_TYPE[body[9]] ?? 0
      alphaAt = ALPHA_OF_COLOR_TYPE[body[9]] ?? null

      expect(body[8], 'the icon is drawn at eight bits a channel').toBe(
        EIGHT_BITS
      )
      expect(body[12], 'the icon is not interlaced').toBe(NO_INTERLACE)
    }

    if (kind === 'IDAT') {
      parts.push(body)
    }

    at += length + CHUNK_OVERHEAD
  }

  if (alphaAt === null) {
    return 0
  }

  const pixels = unfiltered({
    filtered: inflateSync(Buffer.concat(parts)),
    stride: width * channels,
    bytesPerPixel: channels
  })

  let clear = 0

  for (let step = alphaAt; step < pixels.length; step += channels) {
    if (pixels[step] !== OPAQUE) {
      clear += 1
    }
  }

  return clear
}

const runLengthDecoded = (packed: Buffer, wanted: number) => {
  const raw = Buffer.alloc(wanted)
  let read = 0
  let written = 0

  while (written < wanted && read < packed.length) {
    const control = packed[read]

    read += 1

    if (control < LITERAL_CEILING) {
      const span = control + 1

      packed.copy(raw, written, read, read + span)
      read += span
      written += span

      continue
    }

    raw.fill(packed[read], written, written + control - RUN_BIAS)
    written += control - RUN_BIAS
    read += 1
  }

  return raw
}

const clearPixelsOfArgb = (block: Buffer, pixels: number) => {
  const planes = runLengthDecoded(
    block.subarray(ARGB_SIGNATURE.length),
    pixels * ARGB_CHANNELS
  )

  let clear = 0

  for (let at = 0; at < pixels; at += 1) {
    if (planes[at] !== OPAQUE) {
      clear += 1
    }
  }

  return clear
}

const ARGB_SIDES: Record<string, number> = {
  ic04: 16,
  ic05: 32
}

const clearPixelsOf = ({ kind, body }: Block) => {
  if (body.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return clearPixelsOfPng(body)
  }

  const side = ARGB_SIDES[kind]

  return clearPixelsOfArgb(body, side * side)
}

describe('the macOS icon', () => {
  const slots = blocksOf(readFileSync(ICNS_FILE)).filter(({ kind }) => {
    return kind in ARGB_SIDES || kind.startsWith('ic')
  })

  it('carries every slot draw:icon draws', () => {
    expect(slots).toHaveLength(DRAWN_SLOTS)
  })

  it('is opaque edge to edge, so macOS 26 keeps our plate over its grey one', () => {
    const leaky = slots
      .map((slot) => {
        return { kind: slot.kind, clear: clearPixelsOf(slot) }
      })
      .filter((slot) => {
        return slot.clear > 0
      })

    expect(leaky).toStrictEqual([])
  })
})
