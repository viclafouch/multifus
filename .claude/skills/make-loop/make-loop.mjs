#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { parseArgs, promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const USAGE = `make-loop <source> [options]

  <source>            un chemin de fichier ou une URL http(s)

  --as <video|gif>    video par défaut, H.264 muet ; gif pour un lecteur qui
                      ne joue pas de vidéo
  --out <chemin>      le fichier à écrire, par défaut la source dans le format
  --width <points>    la largeur de sortie, par défaut celle de la source
  --fps <nombre>      les images par seconde, 50 par défaut ; en gif, un
                      diviseur de 100
  --aspect <l:h>      recadre au centre à ce rapport avant de mettre à l'échelle
  --crf <18-32>       la qualité de la vidéo, 22 par défaut, plus haut plus léger

  make-loop capture.mp4 --width 1408 --aspect 16:9
`

const DEFAULT_FRAMES_PER_SECOND = 50
const DEFAULT_CRF = 22
const CENTISECONDS_PER_SECOND = 100
const SHAPES = ['video', 'gif']

const run = async (command, args) => {
  try {
    return await execFileAsync(command, args, { maxBuffer: 1 << 26 })
  } catch (cause) {
    throw new Error(`${command} a échoué : ${cause.stderr || cause.message}`, {
      cause
    })
  }
}

const requireTools = async (shape) => {
  const missing = []
  const needed =
    shape === 'gif' ? ['ffmpeg', 'ffprobe', 'gifski'] : ['ffmpeg', 'ffprobe']

  for (const tool of needed) {
    try {
      await execFileAsync('which', [tool])
    } catch {
      missing.push(tool)
    }
  }

  if (missing.length > 0) {
    throw new Error(`${missing.join(' et ')} : brew install ffmpeg gifski`)
  }
}

const probe = async (source) => {
  const { stdout } = await run('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height',
    '-show_entries',
    'format=duration',
    '-of',
    'json',
    source
  ])

  const { streams, format } = JSON.parse(stdout)
  const stream = streams?.[0]

  if (!stream) {
    throw new Error(`aucune piste vidéo dans ${source}`)
  }

  return {
    width: stream.width,
    height: stream.height,
    duration: Number(format.duration)
  }
}

const toEven = (value) => {
  return Math.round(value / 2) * 2
}

const cropTo = ({ width, height, aspect }) => {
  if (aspect === null) {
    return { width, height }
  }

  const [wanted, over] = aspect.split(':').map(Number)

  if (!wanted || !over) {
    throw new Error(`--aspect se lit « 16:9 », pas « ${aspect} »`)
  }

  const ratio = wanted / over

  return width / height > ratio
    ? { width: toEven(height * ratio), height: toEven(height) }
    : { width: toEven(width), height: toEven(width / ratio) }
}

const renderVideo = async ({ source, filters, crf, output }) => {
  await run('ffmpeg', [
    '-y',
    '-v',
    'error',
    '-i',
    source,
    '-vf',
    filters,
    '-c:v',
    'libx264',
    '-crf',
    String(crf),
    '-preset',
    'veryslow',
    '-profile:v',
    'high',
    '-pix_fmt',
    'yuv420p',
    '-an',
    '-movflags',
    '+faststart',
    output
  ])
}

const renderGif = async ({
  source,
  filters,
  framesPerSecond,
  width,
  output
}) => {
  const folder = await mkdtemp(join(tmpdir(), 'make-loop-'))

  try {
    await run('ffmpeg', [
      '-y',
      '-v',
      'error',
      '-i',
      source,
      '-vf',
      filters,
      join(folder, 'f%06d.png')
    ])

    const frames = await readdir(folder)

    await run('gifski', [
      '--fps',
      String(framesPerSecond),
      '--quality',
      '100',
      '--motion-quality',
      '100',
      '--lossy-quality',
      '100',
      // Sans --width, gifski rabote la sortie à environ 800 × 600.
      '--width',
      String(width),
      '-o',
      output,
      ...frames.toSorted().map((frame) => {
        return join(folder, frame)
      })
    ])
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
}

const defaultOutput = (source, shape) => {
  const name = basename(new URL(source, 'file:///').pathname)
  const stem = name.slice(0, name.length - extname(name).length)

  return resolve(`${stem}.${shape === 'gif' ? 'gif' : 'mp4'}`)
}

const formatWeight = (bytes) => {
  const scale = bytes < 1_000_000 ? 1_000 : 1_000_000
  const unit = bytes < 1_000_000 ? 'Ko' : 'Mo'
  const written = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1
  }).format(bytes / scale)

  return `${written} ${unit}`
}

const convert = async ({
  source,
  output,
  shape,
  width,
  framesPerSecond,
  aspect,
  crf
}) => {
  const origin = await probe(source)
  const crop = cropTo({ ...origin, aspect })
  const outWidth = toEven(width ?? crop.width)
  const out = {
    width: outWidth,
    height: toEven((crop.height * outWidth) / crop.width)
  }
  const filters = [
    `fps=${framesPerSecond}`,
    `crop=${crop.width}:${crop.height}`,
    `scale=${out.width}:${out.height}:flags=lanczos`
  ].join(',')

  if (shape === 'gif') {
    await renderGif({
      source,
      filters,
      framesPerSecond,
      width: out.width,
      output
    })
  } else {
    await renderVideo({ source, filters, crf, output })
  }

  const { size } = await stat(output)

  return { origin, out, size }
}

const main = async () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      as: { type: 'string' },
      out: { type: 'string' },
      width: { type: 'string' },
      fps: { type: 'string' },
      aspect: { type: 'string' },
      crf: { type: 'string' },
      help: { type: 'boolean', default: false }
    }
  })

  const [source] = positionals

  if (values.help || !source) {
    process.stdout.write(USAGE)

    return
  }

  const shape = values.as ?? 'video'

  if (!SHAPES.includes(shape)) {
    throw new Error(
      `--as se lit « ${SHAPES.join(' » ou « ')} », pas « ${shape} »`
    )
  }

  const framesPerSecond = Number(values.fps ?? DEFAULT_FRAMES_PER_SECOND)

  if (shape === 'gif' && CENTISECONDS_PER_SECOND % framesPerSecond !== 0) {
    throw new Error(
      `un GIF compte ses délais en centièmes de seconde : ${framesPerSecond} images par seconde boiterait, prenez un diviseur de 100`
    )
  }

  await requireTools(shape)

  const output = values.out ? resolve(values.out) : defaultOutput(source, shape)
  const { origin, out, size } = await convert({
    source,
    output,
    shape,
    width: values.width ? Number(values.width) : null,
    framesPerSecond,
    aspect: values.aspect ?? null,
    crf: Number(values.crf ?? DEFAULT_CRF)
  })

  process.stdout.write(
    [
      `source  ${origin.width} × ${origin.height}, ${origin.duration.toFixed(2)} s`,
      `sortie  ${out.width} × ${out.height}, ${framesPerSecond} images par seconde, ${shape === 'gif' ? 'gif' : 'H.264 muet'}`,
      `poids   ${formatWeight(size)}`,
      `chemin  ${output}`,
      ''
    ].join('\n')
  )
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
