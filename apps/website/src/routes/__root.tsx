import carve from '@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2?url'
import { I18nProvider } from '@lingui/react'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState
} from '@tanstack/react-router'
import { Analytics } from '@vercel/analytics/react'
import { INK } from '@/constants/ink'
import { LANGUAGES, OPEN_GRAPH_LOCALES } from '@/constants/languages'
import { AUTHOR_NAME } from '@/constants/site'
import { languageOf } from '@/helpers/language'
import { SPEAKERS } from '@/lib/i18n'
import styles from '@/styles.css?url'

const CRAWL = [
  'index',
  'follow',
  'max-snippet:-1',
  'max-image-preview:large',
  'max-video-preview:-1'
].join(', ')

const RootDocument = () => {
  const pathname = useRouterState({
    select: (state) => {
      return state.location.pathname
    }
  })
  const language = languageOf(pathname)
  const others = LANGUAGES.filter((spoken) => {
    return spoken !== language
  })

  return (
    <html lang={language}>
      <head>
        {others.map((spoken) => {
          return (
            <meta
              key={spoken}
              property="og:locale:alternate"
              content={OPEN_GRAPH_LOCALES[spoken]}
            />
          )
        })}
        <HeadContent />
      </head>
      <body>
        <I18nProvider i18n={SPEAKERS[language]}>
          <Outlet />
        </I18nProvider>
        <Analytics />
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => {
    return {
      meta: [
        // oxlint-disable-next-line unicorn/text-encoding-identifier-case -- the HTML specification wants utf-8 on a meta, not the Node label utf8
        { charSet: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover'
        },
        { name: 'robots', content: CRAWL },
        { name: 'author', content: AUTHOR_NAME },
        { name: 'theme-color', content: INK.iron },
        { name: 'color-scheme', content: 'dark' },
        { name: 'application-name', content: 'Multifus' },
        { name: 'apple-mobile-web-app-title', content: 'Multifus' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      links: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48 32x32 16x16' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: carve,
          crossOrigin: 'anonymous'
        },
        { rel: 'stylesheet', href: styles }
      ]
    }
  },
  component: RootDocument
})
