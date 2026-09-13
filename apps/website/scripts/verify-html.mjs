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
    complain(pathname, 'le rendu serveur a échoué, le corps est vide')
  }

  if (!body.includes('<h1')) {
    complain(pathname, 'aucun titre dans le HTML livré')
  }

  if (!html.includes('name="description"')) {
    complain(pathname, 'aucune description')
  }

  return body
}

for (const pathname of addresses) {
  const html = readFileSync(fileOf(pathname), 'utf8')
  const body = checkRendered(pathname, html)
  const marked = SCHEMA.exec(html)

  if (marked === null) {
    complain(pathname, 'aucun balisage schema.org')
  } else {
    const nodes = JSON.parse(marked[1])

    if (nodes.length === 0) {
      complain(pathname, 'un balisage vide')
    }

    for (const node of nodes) {
      if (node['@context'] !== 'https://schema.org') {
        complain(pathname, `une fiche ${node['@type']} hors de schema.org`)
      }
    }
  }

  if (!html.includes('rel="expect"')) {
    complain(pathname, 'aucune attente de rendu pour la transition')
  }

  if (!body.includes(`id="${FOLD_ANCHOR}"`)) {
    complain(pathname, `aucune bande ${FOLD_ANCHOR} à attendre`)
  }

  if (!body.includes('Ankama')) {
    complain(pathname, 'ni indépendance ni crédit d’Ankama')
  }

  if (!html.includes('hrefLang="x-default"')) {
    complain(pathname, 'aucun x-default')
  }

  if (!html.includes('rel="canonical"')) {
    complain(pathname, 'aucune adresse canonique')
  }

  const drawn = OG_IMAGE.exec(html)

  if (drawn === null) {
    complain(pathname, 'aucune image Open Graph')
  } else if (!existsSync(join(CLIENT, new URL(drawn[1]).pathname))) {
    complain(pathname, `l’image ${drawn[1]} n’est pas livrée`)
  }

  if (!html.includes('content="summary_large_image"')) {
    complain(pathname, 'la carte Twitter n’est pas en grand format')
  }

  if (!/<html lang="(?:fr|en|es)">/u.test(html)) {
    complain(pathname, 'aucune langue sur la balise html')
  }

  if (body.includes('data-offer')) {
    complain(pathname, 'la proposition de langue est dans le HTML prérendu')
  }

  const flags = [...body.matchAll(/<a\b[^>]*>/gu)]
    .map((found) => {
      return found[0]
    })
    .filter((tag) => {
      return tag.includes('class="ensign')
    })

  if (flags.length !== 3) {
    complain(pathname, `${flags.length} drapeaux au cartouche au lieu de trois`)
  }

  const lit = flags.filter((tag) => {
    return tag.includes('aria-current="page"')
  })

  if (lit.length !== 1) {
    complain(pathname, `${lit.length} drapeaux allumés au lieu d’un`)
  }
}

if (addresses.length === 0) {
  complain('sitemap.xml', 'aucune adresse')
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
  complain(name, 'absent du paquet livré')
}

if (!missing.includes(ROBOTS_PATH)) {
  const robots = readFileSync(join(CLIENT, ROBOTS_PATH), 'utf8')

  if (!robots.includes(`Sitemap: ${host}/sitemap.xml`)) {
    complain(ROBOTS_PATH, 'aucun renvoi vers le sitemap')
  }
}

if (!missing.includes(LOST_FILE)) {
  checkRendered(LOST_FILE, readFileSync(join(CLIENT, LOST_FILE), 'utf8'))
}

if (complaints.length > 0) {
  console.error(`Le HTML livré ne tient pas :\n${complaints.join('\n')}`)
  process.exit(1)
}

console.log(`${addresses.length} pages livrées, toutes complètes.`)
