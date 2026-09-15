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
  assets: zod.array(ASSET)
})

type Asset = zod.infer<typeof ASSET>

const packageOf = (assets: readonly Asset[], system: SystemId) => {
  const asset = assets.find((candidate) => {
    return candidate.name.endsWith(SYSTEM_EXTENSIONS[system])
  })

  return asset?.browser_download_url ?? null
}

export type ReleaseLinks = Readonly<Record<SystemId, string>>

export const latestReleaseLinks = async () => {
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

  return macos === null || windows === null ? null : { macos, windows }
}
