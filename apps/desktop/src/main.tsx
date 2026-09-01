import React from 'react'
import ReactDOM from 'react-dom/client'
import { ErrorBoundary } from '@/components/error-boundary'
import { App } from './app'
import './index.css'

const rootElement = document.querySelector('#root')

if (!rootElement) {
  throw new Error('Root element #root is missing from index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
