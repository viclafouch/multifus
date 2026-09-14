import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { FOLD_ANCHOR, LOST_FILE, ROBOTS_PATH } from '../src/constants/site.ts'

const CLIENT = join(import.meta.dirname, '..', 'dist', 'client')

const SITEMAP = readFileSync(join(CLIENT, 'sitemap.xml'), 'utf8')

const SUSPENSE_ERROR = '<!--$!-->'

const located = [...SITEMAP.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((found) => {
  return new URL(found[1])
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

  return body
}

for (const pathname of addresses) {
  const html = readFileSync(fileOf(pathname), 'utf8')
  const body = checkRendered(pathname, html)
  const marked = SCHEMA.exec(html)

  if (marked === null) {
    complain(pathname, 'no schema.org markup')
  } else {
    const nodes = JSON.parse(marked[1])

    if (nodes.length === 0) {
      complain(pathname, 'an empty markup')
    }

    for (const node of nodes) {
      if (node['@context'] !== 'https://schema.org') {
        complain(pathname, `a ${node['@type']} record outside of schema.org`)
      }
    }
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

  if (!html.includes('hrefLang="x-default"')) {
    complain(pathname, 'no x-default')
  }

  if (!html.includes('rel="canonical"')) {
    complain(pathname, 'no canonical address')
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
}

if (addresses.length === 0) {
  complain('sitemap.xml', 'no address')
}

const SERVED = [
  ROBOTS_PATH,
  LOST_FILE,
  '/favicon.ico',
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

if (!missing.includes(ROBOTS_PATH)) {
  const robots = readFileSync(join(CLIENT, ROBOTS_PATH), 'utf8')

  if (!robots.includes(`Sitemap: ${host}/sitemap.xml`)) {
    complain(ROBOTS_PATH, 'no reference to the sitemap')
  }
}

if (!missing.includes(LOST_FILE)) {
  checkRendered(LOST_FILE, readFileSync(join(CLIENT, LOST_FILE), 'utf8'))
}

if (complaints.length > 0) {
  console.error(`The delivered HTML does not hold:\n${complaints.join('\n')}`)
  process.exit(1)
}

console.log(`${addresses.length} pages delivered, all complete.`)
