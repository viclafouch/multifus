import { createFileRoute } from '@tanstack/react-router'
import { headOf } from '@/helpers/head'
import { PageScreen } from '@/screens/page-screen'

const HomePage = () => {
  return <PageScreen page="home" />
}

export const Route = createFileRoute('/es/')({
  head: () => {
    return headOf({ page: 'home', language: 'es' })
  },
  component: HomePage
})
