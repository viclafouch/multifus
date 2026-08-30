import React from 'react'
import ReactDOM from 'react-dom/client'
import './rune-table.css'
import { RuneTableWindow } from './screens/rune-table-window'

const rootElement = document.querySelector('#root')

if (!rootElement) {
  throw new Error('Root element #root is missing from rune-table.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RuneTableWindow />
  </React.StrictMode>
)
