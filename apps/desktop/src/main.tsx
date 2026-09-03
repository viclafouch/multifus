import { ErrorBoundary } from '@/components/error-boundary'
import { App } from './app'
import { mount } from './boot'
import './index.css'

mount(
  'index.html',
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
