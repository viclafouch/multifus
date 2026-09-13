#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { parseArgs, promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const USAGE = `make-loop <source> [options]

  <source>            un chemin de fichier ou une URL http(s)

  --as <video|gif|webp>
                      video par défaut, H.264 muet ; gif pour un lecteur qui
                      ne joue pas de vidéo ; webp pour un aperçu qu'une balise
                      img joue toute seule
  --out <chemin>      le fichier à écrire, par défaut la source dans le format
  --width <points>    la largeur de sortie, par défaut celle de la source
  --fps <nombre>      les images par seconde, 50 par défaut ; en gif, un
                      diviseur de 100 ; en webp, un diviseur de 1000
  --aspect <l:h>      recadre au centre à ce rapport avant de mettre à l'échelle
  --crf <18-32>       la qualité de la vidéo, 22 par défaut, plus haut plus léger
  --quality <0-100>   la qualité du webp, 50 par défaut, plus bas plus léger
  --start <s>         entre dans la source à cette seconde
  --seconds <s>       garde au plus ce nombre de secondes
  --drop-end <s>      coupe ce nombre de secondes à la fin

  make-loop capture.mp4 --width 1408 --aspect 16:9
`

const DEFAULT_FRAMES_PER_SECOND = 50
const DEFAULT_CRF = 22
const DEFAULT_QUALITY = 50
const CENTISECONDS_PER_SECOND = 100
const MILLISECONDS_PER_SECOND = 1000
const SHAPES = {
  video: { extension: 'mp4', name: 'H.264 muet', tools: [] },
  gif: { extension: 'gif', name: 'gif', tools: ['gifski'] },
  webp: { extension: 'webp', name: 'webp animé', tools: ['img2webp'] }
}

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
  const needed = ['ffmpeg', 'ffprobe', ...SHAPES[shape].tools]

  for (const tool of needed) {
    try {
      await execFileAsync('which', [tool])
    } catch {
      missing.push(tool)
    }
  }

  if (missing.length > 0) {
    throw new Error(`${missing.join(' et ')} : brew install ffmpeg gifski webp`)
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
    return { width, height, ratio: width / height }
  }

  const [wanted, over] = aspect.split(':').map(Number)

  if (!wanted || !over) {
    throw new Error(`--aspect se lit « 16:9 », pas « ${aspect} »`)
  }

  const ratio = wanted / over

  return width / height > ratio
    ? { width: toEven(height * ratio), height: toEven(height), ratio }
    : { width: toEven(width), height: toEven(width / ratio), ratio }
}

const cutFrom = ({ source, start, kept }) => {
  return [
    '-y',
    '-v',
    'error',
    '-ss',
    String(start),
    '-i',
    source,
    '-t',
    String(kept)
  ]
}

const renderVideo = async ({ source, filters, start, kept, crf, output }) => {
  await run('ffmpeg', [
    ...cutFrom({ source, start, kept }),
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

const withFrames = async ({ source, filters, start, kept }, render) => {
  const folder = await mkdtemp(join(tmpdir(), 'make-loop-'))

  try {
    await run('ffmpeg', [
      ...cutFrom({ source, start, kept }),
      '-vf',
      filters,
      join(folder, 'f%06d.png')
    ])

    const names = await readdir(folder)

    await render(
      names.toSorted().map((name) => {
        return join(folder, name)
      })
    )
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
}

const renderWebp = async ({
  source,
  filters,
  start,
  kept,
  framesPerSecond,
  quality,
  output
}) => {
  await withFrames({ source, filters, start, kept }, async (frames) => {
    await run('img2webp', [
      '-loop',
      '0',
      '-d',
      String(MILLISECONDS_PER_SECOND / framesPerSecond),
      '-lossy',
      '-q',
      String(quality),
      '-m',
      '6',
      ...frames,
      '-o',
      output
    ])
  })
}

const renderGif = async ({
  source,
  filters,
  start,
  kept,
  framesPerSecond,
  width,
  output
}) => {
  await withFrames({ source, filters, start, kept }, async (frames) => {
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
      ...frames
    ])
  })
}

const defaultOutput = (source, shape) => {
  const name = basename(new URL(source, 'file:///').pathname)
  const stem = name.slice(0, name.length - extname(name).length)

  return resolve(`${stem}.${SHAPES[shape].extension}`)
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
  crf,
  quality,
  start,
  seconds,
  dropEnd
}) => {
  const origin = await probe(source)
  const left = origin.duration - start - dropEnd
  const kept = Math.min(left, seconds)

  if (kept <= 0) {
    throw new Error(
      `--start ${start} et --drop-end ${dropEnd} ne laisseraient rien d'une source de ${origin.duration.toFixed(2)} s`
    )
  }

  const crop = cropTo({ ...origin, aspect })
  const outWidth = toEven(width ?? crop.width)
  const out = {
    width: outWidth,
    height: toEven(outWidth / crop.ratio)
  }
  const filters = [
    `fps=${framesPerSecond}`,
    `crop=${crop.width}:${crop.height}`,
    `scale=${out.width}:${out.height}:flags=lanczos`
  ].join(',')

  switch (shape) {
    case 'gif':
      await renderGif({
        source,
        filters,
        start,
        kept,
        framesPerSecond,
        width: out.width,
        output
      })
      break
    case 'webp':
      await renderWebp({
        source,
        filters,
        start,
        kept,
        framesPerSecond,
        quality,
        output
      })
      break
    case 'video':
      await renderVideo({ source, filters, start, kept, crf, output })
      break
    default:
      throw new Error(`--as ne connaît pas « ${shape} »`)
  }

  const { size } = await stat(output)

  return { origin, out, size, kept }
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
      quality: { type: 'string' },
      start: { type: 'string' },
      seconds: { type: 'string' },
      'drop-end': { type: 'string' },
      help: { type: 'boolean', default: false }
    }
  })

  const [source] = positionals

  if (values.help || !source) {
    process.stdout.write(USAGE)

    return
  }

  const shape = values.as ?? 'video'

  if (!Object.hasOwn(SHAPES, shape)) {
    throw new Error(
      `--as se lit « ${Object.keys(SHAPES).join(' » ou « ')} », pas « ${shape} »`
    )
  }

  const framesPerSecond = Number(values.fps ?? DEFAULT_FRAMES_PER_SECOND)

  if (shape === 'gif' && CENTISECONDS_PER_SECOND % framesPerSecond !== 0) {
    throw new Error(
      `un GIF compte ses délais en centièmes de seconde : ${framesPerSecond} images par seconde boiterait, prenez un diviseur de 100`
    )
  }

  if (shape === 'webp' && MILLISECONDS_PER_SECOND % framesPerSecond !== 0) {
    throw new Error(
      `un webp animé compte ses délais en millièmes de seconde : ${framesPerSecond} images par seconde boiterait, prenez un diviseur de 1000`
    )
  }

  await requireTools(shape)

  const output = values.out ? resolve(values.out) : defaultOutput(source, shape)
  const { origin, out, size, kept } = await convert({
    source,
    output,
    shape,
    width: values.width ? Number(values.width) : null,
    framesPerSecond,
    aspect: values.aspect ?? null,
    crf: Number(values.crf ?? DEFAULT_CRF),
    quality: Number(values.quality ?? DEFAULT_QUALITY),
    start: Number(values.start ?? 0),
    seconds: Number(values.seconds ?? Infinity),
    dropEnd: Number(values['drop-end'] ?? 0)
  })

  process.stdout.write(
    [
      `source  ${origin.width} × ${origin.height}, ${origin.duration.toFixed(2)} s`,
      `sortie  ${out.width} × ${out.height}, ${kept.toFixed(2)} s, ${framesPerSecond} images par seconde, ${SHAPES[shape].name}`,
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
