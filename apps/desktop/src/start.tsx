import { ErrorBoundary } from '@/components/error-boundary'
import { CLEARING } from '@/constants/world'
import { lastSeenMap } from '@/lib/map-memory'
import { loadMaps } from '@/screens/deferred-map'
import { App } from './app'
import { mount } from './boot'

const mountApp = () => {
  mount(
    'index.html',
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
}

export const start = () => {
  if (lastSeenMap() === CLEARING) {
    mountApp()
  } else {
    loadMaps().then(mountApp, mountApp)
  }
}
