import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CLIENT = join(import.meta.dirname, '..', 'dist', 'client')

const SITEMAP = join(CLIENT, 'sitemap.xml')

// The sitemap protocol names itself over http, and TanStack Start writes https.
const WRITTEN = 'xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"'

const EXPECTED = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'

rmSync(join(CLIENT, 'pages.json'), { force: true })

const sitemap = readFileSync(SITEMAP, 'utf8')

writeFileSync(SITEMAP, sitemap.replace(WRITTEN, EXPECTED))
