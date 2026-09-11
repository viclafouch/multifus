import { createFileRoute, notFound } from '@tanstack/react-router'
import { headOf } from '@/helpers/head'
import { pageOf } from '@/helpers/page'
import { PageScreen } from '@/screens/page-screen'

const LANGUAGE = 'fr'

const SlugPage = () => {
  const { page } = Route.useLoaderData()

  return <PageScreen page={page} />
}

export const Route = createFileRoute('/$slug')({
  loader: ({ params }) => {
    const page = pageOf({ slug: params.slug, language: LANGUAGE })

    if (page === null) {
      // oxlint-disable-next-line only-throw-error -- notFound() de TanStack n'est pas une Error, c'est le signal d'un 404
      throw notFound()
    }

    return { page }
  },
  head: ({ loaderData }) => {
    return loaderData === undefined
      ? {}
      : headOf({ page: loaderData.page, language: LANGUAGE })
  },
  component: SlugPage
})
