import React from 'react'
import ReactDOM from 'react-dom/client'
import './banner.css'
import { Banner } from './screens/banner-screen'

const rootElement = document.querySelector('#root')

if (!rootElement) {
  throw new Error('Root element #root is missing from banner.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Banner />
  </React.StrictMode>
)
