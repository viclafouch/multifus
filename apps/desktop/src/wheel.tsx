import React from 'react'
import ReactDOM from 'react-dom/client'
import './wheel.css'
import { WheelWindow } from './screens/wheel-window'

const rootElement = document.querySelector('#root')

if (!rootElement) {
  throw new Error('Root element #root is missing from wheel.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <WheelWindow />
  </React.StrictMode>
)
