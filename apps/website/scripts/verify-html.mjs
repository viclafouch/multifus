import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { FOLD_ANCHOR } from '../src/constants/site.ts'

const CLIENT = join(import.meta.dirname, '..', 'dist', 'client')

const SITEMAP = readFileSync(join(CLIENT, 'sitemap.xml'), 'utf8')

const SUSPENSE_ERROR = '<!--$!-->'

const addresses = [...SITEMAP.matchAll(/<loc>([^<]+)<\/loc>/gu)].map(
  (found) => {
    return new URL(found[1]).pathname
  }
)

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

for (const pathname of addresses) {
  const html = readFileSync(fileOf(pathname), 'utf8')
  const body = html.slice(html.indexOf('<body>'))
  const marked = SCHEMA.exec(html)

  if (body.includes(SUSPENSE_ERROR)) {
    complain(pathname, 'le rendu serveur a échoué, le corps est vide')
  }

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

  if (!body.includes('<h1')) {
    complain(pathname, 'aucun titre dans le HTML livré')
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

  if (!/<html lang="(?:fr|en|es)">/u.test(html)) {
    complain(pathname, 'aucune langue sur la balise html')
  }

  if (body.includes('data-offer')) {
    complain(pathname, 'la proposition de langue est dans le HTML prérendu')
  }

  const flags = [...body.matchAll(/class="ensign/gu)]

  if (flags.length !== 3) {
    complain(pathname, `${flags.length} drapeaux au cartouche au lieu de trois`)
  }

  const lit = [...body.matchAll(/aria-current="true"/gu)]

  if (lit.length !== 1) {
    complain(pathname, `${lit.length} drapeaux allumés au lieu d’un`)
  }
}

if (addresses.length === 0) {
  complain('sitemap.xml', 'aucune adresse')
}

if (complaints.length > 0) {
  console.error(`Le HTML livré ne tient pas :\n${complaints.join('\n')}`)
  process.exit(1)
}

console.log(`${addresses.length} pages livrées, toutes complètes.`)
