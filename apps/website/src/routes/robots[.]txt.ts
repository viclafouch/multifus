import { createFileRoute } from '@tanstack/react-router'
import { HOST } from '@/constants/host'

const ROBOTS = `User-agent: *
Allow: /

Sitemap: ${HOST}/sitemap.xml
`

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        return new Response(ROBOTS, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      }
    }
  }
})
