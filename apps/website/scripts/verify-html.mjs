import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { INK } from '../src/constants/ink.ts'
import { LANGUAGES } from '../src/constants/languages.ts'
import { FOLD_ANCHOR, LOST_FILE, ROBOTS_PATH } from '../src/constants/site.ts'
import { everyPage } from '../src/helpers/page.ts'

const CLIENT = join(import.meta.dirname, '..', 'dist', 'client')

const SITEMAP = readFileSync(join(CLIENT, 'sitemap.xml'), 'utf8')

const SUSPENSE_ERROR = '<!--$!-->'

const TITLE_CEILING = 65

const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'

const TAKES_WANTED = 2

const TAKE_PATHS = new Set(
  everyPage()
    .filter(({ page }) => {
      return page === 'download'
    })
    .map(({ path }) => {
      return path
    })
)

const KIN = new Map()

const SPOKEN = new Map()

for (const { language, path } of everyPage()) {
  SPOKEN.set(path, language)
  KIN.set(language, (KIN.get(language) ?? new Set()).add(path))
}

const takesOf = (body) => {
  return [...body.matchAll(/<a\b[^>]*href="([^"]*)"/gu)]
    .map((found) => {
      return found[1]
    })
    .filter((href) => {
      return href.includes('/releases')
    })
}

const entries = [...SITEMAP.matchAll(/<url>(.+?)<\/url>/gsu)].map((found) => {
  return found[1]
})

const located = entries.map((entry) => {
  return new URL(/<loc>([^<]+)<\/loc>/u.exec(entry)[1])
})

const addresses = located.map((url) => {
  return url.pathname
})

const host = located[0]?.origin

const fileOf = (pathname) => {
  return pathname === '/'
    ? join(CLIENT, 'index.html')
    : join(CLIENT, pathname, 'index.html')
}

const complaints = []

const complain = (pathname, what) => {
  complaints.push(`${pathname} : ${what}`)
}

const SCHEMA = /<script type="application\/ld\+json">(.+?)<\/script>/su

const OG_IMAGE = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/u

const TITLE = /<title>([^<]*)<\/title>/u

const metasOf = (html, { name, property }) => {
  const key = name === undefined ? 'property' : 'name'
  const value = name ?? property

  return [
    ...html.matchAll(
      new RegExp(`<meta[^>]*${key}="${value}"[^>]*content="([^"]*)"`, 'gu')
    )
  ].map((found) => {
    return found[1]
  })
}

const namedOf = (html, name) => {
  const [found] = metasOf(html, { name })

  return found ?? null
}

const checkRendered = (pathname, html) => {
  const body = html.slice(html.indexOf('<body>'))

  if (body.includes(SUSPENSE_ERROR)) {
    complain(pathname, 'the server render failed, the body is empty')
  }

  if (!body.includes('<h1')) {
    complain(pathname, 'no title in the delivered HTML')
  }

  if (!html.includes('name="description"')) {
    complain(pathname, 'no description')
  }

  if (!html.includes('charSet="utf-8"')) {
    complain(pathname, 'no utf-8 declared')
  }

  return body
}

const titles = new Map()

const descriptions = new Map()

const rememberOnce = ({ kept, value, pathname, what }) => {
  const taken = kept.get(value)

  if (taken === undefined) {
    kept.set(value, pathname)

    return
  }

  complain(pathname, `the same ${what} as ${taken}`)
}

for (const pathname of addresses) {
  const html = readFileSync(fileOf(pathname), 'utf8')
  const body = checkRendered(pathname, html)
  const marked = SCHEMA.exec(html)

  if (marked === null) {
    complain(pathname, 'no schema.org markup')
  } else {
    const graph = JSON.parse(marked[1])

    if (graph['@context'] !== 'https://schema.org') {
      complain(pathname, 'a graph laid outside of schema.org')
    }

    const types = (graph['@graph'] ?? []).map((node) => {
      return node['@type']
    })

    for (const wanted of ['WebSite', 'Person', 'WebPage']) {
      if (!types.includes(wanted)) {
        complain(pathname, `no ${wanted} record`)
      }
    }
  }

  const named = TITLE.exec(html)

  if (named === null) {
    complain(pathname, 'no title')
  } else {
    if (named[1].length > TITLE_CEILING) {
      complain(
        pathname,
        `a title of ${named[1].length} signs, more than ${TITLE_CEILING}`
      )
    }

    rememberOnce({ kept: titles, value: named[1], pathname, what: 'title' })
  }

  const promise = namedOf(html, 'description')

  if (promise !== null) {
    rememberOnce({
      kept: descriptions,
      value: promise,
      pathname,
      what: 'description'
    })
  }

  const crawl = namedOf(html, 'robots')

  if (crawl === null || !crawl.includes('max-image-preview:large')) {
    complain(pathname, 'no large preview allowed to the crawler')
  }

  for (const wanted of ['theme-color', 'color-scheme', 'author']) {
    if (namedOf(html, wanted) === null) {
      complain(pathname, `no ${wanted}`)
    }
  }

  for (const wanted of [
    'twitter:title',
    'twitter:description',
    'twitter:image',
    'twitter:site'
  ]) {
    if (namedOf(html, wanted) === null) {
      complain(pathname, `no ${wanted}`)
    }
  }

  const [spoken] = metasOf(html, { property: 'og:locale' })

  if (spoken === undefined || !/^[a-z]{2}_[A-Z]{2}$/u.test(spoken)) {
    complain(pathname, `og:locale reads ${spoken}, not a language and a land`)
  }

  const others = metasOf(html, { property: 'og:locale:alternate' })

  if (others.length !== LANGUAGES.length - 1) {
    complain(
      pathname,
      `${others.length} other locales named instead of ${LANGUAGES.length - 1}`
    )
  }

  if (!html.includes('rel="expect"')) {
    complain(pathname, 'no render expectation for the transition')
  }

  if (!body.includes(`id="${FOLD_ANCHOR}"`)) {
    complain(pathname, `no ${FOLD_ANCHOR} band to wait for`)
  }

  if (!body.includes('Ankama')) {
    complain(pathname, 'neither independence nor credit of Ankama')
  }

  if (TAKE_PATHS.has(pathname)) {
    const takes = takesOf(body)

    if (takes.length < TAKES_WANTED) {
      complain(
        pathname,
        `${takes.length} packages reachable without JavaScript instead of ${TAKES_WANTED}, one per system`
      )
    }
  }

  if (!html.includes('hrefLang="x-default"')) {
    complain(pathname, 'no x-default')
  }

  if (!html.includes('rel="canonical"')) {
    complain(pathname, 'no canonical address')
  }

  if (!/<link[^>]*rel="preload"[^>]*as="font"/u.test(html)) {
    complain(pathname, 'the carved font is not preloaded')
  }

  const drawn = OG_IMAGE.exec(html)

  if (drawn === null) {
    complain(pathname, 'no Open Graph image')
  } else if (!existsSync(join(CLIENT, new URL(drawn[1]).pathname))) {
    complain(pathname, `the image ${drawn[1]} is not delivered`)
  }

  if (!html.includes('content="summary_large_image"')) {
    complain(pathname, 'the Twitter card is not in large format')
  }

  if (!/<html lang="(?:fr|en|es)">/u.test(html)) {
    complain(pathname, 'no language on the html tag')
  }

  if (body.includes('data-offer')) {
    complain(pathname, 'the language offer is in the prerendered HTML')
  }

  const flags = [...body.matchAll(/<a\b[^>]*>/gu)]
    .map((found) => {
      return found[0]
    })
    .filter((tag) => {
      return tag.includes('class="ensign')
    })

  if (flags.length !== 3) {
    complain(
      pathname,
      `${flags.length} flags in the language bar instead of three`
    )
  }

  const lit = flags.filter((tag) => {
    return tag.includes('aria-current="page"')
  })

  if (lit.length !== 1) {
    complain(pathname, `${lit.length} flags lit instead of one`)
  }

  const footer = body.slice(body.lastIndexOf('<footer'))

  const led = new Set(
    [...footer.matchAll(/<a\b[^>]*href="([^"]*)"/gu)].map((found) => {
      return found[1]
    })
  )

  const unled = [...KIN.get(SPOKEN.get(pathname))].filter((kin) => {
    return !led.has(kin)
  })

  if (unled.length > 0) {
    complain(pathname, `the footer leads to no ${unled.join(', ')}`)
  }
}

if (addresses.length === 0) {
  complain('sitemap.xml', 'no address')
}

if (!SITEMAP.includes(`xmlns="${SITEMAP_NAMESPACE}"`)) {
  complain('sitemap.xml', `laid outside of ${SITEMAP_NAMESPACE}`)
}

for (const [index, entry] of entries.entries()) {
  const pathname = addresses[index]
  const alternates = [...entry.matchAll(/<xhtml:link\b[^>]*>/gu)]

  if (alternates.length !== LANGUAGES.length + 1) {
    complain(
      'sitemap.xml',
      `${alternates.length} alternates on ${pathname} instead of ${LANGUAGES.length + 1}`
    )
  }

  if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/u.test(entry)) {
    complain('sitemap.xml', `no day of last change on ${pathname}`)
  }
}

const SERVED = [
  ROBOTS_PATH,
  LOST_FILE,
  '/favicon.ico',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/site.webmanifest'
]

const missing = SERVED.filter((name) => {
  return !existsSync(join(CLIENT, name))
})

for (const name of missing) {
  complain(name, 'missing from the delivered bundle')
}

if (existsSync(join(CLIENT, 'pages.json'))) {
  complain('/pages.json', 'delivered, and nobody asked for it')
}

if (!missing.includes(ROBOTS_PATH)) {
  const robots = readFileSync(join(CLIENT, ROBOTS_PATH), 'utf8')

  if (!robots.includes(`Sitemap: ${host}/sitemap.xml`)) {
    complain(ROBOTS_PATH, 'no reference to the sitemap')
  }
}

if (!missing.includes('/site.webmanifest')) {
  const manifest = JSON.parse(
    readFileSync(join(CLIENT, 'site.webmanifest'), 'utf8')
  )

  for (const key of ['id', 'name', 'description', 'lang', 'scope', 'icons']) {
    if (manifest[key] === undefined) {
      complain('/site.webmanifest', `no ${key}`)
    }
  }

  for (const key of ['theme_color', 'background_color']) {
    if (manifest[key] !== INK.iron) {
      complain('/site.webmanifest', `${key} drifted away from INK.iron`)
    }
  }
}

if (!missing.includes(LOST_FILE)) {
  const lost = readFileSync(join(CLIENT, LOST_FILE), 'utf8')

  checkRendered(LOST_FILE, lost)

  if (namedOf(lost, 'robots') !== 'noindex') {
    complain(LOST_FILE, 'left open to the crawler')
  }
}

if (complaints.length > 0) {
  console.error(`The delivered HTML does not hold:\n${complaints.join('\n')}`)
  process.exit(1)
}

console.log(`${addresses.length} pages delivered, all complete.`)
