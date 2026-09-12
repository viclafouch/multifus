import { I18nProvider } from '@lingui/react'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState
} from '@tanstack/react-router'
import { languageOf } from '@/helpers/language'
import { SPEAKERS } from '@/lib/i18n'
import styles from '@/styles.css?url'

const RootDocument = () => {
  const pathname = useRouterState({
    select: (state) => {
      return state.location.pathname
    }
  })
  const language = languageOf(pathname)

  return (
    <html lang={language}>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nProvider i18n={SPEAKERS[language]}>
          <Outlet />
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  )
}

const SPECULATION = JSON.stringify({
  prefetch: [{ where: { href_matches: '/*' }, eagerness: 'moderate' }]
})

export const Route = createRootRoute({
  head: () => {
    return {
      meta: [
        { charSet: 'utf8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      links: [{ rel: 'stylesheet', href: styles }],
      scripts: [{ type: 'speculationrules', children: SPECULATION }]
    }
  },
  component: RootDocument
})
