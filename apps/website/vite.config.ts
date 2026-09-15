import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import type { PageId } from './src/@types/page.ts'
import {
  LOST_FILE,
  LOST_PATH,
  RELEASES,
  ROBOTS_PATH
} from './src/constants/site.ts'
import { alternateRefsOf, everyPage } from './src/helpers/page.ts'
import { latestReleaseLinks } from './src/helpers/release.ts'

type StartPage = NonNullable<
  NonNullable<Parameters<typeof tanstackStart>[0]>['pages']
>[number]

const ASIDE_PAGES = [
  {
    path: LOST_PATH,
    sitemap: { exclude: true },
    prerender: { enabled: true, outputPath: LOST_FILE }
  },
  {
    path: ROBOTS_PATH,
    sitemap: { exclude: true },
    prerender: { enabled: true, outputPath: ROBOTS_PATH }
  }
] as const satisfies readonly StartPage[]

export const SOURCE_ALIAS = {
  '@': path.resolve(import.meta.dirname, './src')
}

export const SOURCE_PLUGINS = [
  babel({ presets: [linguiTransformerBabelPreset()] }),
  react({ compiler: true }),
  lingui({ failOnMissing: true, failOnCompileError: true })
]

const siteWrittenOn = () => {
  try {
    const day = execFileSync(
      'git',
      ['log', '-1', '--format=%cs', '--', 'src'],
      { cwd: import.meta.dirname, encoding: 'utf8' }
    ).trim()

    return day === '' ? null : day
  } catch {
    return null
  }
}

type SitemapOfParams = Readonly<{
  page: PageId
  origin: string
  day: string | null
}>

const sitemapOf = ({ page, origin, day }: SitemapOfParams) => {
  const alternateRefs = alternateRefsOf({ page, origin })

  return day === null ? { alternateRefs } : { alternateRefs, lastmod: day }
}

const originOf = (mode: string) => {
  const { VITE_SITE_URL } = loadEnv(mode, import.meta.dirname, 'VITE_')

  try {
    return new URL(VITE_SITE_URL).origin
  } catch {
    throw new Error(
      `VITE_SITE_URL missing or invalid for mode ${mode}: add it to the .env of the site`
    )
  }
}

const releaseLinksFor = async (mode: string) => {
  if (mode === 'test') {
    return null
  }

  const links = await latestReleaseLinks()
  const said =
    links === null
      ? `no published release yet, both packages point at ${RELEASES}`
      : `packages taken from ${links.macos} and ${links.windows}`

  // oxlint-disable-next-line no-console -- the build says out loud which addresses it froze into the pages
  console.log(said)

  return links
}

// oxlint-disable-next-line prefer-readonly-parameter-types -- the signature of the callback belongs to the ConfigEnv of Vite
export default defineConfig(async ({ mode }) => {
  const origin = originOf(mode)
  const day = siteWrittenOn()
  const releaseLinks = await releaseLinksFor(mode)

  return {
    define: {
      __RELEASE_LINKS__: JSON.stringify(releaseLinks)
    },
    plugins: [
      tanstackStart({
        prerender: {
          enabled: true,
          autoStaticPathsDiscovery: false,
          crawlLinks: false,
          failOnError: true
        },
        pages: [
          ...everyPage().map(({ page, path: route }) => {
            return {
              path: route,
              prerender: { enabled: true },
              sitemap: sitemapOf({ page, origin, day })
            }
          }),
          ...ASIDE_PAGES
        ],
        sitemap: {
          enabled: true,
          host: origin
        }
      }),
      tailwindcss(),
      ...SOURCE_PLUGINS
    ],
    resolve: {
      alias: SOURCE_ALIAS
    },
    server: {
      port: Number(new URL(originOf('development')).port),
      strictPort: true
    },
    test: {
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      environment: 'jsdom',
      pool: 'vmThreads',
      mockReset: true
    }
  }
})
