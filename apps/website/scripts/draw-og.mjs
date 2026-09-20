import path from 'node:path'
import process from 'node:process'
import { createServer } from 'vite'
import { SOURCE_ALIAS, SOURCE_PLUGINS } from '../vite.config.ts'

const server = await createServer({
  configFile: false,
  mode: 'production',
  root: path.join(import.meta.dirname, '..'),
  logLevel: 'warn',
  server: { middlewareMode: true },
  resolve: { alias: SOURCE_ALIAS },
  plugins: SOURCE_PLUGINS
})

try {
  const { drawEveryCard } = await server.ssrLoadModule('/src/og/draw.ts')
  const drawn = await drawEveryCard()

  process.stdout.write(`${drawn} Open Graph images drawn\n`)
} finally {
  await server.close()
}
