import React from 'react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider
} from '@tanstack/react-router'
import { render } from '@testing-library/react'

const TEST_PATHS = ['/', '/$slug', '/en', '/en/$slug', '/es', '/es/$slug']

type ShowAtParams = Readonly<{
  at: string
  children: React.ReactNode
}>

export const showAt = ({ at, children }: ShowAtParams) => {
  const root = createRootRoute()

  const leaves = TEST_PATHS.map((path) => {
    return createRoute({
      getParentRoute: () => {
        return root
      },
      path,
      component: () => {
        return null
      }
    })
  })

  const router = createRouter({
    routeTree: root.addChildren(leaves),
    history: createMemoryHistory({ initialEntries: [at] })
  })

  return render(
    <RouterContextProvider router={router}>{children}</RouterContextProvider>
  )
}
