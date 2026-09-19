import { beforeEach, describe, expect, it, vi } from 'vitest'
import { latestRelease } from '@/helpers/release'

const DOWNLOAD =
  'https://github.com/viclafouch/multifus/releases/download/v1.0.0'

const PUBLISHED_AT = '2026-09-18T09:30:00Z'

const RELEASE = { tag_name: 'v1.0.0', published_at: PUBLISHED_AT }

const ASSETS = [
  { name: 'Multifus.app.tar.gz', browser_download_url: `${DOWNLOAD}/a.tar.gz` },
  {
    name: 'Multifus_1.0.0_universal.dmg',
    browser_download_url: `${DOWNLOAD}/b.dmg`
  },
  {
    name: 'Multifus_1.0.0_x64-setup.nsis.zip',
    browser_download_url: `${DOWNLOAD}/c.zip`
  },
  {
    name: 'Multifus_1.0.0_x64-setup.exe',
    browser_download_url: `${DOWNLOAD}/d.exe`
  },
  { name: 'latest.json', browser_download_url: `${DOWNLOAD}/latest.json` }
]

type AnswerParams = Readonly<{
  body: unknown
  ok?: boolean
}>

const githubAnswers = ({ body, ok = true }: AnswerParams) => {
  vi.stubGlobal('fetch', () => {
    return Promise.resolve({
      ok,
      json: () => {
        return Promise.resolve(body)
      }
    })
  })
}

describe('the latest release', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('takes the dmg for the Mac and the exe for Windows', async () => {
    githubAnswers({ body: { ...RELEASE, assets: ASSETS } })

    expect(await latestRelease()).toStrictEqual({
      packages: { macos: `${DOWNLOAD}/b.dmg`, windows: `${DOWNLOAD}/d.exe` },
      version: '1.0.0',
      published: PUBLISHED_AT
    })
  })

  it('reads a tag that carries no v as a version all the same', async () => {
    githubAnswers({
      body: { ...RELEASE, tag_name: '1.2.3', assets: ASSETS }
    })

    const release = await latestRelease()

    expect(release?.version).toBe('1.2.3')
  })

  it('gives nothing when one of the two systems has no package', async () => {
    githubAnswers({
      body: {
        ...RELEASE,
        assets: ASSETS.filter((asset) => {
          return !asset.name.endsWith('.exe')
        })
      }
    })

    expect(await latestRelease()).toBeNull()
  })

  it('gives nothing when no release is published yet', async () => {
    githubAnswers({ body: { message: 'Not Found' }, ok: false })

    expect(await latestRelease()).toBeNull()
  })

  it('gives nothing when GitHub answers a shape we do not know', async () => {
    githubAnswers({ body: { ...RELEASE, assets: [{ name: 'Multifus.dmg' }] } })

    expect(await latestRelease()).toBeNull()
  })

  it('gives nothing when the answer is not JSON at all', async () => {
    vi.stubGlobal('fetch', () => {
      return Promise.resolve({
        ok: true,
        json: () => {
          return Promise.reject(new SyntaxError('Unexpected token <'))
        }
      })
    })

    expect(await latestRelease()).toBeNull()
  })

  it('gives nothing when the network refuses', async () => {
    vi.stubGlobal('fetch', () => {
      return Promise.reject(new Error('offline'))
    })

    expect(await latestRelease()).toBeNull()
  })
})
