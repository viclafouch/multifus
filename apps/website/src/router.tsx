import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { LostScreen } from './screens/lost-screen'

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: false,
    defaultPreload: 'intent',
    defaultViewTransition: true,
    defaultNotFoundComponent: LostScreen
  })
}
