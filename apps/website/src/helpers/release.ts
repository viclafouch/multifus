import * as zod from 'zod'
import type { SystemId } from '../@types/system.ts'
import { REPOSITORY_PATH } from '../constants/site.ts'

const LATEST_RELEASE = `https://api.github.com/repos/${REPOSITORY_PATH}/releases/latest`

const ANSWER_CEILING = 10_000

const SYSTEM_EXTENSIONS = {
  macos: '.dmg',
  windows: '.exe'
} as const satisfies Record<SystemId, string>

const ASSET = zod.object({
  name: zod.string(),
  browser_download_url: zod.url()
})

const RELEASE = zod.object({
  tag_name: zod.string(),
  published_at: zod.iso.datetime(),
  assets: zod.array(ASSET)
})

type Asset = zod.infer<typeof ASSET>

const VERSION_PREFIX = /^v/u

const packageOf = (assets: readonly Asset[], system: SystemId) => {
  const asset = assets.find((candidate) => {
    return candidate.name.endsWith(SYSTEM_EXTENSIONS[system])
  })

  return asset?.browser_download_url ?? null
}

export type Release = Readonly<{
  packages: Readonly<Record<SystemId, string>>
  version: string
  published: string
}>

export const latestRelease = async (): Promise<Release | null> => {
  const answer = await fetch(LATEST_RELEASE, {
    headers: { accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(ANSWER_CEILING)
  }).catch(() => {
    return null
  })

  if (answer === null || !answer.ok) {
    return null
  }

  const body: unknown = await answer.json().catch(() => {
    return null
  })

  const release = RELEASE.safeParse(body)

  if (!release.success) {
    return null
  }

  const macos = packageOf(release.data.assets, 'macos')
  const windows = packageOf(release.data.assets, 'windows')

  if (macos === null || windows === null) {
    return null
  }

  return {
    packages: { macos, windows },
    version: release.data.tag_name.replace(VERSION_PREFIX, ''),
    published: release.data.published_at
  }
}
